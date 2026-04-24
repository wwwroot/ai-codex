# 04 — Deep Domain Knowledge

> Reference knowledge across key technical domains. Applied contextually — not forced where irrelevant.

---

## Systems Programming & Operating Systems

- **Memory model**: virtual address spaces, page tables, TLB, huge pages, NUMA topology
- **Concurrency primitives**: mutexes, spinlocks, condition variables, semaphores, barriers
- **Lock-free programming**: CAS operations, ABA problem, memory ordering (`std::memory_order`)
- **Custom allocators**: arena/linear, pool, slab, buddy system — when and why to use each
- **System calls**: cost, batching, io_uring for async I/O on Linux
- **Process/thread model**: fork/exec, thread pools, fiber/coroutine scheduling
- **IPC**: pipes, sockets, shared memory, message queues — trade-offs for each
- **File systems**: how they work, fsync semantics, mmap, direct I/O

## CPU Architecture & Performance

- **Cache hierarchy**: L1/L2/L3 sizes, latencies, cache line size (64 bytes), false sharing
- **Branch prediction**: branch predictor types, how to guide with `[[likely]]`/`[[unlikely]]`
- **SIMD**: SSE4.2, AVX2, AVX-512 on x86; NEON on ARM — data parallelism in registers
- **Instruction-level parallelism**: superscalar execution, out-of-order execution, pipeline stalls
- **Memory bandwidth vs. compute**: knowing which bottleneck applies to your algorithm
- **Profiling tools**: VTune, perf, Superluminal, Tracy, Optick — what each measures best
- **Benchmarking discipline**: warm-up runs, clock resolution, preventing dead code elimination

## GPU Architecture & Graphics Programming

- **Vulkan**: render passes, descriptor sets, pipeline barriers, synchronization (semaphores, fences, events), VRAM management, validation layers, Vulkan Memory Allocator (VMA)
- **DirectX 11/12**: command lists, resource transitions (D3D12), descriptor heaps, async compute queues
- **GPU execution model**: warps/wavefronts, occupancy, register pressure, shared memory, bank conflicts
- **Rendering techniques**: deferred vs forward, PBR, shadow mapping, TAA, screen-space effects
- **Upscaling & reconstruction**: temporal accumulation, motion vectors, jitter patterns (DLSS/FSR/XeSS principles)
- **GPU profiling**: RenderDoc, PIX, Nsight Graphics, GPU timestamps
- **Compute shaders**: general-purpose GPU computation, memory coalescing, dispatch sizing

## Compilers & Language Runtimes

- **Compilation pipeline**: lexing, parsing, AST, IR, optimization passes, code generation
- **LLVM/Clang**: IR structure, writing LLVM passes, using clang as a library
- **JIT compilation**: when it helps, how to implement basic JIT with machine code emission
- **Garbage collection**: algorithms (mark-sweep, generational, incremental), pause time trade-offs
- **ABI**: calling conventions, name mangling, vtable layout, compatibility between compilers

## Artificial Intelligence & Machine Learning Systems

- **Neural network fundamentals**: forward/backward propagation, gradient descent, loss functions
- **Inference optimization**: quantization (INT8/INT4), pruning, knowledge distillation, ONNX
- **GPU memory management for ML**: VRAM budgeting, gradient checkpointing, mixed precision
- **CUDA programming**: kernels, thread hierarchy, memory types (global, shared, registers), streams
- **cuDNN/cuBLAS**: when to use library primitives vs. custom kernels
- **Model serving**: batching strategies, latency vs. throughput trade-offs, TensorRT optimization
- **Edge AI**: deployment on constrained hardware, quantization-aware training

## Signal Processing & Mathematics

- **Digital signal processing**: sampling theorem, aliasing, FIR/IIR filters, windowing
- **Fourier analysis**: DFT, FFT algorithms, frequency domain operations
- **Audio**: PCM encoding, real-time audio buffers, latency constraints, audio DSP pipelines
- **Image processing**: convolution, morphological operations, frequency domain filtering
- **Numerical methods**: floating-point precision issues, Kahan summation, numerical stability
- **Linear algebra libraries**: Eigen, BLAS/LAPACK — when to use and how to configure for SIMD

## Networking & Distributed Systems

- **Network programming**: TCP/UDP sockets, `epoll`/`kqueue`/IOCP, zero-copy networking
- **Protocol design**: framing, serialization formats (Protocol Buffers, FlatBuffers, Cap'n Proto)
- **Distributed consensus**: Raft, Paxos — understanding, not just naming
- **CAP theorem**: practical implications for system design decisions
- **Low-latency networking**: kernel bypass (DPDK, RDMA), busy-polling, hardware timestamping

## Security & Cryptography

- **Memory safety**: buffer overflows, use-after-free, format string vulnerabilities — not just what they are but why they happen at the machine level
- **Cryptographic primitives**: AES, ChaCha20, SHA-2/3, Ed25519 — when to use each, never implement yourself
- **TLS**: handshake protocol, certificate validation, common implementation mistakes
- **Secure coding**: input validation, privilege separation, least privilege principle
- **Fuzzing**: libFuzzer, AFL++ — how to write fuzz targets for C/C++ code

## Windows System Programming

- **Win32 API**: HANDLEs, HRESULTs, COM interfaces, message loops, window management
- **Windows memory model**: VirtualAlloc, HeapAlloc, memory-mapped files, large pages
- **DLL architecture**: export tables, import address table, delay loading, DLL injection
- **Windows threads**: fiber scheduling, thread pools (Windows Thread Pool API), IOCP
- **Debugging**: WinDbg commands, crash dump analysis, ETW tracing, minidump generation
