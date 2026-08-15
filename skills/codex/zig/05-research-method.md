# Research Method & Diagnostics — Zig 0.13+

> Testing methodology, memory leak validation, fuzzing, and production release modes.

---

## 1. Unit Testing & Leak Detection Protocol

Always use `std.testing.allocator` inside tests. If a single byte is leaked, `zig test` fails immediately with a full stack trace of the allocation site:

```zig
const std = @import("std");
const testing = std.testing;

test "SessionStore correctly cleans up all allocated entries" {
    var store = SessionStore.init(testing.allocator);
    defer store.deinit();

    try store.putSession("session_abc123", 42, "bearer_xyz987");

    const entry = store.sessions.get("session_abc123");
    try testing.expect(entry != null);
    try testing.expectEqual(@as(u64, 42), entry.?.user_id);
    try testing.expectEqualStrings("bearer_xyz987", entry.?.token);
}
```

---

## 2. Release Modes & Optimization Matrix

| Mode | Command Flag | Optimizations | Safety Checks | Best Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **`Debug`** | `-O Debug` | None | Active | Daily development, fast compilation |
| **`ReleaseSafe`** | `-O ReleaseSafe` | Active | Active | **Recommended for production services** (detects UB & panics safely) |
| **`ReleaseFast`** | `-O ReleaseFast` | Maximum (AVX2/SIMD) | Disabled | High-throughput data processing, verified math kernels |
| **`ReleaseSmall`** | `-O ReleaseSmall` | Code size | Disabled | Microcontrollers, WASM, bootloaders |

---

## 3. Profiling with Tracy Profiler

Integrate the Tracy profiler for nanosecond-precision frame and function timing:

```zig
// In build.zig, link tracy client C++ source
// In source code:
const tracy = @import("tracy");

pub fn processBatch(data: []const u8) void {
    const zone = tracy.ZoneN(@src(), "processBatch");
    defer zone.End();

    // Perform high-throughput computation
}
```

---

## 4. Production Readiness Checklist

- [ ] **Memory Leak Check**: Verified all tests pass cleanly with `std.testing.allocator` (`zig build test`).
- [ ] **No Undefined Behavior**: Verified execution under `ReleaseSafe` without runtime panics.
- [ ] **Target Matrix**: Tested cross-compilation on Linux x86_64, aarch64, and macOS targets (`zig build -Dtarget=x86_64-linux-musl`).
- [ ] **Stripped Binary**: Stripped debug symbols for minimal release size (`zig build -Doptimize=ReleaseSafe -Dstrip=true`).
