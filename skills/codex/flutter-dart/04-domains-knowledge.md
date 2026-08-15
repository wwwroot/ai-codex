# Domain Knowledge & Application Architecture — Flutter 3.24+

> Architecture patterns for BLoC state machines, Riverpod 2.5+, GoRouter navigation, and Pigeon platform channels.

---

## 1. Clean Architecture Layering

```
┌────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (UI Widgets, BLoC / Riverpod State Controllers)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Depends on Domain Interfaces
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ DOMAIN LAYER (Pure Dart Entities, Use Cases, Repository Contracts)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Implemented by Data Layer
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ DATA LAYER (DTOs, Repositories, Remote Dio API, Local Drift Database)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Production BLoC Pattern Implementation

```dart
// domain/entities/account.dart
class Account {
  const Account({required this.id, required this.balance, required this.currency});
  final String id;
  final double balance;
  final String currency;
}

// presentation/bloc/account_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';

sealed class AccountEvent {
  const AccountEvent();
}

final class AccountFetchRequested extends AccountEvent {
  const AccountFetchRequested(this.accountId);
  final String accountId;
}

sealed class AccountState {
  const AccountState();
}

final class AccountInitial extends AccountState {
  const AccountInitial();
}

final class AccountLoading extends AccountState {
  const AccountLoading();
}

final class AccountLoaded extends AccountState {
  const AccountLoaded(this.account);
  final Account account;
}

final class AccountError extends AccountState {
  const AccountError(this.message);
  final String message;
}

class AccountBloc extends Bloc<AccountEvent, AccountState> {
  AccountBloc({required this.getAccountUseCase}) : super(const AccountInitial()) {
    on<AccountFetchRequested>(_onFetchRequested);
  }

  final GetAccountUseCase getAccountUseCase;

  Future<void> _onFetchRequested(
    AccountFetchRequested event,
    Emitter<AccountState> emit,
  ) async {
    emit(const AccountLoading());
    try {
      final account = await getAccountUseCase(event.accountId);
      emit(AccountLoaded(account));
    } catch (error) {
      emit(AccountError(error.toString()));
    }
  }
}
```

---

## 3. Declarative Navigation with GoRouter & StatefulShellRoute

Keep bottom navigation bar tab state alive across route transitions with `StatefulShellRoute`:

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final router = GoRouter(
  initialLocation: '/home',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNavBar(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
```

---

## 4. Type-Safe Platform Channels with Pigeon

Never use raw `MethodChannel` with string identifiers; use Pigeon to generate type-safe Swift, Kotlin, and Dart bindings:

```dart
// pigeons/messages.dart
import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(PigeonOptions(
  dartOut: 'lib/src/native_bridge.g.dart',
  swiftOut: 'ios/Runner/NativeBridge.g.swift',
  kotlinOut: 'android/app/src/main/kotlin/com/example/NativeBridge.g.kt',
))
class BatteryInfo {
  String? deviceModel;
  int? batteryLevel;
  bool? isCharging;
}

@HostApi()
abstract class NativeDeviceApi {
  BatteryInfo getBatteryInfo();
  void triggerHapticFeedback(int intensity);
}
```
