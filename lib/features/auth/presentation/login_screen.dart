import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/network/supabase_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/apex_logo.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/logger.dart';
import '../../../core/utils/toast.dart';
import '../../../core/widgets/apex_button.dart';
import '../../../core/widgets/apex_text_field.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/mesh_background.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isSignUp = false;
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  SupabaseClient get _supabase => ref.read(supabaseClientProvider);

  // ── Validation ──────────────────────────────────────────────────────────────

  bool get _passwordValid {
    final p = _passwordController.text;
    return p.length >= 8 &&
        p.contains(RegExp(r'[A-Z]')) &&
        p.contains(RegExp(r'[0-9]')) &&
        p.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));
  }

  // ── Auth flows ───────────────────────────────────────────────────────────────

  Future<void> _handleSignIn() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty) {
      ApexToast.error(context, 'Please enter your email address');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _supabase.auth.signInWithPassword(email: email, password: password);
      if (mounted) context.go('/dashboard');
    } on AuthException catch (e) {
      AppLogger.w('Sign in failed', e);
      if (mounted) ApexToast.error(context, 'Invalid email or password');
    } catch (e) {
      AppLogger.e('Unexpected sign in error', e);
      if (mounted) ApexToast.error(context, 'Invalid email or password');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSignUp() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty) {
      ApexToast.error(context, 'Please enter your email address');
      return;
    }

    if (!_passwordValid) {
      ApexToast.error(context, 'Password does not meet requirements');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        emailRedirectTo: 'https://apex.purukitto.xyz/confirmed',
      );

      if (!mounted) return;

      // Duplicate email: identities will be empty
      if (response.user?.identities?.isEmpty == true) {
        ApexToast.error(context, 'This email is already registered');
        return;
      }

      // Email confirmation required
      if (response.user?.emailConfirmedAt == null && response.session == null) {
        ApexToast.success(
          context,
          'Please check your email to confirm your account',
        );
        _emailController.clear();
        _passwordController.clear();
        setState(() => _isSignUp = false);
        return;
      }

      // Rare: auto-confirmed — poll for session then navigate
      await _pollAndNavigate();
    } on AuthException catch (e) {
      AppLogger.w('Sign up failed', e);
      if (mounted) ApexToast.error(context, 'Failed to create account');
    } catch (e) {
      AppLogger.e('Unexpected sign up error', e);
      if (mounted) ApexToast.error(context, 'Failed to create account');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pollAndNavigate() async {
    for (int i = 0; i < kSessionPollMaxAttempts; i++) {
      await Future.delayed(const Duration(milliseconds: kSessionPollDelayMs));
      final session = _supabase.auth.currentSession;
      if (session != null) {
        if (mounted) context.go('/dashboard');
        return;
      }
    }
    // Fallback: prompt user to confirm email
    if (mounted) {
      ApexToast.success(
        context,
        'Please check your email to confirm your account',
      );
    }
  }

  Future<void> _handleForgotPassword() async {
    final emailController = TextEditingController(
      text: _emailController.text.trim(),
    );

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _ForgotPasswordDialog(controller: emailController),
    );

    if (confirmed != true) {
      emailController.dispose();
      return;
    }

    final email = emailController.text.trim();
    emailController.dispose();

    if (email.isEmpty) {
      if (mounted) ApexToast.error(context, 'Please enter your email address');
      return;
    }

    try {
      await _supabase.auth.resetPasswordForEmail(
        email,
        redirectTo: 'https://apex.purukitto.xyz/reset-password',
      );
      if (mounted) {
        ApexToast.success(
          context,
          'Password reset email sent. Check your inbox.',
        );
      }
    } catch (e) {
      AppLogger.e('Reset password error', e);
      if (mounted) {
        ApexToast.error(context, 'Failed to send reset email. Try again.');
      }
    }
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: MeshBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo / title
                    _buildHeader(),

                    const SizedBox(height: 40),

                    // Form card
                    _buildFormCard(),

                    const SizedBox(height: 16),

                    // Toggle sign-in / sign-up
                    _buildToggleRow(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Apex monogram
        Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.accentCardBg,
                border: Border.all(color: context.accentCardBorder, width: 1.5),
              ),
              alignment: Alignment.center,
              child: ApexLogo(size: 36),
            )
            .animate()
            .fadeIn(duration: 500.ms)
            .slideY(begin: -0.2, end: 0, duration: 500.ms),
        const SizedBox(height: 16),
        Text(
              'Apex',
              style: AppTypography.playfairDisplayLarge.copyWith(
                color: AppColors.textPrimary,
                letterSpacing: 2,
              ),
            )
            .animate()
            .fadeIn(duration: 500.ms, delay: 100.ms)
            .slideY(begin: -0.15, end: 0, duration: 500.ms, delay: 100.ms),
        const SizedBox(height: 6),
        Text(
          _isSignUp ? 'Create your account' : 'Welcome back, rider',
          style: AppTypography.interSecondary,
        ).animate().fadeIn(duration: 500.ms, delay: 200.ms),
      ],
    );
  }

  Widget _buildFormCard() {
    return GlassCard(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Email
              ApexTextField(
                    controller: _emailController,
                    label: 'Email',
                    hint: 'rider@example.com',
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autofocus: true,
                  )
                  .animate()
                  .fadeIn(duration: 500.ms, delay: 200.ms)
                  .slideY(begin: 0.1, end: 0, duration: 500.ms, delay: 200.ms),

              const SizedBox(height: 16),

              // Password
              ApexTextField(
                    controller: _passwordController,
                    label: 'Password',
                    hint: '••••••••',
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) =>
                        _isSignUp ? _handleSignUp() : _handleSignIn(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: AppColors.textMuted,
                        size: 18,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  )
                  .animate()
                  .fadeIn(duration: 500.ms, delay: 300.ms)
                  .slideY(begin: 0.1, end: 0, duration: 500.ms, delay: 300.ms),

              // Password strength (sign-up only)
              if (_isSignUp) ...[
                const SizedBox(height: 12),
                _PasswordStrengthIndicator(
                  password: _passwordController.text,
                ).animate().fadeIn(duration: 300.ms),
              ],

              const SizedBox(height: 24),

              // Primary action button
              ApexButton(
                    label: _isSignUp ? 'Create Account' : 'Sign In',
                    onPressed: _isLoading
                        ? null
                        : (_isSignUp ? _handleSignUp : _handleSignIn),
                    isLoading: _isLoading,
                  )
                  .animate()
                  .fadeIn(duration: 500.ms, delay: 400.ms)
                  .slideY(begin: 0.1, end: 0, duration: 500.ms, delay: 400.ms),

              // Forgot password (sign-in only)
              if (!_isSignUp) ...[
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: _handleForgotPassword,
                    child: Text(
                      'Forgot password?',
                      style: AppTypography.interSmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ).animate().fadeIn(duration: 500.ms, delay: 450.ms),
              ],
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 500.ms, delay: 150.ms)
        .slideY(begin: 0.05, end: 0, duration: 500.ms, delay: 150.ms);
  }

  Widget _buildToggleRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          _isSignUp ? 'Already have an account?' : "Don't have an account?",
          style: AppTypography.interSecondary,
        ),
        TextButton(
          onPressed: () {
            setState(() {
              _isSignUp = !_isSignUp;
              _passwordController.clear();
            });
          },
          child: Text(
            _isSignUp ? 'Sign In' : 'Sign Up',
            style: AppTypography.inter.copyWith(
              color: context.accent,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 500.ms);
  }
}

// ── Password strength indicator ───────────────────────────────────────────────

class _PasswordStrengthIndicator extends StatelessWidget {
  const _PasswordStrengthIndicator({required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    final checks = [
      _StrengthCheck(label: '8+ characters', passed: password.length >= 8),
      _StrengthCheck(
        label: 'Uppercase letter',
        passed: password.contains(RegExp(r'[A-Z]')),
      ),
      _StrengthCheck(
        label: 'Number',
        passed: password.contains(RegExp(r'[0-9]')),
      ),
      _StrengthCheck(
        label: 'Special character',
        passed: password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]')),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Strength bar
        Row(
          children: checks.map((c) {
            return Expanded(
              child: Container(
                margin: const EdgeInsets.only(right: 4),
                height: 3,
                decoration: BoxDecoration(
                  color: c.passed ? context.accent : AppColors.cardBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
        // Check list
        Wrap(
          spacing: 12,
          runSpacing: 4,
          children: checks.map((c) => _StrengthCheckRow(check: c)).toList(),
        ),
      ],
    );
  }
}

class _StrengthCheck {
  const _StrengthCheck({required this.label, required this.passed});
  final String label;
  final bool passed;
}

class _StrengthCheckRow extends StatelessWidget {
  const _StrengthCheckRow({required this.check});
  final _StrengthCheck check;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          check.passed ? Icons.check_circle_outline : Icons.circle_outlined,
          size: 12,
          color: check.passed ? context.accent : AppColors.textMuted,
        ),
        const SizedBox(width: 4),
        Text(
          check.label,
          style: AppTypography.interLabel.copyWith(
            color: check.passed ? context.accent : AppColors.textMuted,
            fontSize: 11,
            letterSpacing: 0,
          ),
        ),
      ],
    );
  }
}

// ── Forgot password dialog ────────────────────────────────────────────────────

class _ForgotPasswordDialog extends StatelessWidget {
  const _ForgotPasswordDialog({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Reset Password',
              style: AppTypography.playfairDisplay.copyWith(fontSize: 22),
            ),
            const SizedBox(height: 8),
            Text(
              "Enter your email and we'll send a reset link.",
              style: AppTypography.interSecondary,
            ),
            const SizedBox(height: 20),
            ApexTextField(
              controller: controller,
              label: 'Email',
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.done,
              autofocus: true,
              onFieldSubmitted: (_) => Navigator.of(context).pop(true),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ApexButton(
                    label: 'Cancel',
                    onPressed: () => Navigator.of(context).pop(false),
                    variant: ApexButtonVariant.outlined,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ApexButton(
                    label: 'Send Link',
                    onPressed: () => Navigator.of(context).pop(true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
