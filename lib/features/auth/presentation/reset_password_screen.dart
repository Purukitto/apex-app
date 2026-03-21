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
import '../../../core/widgets/apex_text_field.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/mesh_background.dart';

enum _ResetState { checkingSession, hasSession, noSession, success }

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState
    extends ConsumerState<ResetPasswordScreen> {
  _ResetState _state = _ResetState.checkingSession;
  bool _isLoading = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _checkSession() async {
    final client = ref.read(supabaseClientProvider);

    try {
      final session = client.auth.currentSession;
      if (session != null) {
        if (mounted) setState(() => _state = _ResetState.hasSession);
        return;
      }

      await Future.delayed(
          const Duration(milliseconds: kResetVerifyDelayMs));

      if (!mounted) return;
      final retrySession = client.auth.currentSession;
      if (retrySession != null) {
        setState(() => _state = _ResetState.hasSession);
      } else {
        setState(() => _state = _ResetState.noSession);
      }
    } catch (e) {
      AppLogger.e('Reset password session check error', e);
      if (mounted) setState(() => _state = _ResetState.noSession);
    }
  }

  Future<void> _handleReset() async {
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (password.length < 8) {
      ApexToast.error(context, 'Password must be at least 8 characters');
      return;
    }

    if (password != confirm) {
      ApexToast.error(context, 'Passwords do not match');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final client = ref.read(supabaseClientProvider);
      await client.auth.updateUser(UserAttributes(password: password));

      if (mounted) {
        setState(() => _state = _ResetState.success);
        ApexToast.success(context, 'Password Changed! You can now log in.');

        await Future.delayed(
            const Duration(milliseconds: kSuccessRedirectDelayMs));
        if (mounted) context.go('/login');
      }
    } on AuthException catch (e) {
      AppLogger.w('Reset password failed', e);
      if (mounted) {
        ApexToast.error(context, 'Failed to update password. Please try again.');
      }
    } catch (e) {
      AppLogger.e('Unexpected reset password error', e);
      if (mounted) {
        ApexToast.error(context, 'Failed to update password. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: MeshBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: _buildContent(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_state) {
      case _ResetState.checkingSession:
        return _buildChecking();
      case _ResetState.hasSession:
        return _buildForm();
      case _ResetState.noSession:
        return _buildNoSession();
      case _ResetState.success:
        return _buildSuccess();
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
            'Verifying reset link…',
            style:
                AppTypography.inter.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildForm() {
    return Column(
      children: [
        Text(
          'Set New Password',
          style: AppTypography.playfairDisplayLarge,
          textAlign: TextAlign.center,
        ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.1, end: 0),

        const SizedBox(height: 8),
        Text(
          'Choose a strong password for your account.',
          style: AppTypography.interSecondary,
          textAlign: TextAlign.center,
        ).animate().fadeIn(duration: 500.ms, delay: 100.ms),

        const SizedBox(height: 32),

        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ApexTextField(
                controller: _passwordController,
                label: 'New Password',
                hint: '••••••••',
                obscureText: _obscureNew,
                textInputAction: TextInputAction.next,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureNew
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.textMuted,
                    size: 18,
                  ),
                  onPressed: () =>
                      setState(() => _obscureNew = !_obscureNew),
                ),
              ).animate().fadeIn(duration: 500.ms, delay: 200.ms),

              const SizedBox(height: 16),

              ApexTextField(
                controller: _confirmController,
                label: 'Confirm Password',
                hint: '••••••••',
                obscureText: _obscureConfirm,
                textInputAction: TextInputAction.done,
                onFieldSubmitted: (_) => _handleReset(),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirm
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.textMuted,
                    size: 18,
                  ),
                  onPressed: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                ),
              ).animate().fadeIn(duration: 500.ms, delay: 300.ms),

              const SizedBox(height: 24),

              ApexButton(
                label: 'Update Password',
                onPressed: _isLoading ? null : _handleReset,
                isLoading: _isLoading,
              ).animate().fadeIn(duration: 500.ms, delay: 400.ms),
            ],
          ),
        ).animate().fadeIn(duration: 500.ms, delay: 150.ms),
      ],
    );
  }

  Widget _buildNoSession() {
    return GlassCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.link_off, color: AppColors.error, size: 48),
          const SizedBox(height: 16),
          Text(
            'Link Expired',
            style: AppTypography.playfairDisplay.copyWith(fontSize: 24),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'This password reset link is invalid or has expired. '
            'Please request a new one from the sign in page.',
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

  Widget _buildSuccess() {
    return GlassCard(
      isAccent: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_outline,
              color: context.accent, size: 48),
          const SizedBox(height: 16),
          Text(
            'Password Updated',
            style: AppTypography.playfairDisplay.copyWith(fontSize: 24),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Redirecting to sign in…',
            style:
                AppTypography.interSecondary,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.95, 0.95));
  }
}
