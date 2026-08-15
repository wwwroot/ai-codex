# Language Standards & Code Quality — Zig 0.13+

> Production-grade Zig standards, allocator architecture, error union discipline, and memory leak prevention.

---

## 1. Target Version & Toolchain

- **Language Version**: Zig 0.13+ (stable toolchain)
- **Formatting**: `zig fmt --check .` (zero style debates, strictly enforced)
- **Build System**: `zig build` driven by `build.zig`
- **Compiler Checks**: Strict warning and error enforcement (`-Werror`)

---

## 2. Memory Allocator Architecture

Every component requiring memory allocation must explicitly accept an allocator in its `init` function:

```zig
const std = @import("std");
const Allocator = std.mem.Allocator;

pub const SessionStore = struct {
    allocator: Allocator,
    sessions: std.StringHashMap(SessionData),

    pub const SessionData = struct {
        user_id: u64,
        created_at: i64,
        token: []const u8,
    };

    pub fn init(allocator: Allocator) SessionStore {
        return .{
            .allocator = allocator,
            .sessions = std.StringHashMap(SessionData).init(allocator),
        };
    }

    pub fn deinit(self: *SessionStore) void {
        var it = self.sessions.iterator();
        while (it.next()) |entry| {
            self.allocator.free(entry.key_ptr.*);
            self.allocator.free(entry.value_ptr.token);
        }
        self.sessions.deinit();
    }

    pub fn putSession(self: *SessionStore, session_id: []const u8, user_id: u64, token: []const u8) !void {
        const owned_id = try self.allocator.dupe(u8, session_id);
        errdefer self.allocator.free(owned_id);

        const owned_token = try self.allocator.dupe(u8, token);
        errdefer self.allocator.free(owned_token);

        try self.sessions.put(owned_id, .{
            .user_id = user_id,
            .created_at = std.time.timestamp(),
            .token = owned_token,
        });
    }
};
```

---

## 3. Allocator Strategy Selection

| Allocator | Characteristics | Ideal Use Case |
| :--- | :--- | :--- |
| **`ArenaAllocator`** | Fast $O(1)$ bulk deallocation; individual frees are no-ops. | Request-scoped HTTP handlers, CLI commands, AST parsing. |
| **`FixedBufferAllocator`** | Allocates from a static stack array; zero heap syscalls. | Embedded devices, ultra-low-latency packet buffers. |
| **`GeneralPurposeAllocator`** | Thread-safe, detects leaks, prevents use-after-free. | Long-lived server process root allocator. |
| **`std.testing.allocator`** | Tracks every byte allocated; fails test on memory leak. | Unit and integration test suites (`zig test`). |
| **`std.heap.page_allocator`** | Direct OS virtual memory mapping (`mmap`/`VirtualAlloc`). | Base allocator for custom large chunk allocators. |

---

## 4. Error Handling & Defer Discipline

1. **Explicit Error Sets**:
   ```zig
   pub const NetworkError = error{
       ConnectionRefused,
       TimedOut,
       BufferOverflow,
       InvalidHeader,
       OutOfMemory,
   };
   ```
2. **Immediate Cleanup Placement**: Place `defer` and `errdefer` on the exact next line after acquisition:
   ```zig
   pub fn readConfigFile(allocator: Allocator, file_path: []const u8) ![]u8 {
       const file = try std.fs.cwd().openFile(file_path, .{ .mode = .read_only });
       defer file.close();

       const stat = try file.stat();
       const buffer = try allocator.alloc(u8, stat.size);
       errdefer allocator.free(buffer);

       const bytes_read = try file.readAll(buffer);
       if (bytes_read != stat.size) {
           return error.UnexpectedEndOfFile;
       }

       return buffer;
   }
   ```

---

## 5. Generic Types with Comptime

```zig
pub fn RingBuffer(comptime T: type, comptime capacity: usize) type {
    comptime {
        if (capacity == 0) @compileError("RingBuffer capacity must be greater than zero");
    }

    return struct {
        const Self = @This();

        buffer: [capacity]T = undefined,
        head: usize = 0,
        tail: usize = 0,
        count: usize = 0,

        pub fn push(self: *Self, item: T) error{BufferFull}!void {
            if (self.count == capacity) return error.BufferFull;
            self.buffer[self.head] = item;
            self.head = (self.head + 1) % capacity;
            self.count += 1;
        }

        pub fn pop(self: *Self) error{BufferEmpty}!T {
            if (self.count == 0) return error.BufferEmpty;
            const item = self.buffer[self.tail];
            self.tail = (self.tail + 1) % capacity;
            self.count -= 1;
            return item;
        }
    };
}
```

---

## 6. Anti-Patterns & Pitfalls Table

| Anti-Pattern | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Returning Slice of Stack Array** | Stack frame pop leaves dangling pointer ($\rightarrow$ segmentation fault). | Return a fixed-size array by value, or allocate on heap via explicit `Allocator`. |
| **Missing `errdefer` on Multi-Allocation** | Early return on second allocation leaks the first allocation. | Add `errdefer allocator.free(first)` immediately after first allocation. |
| **Global Allocator Dependency** | Destroys testability and prevents custom allocator injection. | Pass `allocator: std.mem.Allocator` explicitly into all structs and functions. |
| **Silent Ignored Errors (`_ = func()`)** | Hides critical system failures and leads to undefined state. | Explicitly handle errors with `try`, `catch`, or documented `catch unreachable`. |
| **Using `@intCast` Blindly** | Triggers runtime safety panic if value exceeds target integer bounds. | Check bounds explicitly or use `std.math.cast` to return an optional. |
