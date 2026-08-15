# Research Method & Performance Diagnostics — Flutter 3.24+

> Performance profiling with DevTools, BLoC state testing, Golden widget assertions, and release checklists.

---

## 1. Flutter DevTools Profiling Protocol

Identify and eliminate dropped frames using the DevTools Performance Timeline:

```
┌────────────────────────────────────────────────────────────────────────┐
│ UI Thread Time       |  ==== 3.2ms (Dart build, layout, state logic)   │
│ Raster Thread Time   |  ====== 4.1ms (Impeller GPU rendering & paint)  │
│ Total Frame Time     |  7.3ms <= 8.3ms Budget -> 120 FPS PASSED! [OK] │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Jank Diagnostic Steps:
1. Run app in profile mode on a physical device:
   ```bash
   flutter run --profile
   ```
2. Open DevTools Timeline view (`flutter pub global run devtools`).
3. Look for red bars exceeding the frame boundary ($16.6\text{ms}$ on 60Hz, $8.3\text{ms}$ on 120Hz).
4. If **UI Thread is high**: Check for non-const widgets, unnecessary builds, or synchronous JSON/math operations on the UI Isolate.
5. If **Raster Thread is high**: Check for overlapping transparent layers, unclipped shaders, or missing `RepaintBoundary` widgets.

---

## 2. BLoC Unit Testing with `bloc_test` & `mocktail`

```dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockGetAccountUseCase extends Mock implements GetAccountUseCase {}

void main() {
  late MockGetAccountUseCase mockUseCase;

  setUp(() {
    mockUseCase = MockGetAccountUseCase();
  });

  group('AccountBloc', () {
    const tAccount = Account(id: 'acc_123', balance: 500.0, currency: 'USD');

    blocTest<AccountBloc, AccountState>(
      'emits [AccountLoading, AccountLoaded] when AccountFetchRequested is successful',
      build: () {
        when(() => mockUseCase('acc_123')).thenAnswer((_) async => tAccount);
        return AccountBloc(getAccountUseCase: mockUseCase);
      },
      act: (bloc) => bloc.add(const AccountFetchRequested('acc_123')),
      expect: () => [
        const AccountLoading(),
        const AccountLoaded(tAccount),
      ],
      verify: (_) {
        verify(() => mockUseCase('acc_123')).called(1);
      },
    );
  });
}
```

---

## 3. Pixel-Perfect Golden Widget Testing

Verify design system typography, spacing, and dark mode compliance using screenshot regression tests:

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('ProfileCard renders pixel-perfect golden asset in dark mode', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(useMaterial3: true),
        home: const Scaffold(
          body: ProfileCard(
            userName: 'Alex Rivers',
            userRole: 'Staff Systems Architect',
          ),
        ),
      ),
    );

    await expectLater(
      find.byType(ProfileCard),
      matchesGoldenFile('goldens/profile_card_dark.png'),
    );
  });
}
```

---

## 4. Production Release Pre-Flight Checklist

- [ ] **Release Mode Build**: Built with `--release` flag (`flutter build ipa --release`, `flutter build appbundle --release`).
- [ ] **Obfuscation Enabled**: Protected symbols using `--obfuscate --split-debug-info=./symbols`.
- [ ] **Memory Leak Scan**: Profiled in DevTools Memory view; confirmed zero leaked `State` or `Controller` instances across 50 route transitions.
- [ ] **Impeller Verification**: Confirmed smooth 120 FPS animations without shader compilation pauses on target physical devices.
- [ ] **Offline Resilience**: Verified graceful degradation with cached data when network connectivity is toggled off.
