# 05 — Research, Prototyping & Profiling Method (Swift Edition)

> Reference this file when exploring new Apple platform APIs, diagnosing performance issues, or preparing an app for production release.

---

## 1. The Swift Invention & Prototyping Loop

```
  ┌────────────────────────────────────────────────────────┐
  │ 1. HYPOTHESIS & DOMAIN MODEL                           │
  │    Define algebraic data types (enums/structs).        │
  │    Determine isolation boundaries (@MainActor/actors). │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. PREVIEW & INTERACTION PROTOTYPE                     │
  │    Build SwiftUI view with Mock data in Xcode #Preview.│
  │    Validate layout adaptability and visual states.     │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. INSTRUMENTS PROFILING & MEASUREMENT                 │
  │    Run Time Profiler, Allocations, and Hangs trace.    │
  │    Verify 120Hz ProMotion render budget (8.33ms/frame).│
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 4. HARDEN & VALIDATE CONCURRENCY                       │
  │    Swift 6 complete concurrency build check.           │
  │    Audit retain cycles, memory leaks, and error paths. │
  └────────────────────────────────────────────────────────┘
```

---

## 2. Profiling with Xcode Instruments

Never guess where performance bottlenecks exist. Always profile on physical hardware in `Release` configuration.

### The Essential Instruments Suite:

1. **Time Profiler**:
   - Check CPU usage across threads.
   - Look for heavy execution trees on the Main Thread (Thread 0).
   - Target: Main thread should spend > 90% of its time in event loop wait, not in computational blocking.
2. **Allocations & Leaks**:
   - Track transient memory spikes (e.g., loading large raw images instead of downsampled thumbnails).
   - Use the **Leaks** instrument or Memory Graph Debugger to detect uncollected retain cycles (`[weak self]` missing).
3. **SwiftUI View Body Invalidation**:
   - Identify view bodies that re-evaluate repeatedly despite unchanged visual state.
   - Fix with fine-grained `@Observable` properties, equatable view conformance, or passing lightweight value models.
4. **Hangs Instrument**:
   - Detect any main thread hang greater than 250ms (App Store watchdog warning limit) or micro-hangs (> 16ms).

---

## 3. Swift 6 Concurrency & Race Auditing

Enable complete concurrency checks in your `Package.swift` or Xcode Build Settings:

```swift
// Package.swift configuration for Swift 6 strictness
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CoreDomain",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "CoreDomain", targets: ["CoreDomain"])],
    targets: [
        .target(
            name: "CoreDomain",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny")
            ]
        )
    ]
)
```

### Thread Sanitizer (TSan):
Enable TSan in the Xcode Scheme (`Edit Scheme -> Run -> Diagnostics -> Thread Sanitizer`) to capture data races during test execution on simulator and macOS targets.

---

## 4. Production & App Store Release Checklist

Before submitting to TestFlight or the App Store:

- [ ] **Data-Race Safety**: Project builds with zero warnings under Swift 6 language mode.
- [ ] **Memory Leaks & Deinit Audit**: View models, coordinator instances, and long-lived tasks deallocate cleanly upon screen dismissal.
- [ ] **Dynamic Type & Localization**: Layouts expand without clipping when user selects Accessibility XXL text size. All strings use `LocalizedStringResource` or String Catalogs (`.xcstrings`).
- [ ] **VoiceOver & Accessibility**: All interactive elements have descriptive accessibility labels, traits, and hints.
- [ ] **Privacy Manifests**: Included `PrivacyInfo.xcprivacy` with declared tracking domains and required reason APIs (File timestamp, System boot time, Disk space).
- [ ] **MetricKit & Crash Reporting**: MetricKit diagnostics subscriber initialized to capture production crash payloads, energy metrics, and hang rates.
- [ ] **Offline Handling**: App responds gracefully to network loss without spinning spinners or throwing unhandled alert sheets.
