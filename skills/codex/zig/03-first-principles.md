# First Principles — Zero-Hidden Control Flow & Hardware Semantics

> Deep dive into memory layouts, CPU cache alignment, comptime execution, and C ABI interoperability.

---

## 1. Zero Hidden Control Flow

In Zig, there are no hidden execution costs or invisible branches:

```
Language Feature        C++ / Rust / Go              Zig 0.13+
──────────────────────────────────────────────────────────────────────────
Operator Overloading    Supported (+, [], *)         NEVER (Explicit functions)
Hidden Exceptions       Unwind tables / Panics       NEVER (Errors are return values)
Property Getters        Transparent property get     NEVER (Must be explicit fn call)
Hidden Memory Alloc     new / Box / make             NEVER (Must pass Allocator)
Destructors             Automatic on scope exit      NEVER (Explicit defer/deinit)
```

**Mechanical Sympathy Rule**: When reading a line of Zig code, you can determine its CPU instruction cost and memory footprint without inspecting hidden compiler-generated code.

---

## 2. Memory Struct Alignment & Layouts

Zig provides three explicit struct layouts:

### 2.1. Standard Structs (`struct`)
- The compiler reorders fields to minimize padding and optimize CPU cache line packing.

### 2.2. Extern Structs (`extern struct`)
- Matches the target platform's **C ABI layout exactly**.
- Essential for OS syscalls, C library bindings, and foreign function interfaces (FFI).

```zig
pub const EpollEvent = extern struct {
    events: u32,
    data: u64,
};
```

### 2.3. Packed Structs (`packed struct`)
- Bit-level layout with **zero padding**.
- Exact representation of network protocol packet headers, hardware registers, and bitfields.

```zig
pub const IPv4Header = packed struct {
    version: u4 = 4,
    ihl: u4 = 5,
    dscp: u6 = 0,
    ecn: u2 = 0,
    total_length: u16,
    identification: u16,
    flags: u3,
    fragment_offset: u13,
    ttl: u8,
    protocol: u8,
    checksum: u16,
    src_ip: u32,
    dst_ip: u32,
};
```

---

## 3. Comptime Metaprogramming & Type Reflection

Compile-time execution is standard Zig code executed in the compiler's comptime interpreter:

```zig
const std = @import("std");

pub fn serializeStruct(comptime T: type, value: T, writer: anytype) !void {
    const type_info = @typeInfo(T);
    switch (type_info) {
        .Struct => |struct_info| {
            inline for (struct_info.fields) |field| {
                const field_val = @field(value, field.name);
                switch (@typeInfo(field.type)) {
                    .Int, .Float => try writer.print("{s}={d}\n", .{ field.name, field_val }),
                    .Pointer => |ptr| {
                        if (ptr.size == .Slice and ptr.child == u8) {
                            try writer.print("{s}=\"{s}\"\n", .{ field.name, field_val });
                        }
                    },
                    else => @compileError("Unsupported serialization type for field: " ++ field.name),
                }
            }
        },
        else => @compileError("serializeStruct only accepts struct types"),
    }
}
```

---

## 4. SIMD & Vector Hardware Optimization

Zig provides first-class language primitives for SIMD (Single Instruction, Multiple Data) vectorization:

```zig
pub fn dotProductSIMD(a: []const f32, b: []const f32) f32 {
    std.debug.assert(a.len == b.len);
    const VectorLen = 8; // 8 x 32-bit floats = 256-bit AVX2 register
    const Vec = @Vector(VectorLen, f32);

    var sum_vec: Vec = @splat(0.0);
    var i: usize = 0;

    while (i + VectorLen <= a.len) : (i += VectorLen) {
        const va: Vec = a[i..][0..VectorLen].*;
        const vb: Vec = b[i..][0..VectorLen].*;
        sum_vec += va * vb;
    }

    var total: f32 = @reduce(.Add, sum_vec);

    // Process remaining scalar elements
    while (i < a.len) : (i += 1) {
        total += a[i] * b[i];
    }

    return total;
}
```
