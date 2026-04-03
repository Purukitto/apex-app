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

        // Stateful shell — each tab keeps its own navigator and state
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return _AppShell(navigationShell: navigationShell);
          },
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/dashboard',
                  builder: (context, state) => const DashboardScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/garage',
                  builder: (context, state) => const GarageScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/rides',
                  builder: (context, state) => const AllRidesScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/ride',
                  builder: (context, state) => const RideScreen(),
                ),
              ],
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
  const _AppShell({required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<_AppShell> {
  DateTime? _lastBackPress;

  /// Stack of visited branch indices for cross-tab back navigation.
  /// Index 0 (dashboard) is the implicit root and always the bottom.
  final List<int> _branchHistory = [0];

  int get _currentIndex => widget.navigationShell.currentIndex;

  @override
  void didUpdateWidget(covariant _AppShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newIndex = widget.navigationShell.currentIndex;
    final oldIndex = oldWidget.navigationShell.currentIndex;
    if (newIndex != oldIndex) {
      _pushBranch(newIndex);
    }
  }

  void _pushBranch(int index) {
    // Remove existing entry to avoid duplicates, then push
    _branchHistory.remove(index);
    _branchHistory.add(index);
  }

  void _onTabTapped(int index) {
    // Switch to the branch, preserving its existing state
    widget.navigationShell.goBranch(
      index,
      initialLocation: index == _currentIndex,
    );
  }

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

        // If the current branch's navigator can pop, let it
        final router = GoRouter.of(context);
        if (router.canPop()) {
          router.pop();
          return;
        }

        // Cross-tab back: pop the history stack
        if (_branchHistory.length > 1) {
          _branchHistory.removeLast();
          final previousIndex = _branchHistory.last;
          widget.navigationShell.goBranch(previousIndex);
          return;
        }

        // At dashboard root: double-back to exit
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
        body: MeshBackground(
          backgroundColor: bgColor,
          child: widget.navigationShell,
        ),
        bottomNavigationBar: hideNav
            ? null
            : ApexBottomNavBar(
                currentIndex: _currentIndex,
                onTap: _onTabTapped,
              ),
      ),
    );
  }
}
