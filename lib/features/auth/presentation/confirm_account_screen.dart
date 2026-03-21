import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/network/supabase_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/logger.dart';
import '../../../core/utils/toast.dart';
import '../../../core/widgets/apex_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/mesh_background.dart';

enum _ConfirmState { checking, confirmed, invalid }

class ConfirmAccountScreen extends ConsumerStatefulWidget {
  const ConfirmAccountScreen({super.key});

  @override
  ConsumerState<ConfirmAccountScreen> createState() =>
      _ConfirmAccountScreenState();
}

class _ConfirmAccountScreenState extends ConsumerState<ConfirmAccountScreen> {
  _ConfirmState _state = _ConfirmState.checking;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    final client = ref.read(supabaseClientProvider);

    try {
      final session = client.auth.currentSession;

      if (session != null) {
        await _handleConfirmed(client);
        return;
      }

      // Retry once after delay
      await Future.delayed(const Duration(milliseconds: kConfirmRetryDelayMs));

      if (!mounted) return;
      final retrySession = client.auth.currentSession;

      if (retrySession != null) {
        await _handleConfirmed(client);
      } else {
        setState(() => _state = _ConfirmState.invalid);
        if (mounted) {
          ApexToast.error(context, 'Invalid or expired confirmation link');
        }
      }
    } catch (e) {
      AppLogger.e('Confirm account error', e);
      if (mounted) {
        setState(() => _state = _ConfirmState.invalid);
        ApexToast.error(context, 'Invalid or expired confirmation link');
      }
    }
  }

  Future<void> _handleConfirmed(SupabaseClient client) async {
    await client.auth.signOut();
    if (mounted) {
      setState(() => _state = _ConfirmState.confirmed);
      ApexToast.success(context, 'Account confirmed');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: MeshBackground(
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: _buildContent(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_state) {
      case _ConfirmState.checking:
        return _buildChecking();
      case _ConfirmState.confirmed:
        return _buildConfirmed();
      case _ConfirmState.invalid:
        return _buildInvalid();
    }
  }

  Widget _buildChecking() {
    return GlassCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator.adaptive(),
          const SizedBox(height: 20),
          Text(
            'Verifying your account…',
            style: AppTypography.inter.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildConfirmed() {
    return GlassCard(
      isAccent: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_outline, color: context.accent, size: 48),
          const SizedBox(height: 16),
          Text(
            'Account Confirmed!',
            style: AppTypography.playfairDisplay.copyWith(fontSize: 24),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Your email has been verified. You can now sign in.',
            style: AppTypography.interSecondary,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ApexButton(
            label: 'Go to Sign In',
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildInvalid() {
    return GlassCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 48),
          const SizedBox(height: 16),
          Text(
            'Confirmation Failed',
            style: AppTypography.playfairDisplay.copyWith(fontSize: 24),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'This confirmation link is invalid or has expired. '
            'Please sign up again or request a new link.',
            style: AppTypography.interSecondary,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ApexButton(
            label: 'Back to Sign In',
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms);
  }
}
