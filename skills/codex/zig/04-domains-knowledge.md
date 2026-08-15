# Domain Knowledge & Systems Engineering — Zig 0.13+

> Architecture patterns for deterministic storage engines, high-throughput I/O, build.zig systems, and cross-compilation.

---

## 1. TigerBeetle-Style Deterministic Storage Architecture

TigerBeetle proves that Zig can achieve millions of financial transactions per second with zero garbage collection pauses and deterministic memory layouts:

### Core Deterministic Principles:
1. **Static Memory Pre-Allocation**: Allocate all working memory at server startup. Zero dynamic heap allocations during steady-state processing.
2. **Fixed-Size Records**: Every account, transfer, and message is a fixed-size packed struct.
3. **Direct I/O (`O_DIRECT`)**: Bypass the OS page cache to eliminate unpredictable kernel flush latency.

```zig
const std = @import("std");

pub const Account = extern struct {
    id: u128,
    user_data_128: u128,
    debits_posted: u64,
    credits_posted: u64,
    flags: u32,
    code: u32,
    reserved: [32]u8 = [_]u8{0} ** 32,
};

pub const StorageEngine = struct {
    const SectorSize = 4096;
    file: std.fs.File,
    aligned_buffer: []align(SectorSize) u8,

    pub fn init(allocator: std.mem.Allocator, path: []const u8) !StorageEngine {
        const file = try std.fs.cwd().createFile(path, .{
            .read = true,
            .truncate = false,
        });

        // 4096-byte aligned buffer for direct block I/O
        const buffer = try allocator.alignedAlloc(u8, SectorSize, SectorSize * 1024);

        return .{
            .file = file,
            .aligned_buffer = buffer,
        };
    }

    pub fn deinit(self: *StorageEngine, allocator: std.mem.Allocator) void {
        allocator.free(self.aligned_buffer);
        self.file.close();
    }
};
```

---

## 2. High-Throughput Network Server Architecture

```zig
const std = @import("std");
const net = std.net;
const posix = std.posix;

pub const EchoServer = struct {
    allocator: std.mem.Allocator,
    listener: net.Server,

    pub fn init(allocator: std.mem.Allocator, port: u16) !EchoServer {
        const address = net.Address.initIp4(.{ 0, 0, 0, 0 }, port);
        const server = try address.listen(.{
            .reuse_address = true,
            .kernel_backlog = 1024,
        });

        return .{
            .allocator = allocator,
            .listener = server,
        };
    }

    pub fn run(self: *EchoServer) !void {
        while (true) {
            const connection = try self.listener.accept();
            // In production, delegate to worker pool or io_uring event loop
            try self.handleConnection(connection);
        }
    }

    fn handleConnection(self: *EchoServer, conn: net.Server.Connection) !void {
        defer conn.stream.close();

        var arena = std.heap.ArenaAllocator.init(self.allocator);
        defer arena.deinit();
        const arena_allocator = arena.allocator();

        var buffer: [8192]u8 = undefined;
        while (true) {
            const bytes_read = try conn.stream.read(&buffer);
            if (bytes_read == 0) break; // Client disconnected

            const response = try std.fmt.allocPrint(arena_allocator, "ECHO: {s}", .{buffer[0..bytes_read]});
            try conn.stream.writeAll(response);
        }
    }
};
```

---

## 3. `build.zig` System & Multi-Target Cross-Compilation

Zig's build system is written in 100% standard Zig code without Makefiles or CMake:

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // 1. Executable Definition
    const exe = b.addExecutable(.{
        .name = "server",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    b.installArtifact(exe);

    // 2. Run Step
    const run_cmd = b.addRunArtifact(exe);
    run_cmd.step.dependOn(b.getInstallStep());
    const run_step = b.step("run", "Run the application server");
    run_step.dependOn(&run_cmd.step);

    // 3. Unit Test Step
    const unit_tests = b.addTest(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    const run_unit_tests = b.addRunArtifact(unit_tests);
    const test_step = b.step("test", "Run all unit tests with leak detection");
    test_step.dependOn(&run_unit_tests.step);
}
```
