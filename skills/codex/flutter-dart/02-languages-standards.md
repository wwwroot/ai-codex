# Language Standards & Code Quality — Dart 3.5+ / Flutter 3.24+

> Production-grade Dart standards, sealed class state hierarchies, pattern matching, and BLoC concurrency discipline.

---

## 1. Target Versions & Toolchain

- **Framework Version**: Flutter 3.24+ (stable channel)
- **Dart SDK**: Dart 3.5+ (100% sound null safety)
- **Lint Configuration**: `flutter_lints` with strict type analysis (`strict-casts`, `strict-inference`, `strict-raw-types`)
- **Formatting**: `dart format --line-length 100 .` (zero style debates, strictly enforced)

---

## 2. Idiomatic Dart 3.5+ Standards

### 2.1. Sealed Class State Hierarchies & Exhaustive Switch
Model all UI state using `sealed class` to ensure the compiler enforces handling every possible state:

```dart
import 'package:flutter/foundation.dart';

@immutable
sealed class ProfileState {
  const ProfileState();
}

final class ProfileInitial extends ProfileState {
  const ProfileInitial();
}

final class ProfileLoading extends ProfileState {
  const ProfileLoading();
}

final class ProfileLoaded extends ProfileState {
  const ProfileLoaded({required this.user, required this.recentTransactions});
  final User user;
  final List<Transaction> recentTransactions;
}

final class ProfileFailure extends ProfileState {
  const ProfileFailure({required this.message, required this.errorCode});
  final String message;
  final String errorCode;
}
```

```dart
// Exhaustive switch expression inside Widget build method
Widget buildProfileBody(BuildContext context, ProfileState state) {
  return switch (state) {
    ProfileInitial() => const SizedBox.shrink(),
    ProfileLoading() => const Center(child: CircularProgressIndicator.adaptive()),
    ProfileLoaded(:final user, :final recentTransactions) => ProfileContent(
        user: user,
        transactions: recentTransactions,
      ),
    ProfileFailure(:final message) => ErrorView(
        errorMessage: message,
        onRetry: () => context.read<ProfileBloc>().add(const ProfileReloadRequested()),
      ),
  };
}
```

### 2.2. Records & Pattern Destructuring
Use records for lightweight multiple return values instead of creating arbitrary 2-field data transfer classes:

```dart
(double minPrice, double maxPrice, int itemCount) calculatePriceRange(List<Product> products) {
  if (products.isEmpty) return (0.0, 0.0, 0);
  
  double min = products.first.price;
  double max = products.first.price;
  
  for (final product in products) {
    if (product.price < min) min = product.price;
    if (product.price > max) max = product.price;
  }
  
  return (min, max, products.length);
}

// Destructuring in caller
final (min, max, count) = calculatePriceRange(catalog);
```

### 2.3. Safe Asynchronous Context Usage
Never use `BuildContext` after an asynchronous gap without checking `context.mounted`:

```dart
Future<void> _handlePayment(BuildContext context) async {
  final scaffoldMessenger = ScaffoldMessenger.of(context);
  final bloc = context.read<CheckoutBloc>();

  final success = await bloc.processCheckout();
  
  // Guard against widget unmounting while network request was in flight
  if (!context.mounted) return;

  if (success) {
    Navigator.of(context).pushNamed('/order-confirmation');
  } else {
    scaffoldMessenger.showSnackBar(
      const SnackBar(content: Text('Payment failed. Please retry.')),
    );
  }
}
```

---

## 3. BLoC Event Transformer Discipline

Prevent duplicate network calls during rapid user taps using BLoC event concurrency transformers from `bloc_concurrency`:

```dart
import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc({required this.repository}) : super(const SearchInitial()) {
    // restartable() cancels ongoing search requests when a new query arrives (debouncing)
    on<SearchQueryChanged>(
      _onQueryChanged,
      transformer: restartable(),
    );

    // droppable() ignores new tap events while payment submission is in flight
    on<SearchPaymentSubmitted>(
      _onPaymentSubmitted,
      transformer: droppable(),
    );
  }

  final SearchRepository repository;
}
```

---

## 4. Anti-Patterns & Pitfalls Table

| Anti-Pattern | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`setState` in Root Scaffold** | Rebuilds the entire screen widget tree on every micro-update ($\rightarrow$ dropped frames). | Scope state changes to local leaf widgets using `BlocBuilder` with `buildWhen`. |
| **Decoding 10MB JSON in UI Thread** | Freezes the UI for 100-300ms, causing noticeable touch lag. | Use `Isolate.run(() => jsonDecode(payload))` to decode in background. |
| **Un-disposed Controllers** | Keeps memory allocations, listeners, and views alive after popping route ($\rightarrow$ memory leak). | Always call `controller.dispose()` in `State.dispose()`. |
| **`SingleChildScrollView` + `Column`** | Renders all 1,000 list items into memory immediately ($\rightarrow$ OOM crash on low-end devices). | Use `ListView.builder` or `CustomScrollView` for on-demand lazy viewport rendering. |
| **Hardcoded Color/Spacing Literals** | Destroys dark mode and dynamic theming accessibility. | Use `Theme.of(context).colorScheme` and semantic design token spacing constants. |
