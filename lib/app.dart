import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/network/supabase_client.dart';
import 'core/providers/sync_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/services/firebase_service.dart';
import 'core/services/update_checker.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/toast.dart';
import 'core/widgets/bottom_nav_bar.dart';
import 'core/widgets/mesh_background.dart';
import 'features/auth/presentation/confirm_account_screen.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/reset_password_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/dashboard/presentation/dashboard_screen.dart';
import 'features/garage/presentation/garage_screen.dart';
import 'features/notifications/providers/maintenance_checker_provider.dart';
import 'features/profile/presentation/changelog_sheet.dart';
import 'features/profile/presentation/profile_screen.dart';
import 'features/ride/presentation/ride_screen.dart';
import 'features/ride/providers/ride_session_provider.dart';
import 'features/rides/presentation/all_rides_screen.dart';

const _authRoutes = {'/login', '/confirmed', '/reset-password'};

/// A simple [ChangeNotifier] used as GoRouter's refreshListenable.
/// Triggered from [_ApexAppState.build] via ref.listen.
class _RouterRefreshNotifier extends ChangeNotifier {
  void notify() => notifyListeners();
}

class ApexApp extends ConsumerStatefulWidget {
  const ApexApp({super.key});

  @override
  ConsumerState<ApexApp> createState() => _ApexAppState();
}

class _ApexAppState extends ConsumerState<ApexApp> {
  late final GoRouter _router;
  late final _RouterRefreshNotifier _routerRefresh;

  final _rootNavigatorKey = GlobalKey<NavigatorState>();
  bool _startupChecksDone = false;

  @override
  void initState() {
    super.initState();
    _routerRefresh = _RouterRefreshNotifier();
    _router = _buildRouter();
  }

  void _runStartupChecks() {
    if (_startupChecksDone) return;
    _startupChecksDone = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _rootNavigatorKey.currentContext;
      if (ctx == null) return;
      ChangelogSheet.checkAndShow(ctx);
      UpdateChecker.check(ctx);
    });
  }

  @override
  void dispose() {
    _routerRefresh.dispose();
    super.dispose();
  }

  Future<void> _registerFcmToken() async {
    final granted = await FirebaseService.requestPermission();
    if (!granted) return;
    final uid = ref.read(supabaseClientProvider).auth.currentUser?.id;
    if (uid != null) {
      await FirebaseService.registerToken(uid);
    }
  }

  GoRouter _buildRouter() {
    return GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: '/dashboard',
      refreshListenable: _routerRefresh,
      redirect: (context, state) {
        final isAuthenticated = ref.read(isAuthenticatedProvider);
        final path = state.uri.path;
        final isAuthRoute = _authRoutes.contains(path);

        if (!isAuthenticated && !isAuthRoute) {
          return '/login';
        }
        if (isAuthenticated && path == '/login') {
          return '/dashboard';
        }
        return null;
      },
      routes: [
        // Auth routes (no shell)
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/confirmed',
          builder: (context, state) => const ConfirmAccountScreen(),
        ),
        GoRoute(
          path: '/reset-password',
          builder: (context, state) => const ResetPasswordScreen(),
        ),

        // Shell routes — tabbed navigation
        ShellRoute(
          builder: (context, state, child) {
            return _AppShell(currentLocation: state.uri.path, child: child);
          },
          routes: [
            GoRoute(
              path: '/dashboard',
              builder: (context, state) => const DashboardScreen(),
            ),
            GoRoute(
              path: '/garage',
              builder: (context, state) => const GarageScreen(),
            ),
            GoRoute(
              path: '/ride',
              builder: (context, state) => const RideScreen(),
            ),
            GoRoute(
              path: '/rides',
              builder: (context, state) => const AllRidesScreen(),
            ),
          ],
        ),

        // Profile — standalone route (no bottom nav bar)
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // Bridge Riverpod auth state → GoRouter refreshListenable + FCM token
    ref.listen(isAuthenticatedProvider, (prev, next) {
      _routerRefresh.notify();
      if (next && !(prev ?? false)) {
        _registerFcmToken();
        _runStartupChecks();
      }
    });

    // Start/stop sync engine based on auth + connectivity
    ref.watch(syncOrchestratorProvider);

    // Watch maintenance schedules and generate notifications
    ref.watch(maintenanceCheckerProvider);

    final themeState = ref.watch(themeProvider);
    final accentColor = ThemeNotifier.accentColorFor(themeState.accent);

    return MaterialApp.router(
      title: 'Apex',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.buildDarkTheme(accentColor: accentColor),
      routerConfig: _router,
    );
  }
}

class _AppShell extends ConsumerStatefulWidget {
  const _AppShell({required this.currentLocation, required this.child});

  final String currentLocation;
  final Widget child;

  @override
  ConsumerState<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<_AppShell> {
  DateTime? _lastBackPress;

  @override
  Widget build(BuildContext context) {
    final themeState = ref.watch(themeProvider);
    final bgColor = ThemeNotifier.backgroundColorFor(themeState.background);
    final rideStatus = ref.watch(rideSessionProvider.select((s) => s.status));
    final hideNav =
        rideStatus == RideStatus.countdown ||
        rideStatus == RideStatus.recording ||
        rideStatus == RideStatus.paused ||
        rideStatus == RideStatus.saving;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;

        // If not on dashboard, go to dashboard first
        if (widget.currentLocation != '/dashboard') {
          context.go('/dashboard');
          return;
        }

        // On dashboard: double-back to exit
        final now = DateTime.now();
        if (_lastBackPress != null &&
            now.difference(_lastBackPress!) < const Duration(seconds: 2)) {
          SystemNavigator.pop();
          return;
        }
        _lastBackPress = now;
        ApexToast.success(context, 'Press back again to exit');
      },
      child: Scaffold(
        backgroundColor: Colors.transparent,
        extendBody: true,
        body: MeshBackground(backgroundColor: bgColor, child: widget.child),
        bottomNavigationBar: hideNav
            ? null
            : ApexBottomNavBar(currentLocation: widget.currentLocation),
      ),
    );
  }
}
