import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/providers/theme_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/logger.dart';
import '../../../core/utils/toast.dart';
import '../../../core/widgets/apex_button.dart';
import '../../../core/widgets/apex_text_field.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/mesh_background.dart';
import '../../../core/widgets/user_avatar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/services/update_checker.dart';
import '../providers/profile_provider.dart';
import 'bug_report_sheet.dart';
import 'changelog_sheet.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  String? _appVersion;

  @override
  void initState() {
    super.initState();
    _loadAppVersion();
  }

  Future<void> _loadAppVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (mounted) setState(() => _appVersion = info.version);
    } catch (e) {
      AppLogger.w('Could not load package info', e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: Text(
          'Profile',
          style: AppTypography.inter.copyWith(fontSize: 18),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => context.pop(),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: MeshBackground(
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _AccountSection()
                    .animate()
                    .fadeIn(duration: 500.ms)
                    .slideY(begin: 0.05, end: 0),
                const SizedBox(height: 16),
                _ThemeSection()
                    .animate()
                    .fadeIn(duration: 500.ms, delay: 100.ms)
                    .slideY(begin: 0.05, end: 0, delay: 100.ms),
                const SizedBox(height: 16),
                _AppSection(appVersion: _appVersion)
                    .animate()
                    .fadeIn(duration: 500.ms, delay: 200.ms)
                    .slideY(begin: 0.05, end: 0, delay: 200.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Account Section ────────────────────────────────────────────────────────────

class _AccountSection extends ConsumerStatefulWidget {
  const _AccountSection();

  @override
  ConsumerState<_AccountSection> createState() => _AccountSectionState();
}

class _AccountSectionState extends ConsumerState<_AccountSection> {
  final _riderNameController = TextEditingController();
  bool _editingName = false;
  bool _savingName = false;

  @override
  void dispose() {
    _riderNameController.dispose();
    super.dispose();
  }

  Future<void> _saveRiderName() async {
    final name = _riderNameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _savingName = true);
    try {
      await ApexToast.promise(
        context,
        ref.read(profileProvider.notifier).updateRiderName(name),
        loading: 'Saving...',
        success: 'Rider Name Updated',
        error: 'Update failed. Please try again.',
      );
      if (mounted) setState(() => _editingName = false);
    } catch (_) {
      // Error already shown via promise
    } finally {
      if (mounted) setState(() => _savingName = false);
    }
  }

  void _startEditName(String current) {
    _riderNameController.text = current;
    setState(() => _editingName = true);
  }

  void _cancelEditName() {
    setState(() => _editingName = false);
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);

    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('ACCOUNT', style: AppTypography.interLabel),
          const SizedBox(height: 16),
          profileAsync.when(
            loading: () =>
                const Center(child: CircularProgressIndicator.adaptive()),
            error: (e, _) => Text(
              'Failed to load profile',
              style: AppTypography.inter.copyWith(color: AppColors.error),
            ),
            data: (profile) => Column(
              children: [
                // Avatar
                Center(
                  child: UserAvatar(
                    name: profile.riderName ?? '',
                    size: 64,
                    navigateToProfile: false,
                  ),
                ),
                const SizedBox(height: 16),
                // Rider Name
                _buildRiderNameRow(profile.riderName ?? ''),
                const Divider(color: AppColors.cardBorder, height: 32),
                // Email
                _EmailRow(email: profile.email),
                const Divider(color: AppColors.cardBorder, height: 32),
                // Change Password
                _ChangePasswordRow(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRiderNameRow(String currentName) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Rider Name', style: AppTypography.interSecondary),
              const SizedBox(height: 4),
              if (_editingName)
                Focus(
                  onFocusChange: (hasFocus) {
                    if (!hasFocus && _editingName && !_savingName) {
                      _saveRiderName();
                    }
                  },
                  child: ApexTextField(
                    controller: _riderNameController,
                    maxLength: kRiderNameMaxLength,
                    autofocus: true,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _saveRiderName(),
                  ),
                )
              else
                Text(
                  currentName.isNotEmpty ? currentName : '—',
                  style: AppTypography.inter,
                ),
            ],
          ),
        ),
        if (_editingName) ...[
          IconButton(
            icon: const Icon(Icons.close, color: AppColors.textMuted, size: 18),
            onPressed: _cancelEditName,
          ),
          IconButton(
            icon: _savingName
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator.adaptive(strokeWidth: 2),
                  )
                : Icon(Icons.check, color: context.accent, size: 18),
            onPressed: _savingName ? null : _saveRiderName,
          ),
        ] else
          IconButton(
            icon: const Icon(
              Icons.edit_outlined,
              color: AppColors.textMuted,
              size: 18,
            ),
            onPressed: () => _startEditName(currentName),
          ),
      ],
    );
  }
}

// ── Email Row ──────────────────────────────────────────────────────────────────

class _EmailRow extends ConsumerStatefulWidget {
  const _EmailRow({required this.email});

  final String email;

  @override
  ConsumerState<_EmailRow> createState() => _EmailRowState();
}

class _EmailRowState extends ConsumerState<_EmailRow> {
  Future<void> _initiateEmailChange() async {
    await showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _EmailChangeSheet(currentEmail: widget.email),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Email', style: AppTypography.interSecondary),
              const SizedBox(height: 4),
              Text(widget.email, style: AppTypography.inter),
            ],
          ),
        ),
        TextButton(
          onPressed: _initiateEmailChange,
          child: Text(
            'Change',
            style: AppTypography.interSmall.copyWith(color: context.accent),
          ),
        ),
      ],
    );
  }
}

// ── Email Change Bottom Sheet ──────────────────────────────────────────────────

class _EmailChangeSheet extends ConsumerStatefulWidget {
  const _EmailChangeSheet({required this.currentEmail});

  final String currentEmail;

  @override
  ConsumerState<_EmailChangeSheet> createState() => _EmailChangeSheetState();
}

class _EmailChangeSheetState extends ConsumerState<_EmailChangeSheet> {
  final _newEmailController = TextEditingController();
  final _currentOtpController = TextEditingController();
  final _newOtpController = TextEditingController();

  bool _isLoading = false;
  bool _showOtpStep = false;

  @override
  void dispose() {
    _newEmailController.dispose();
    _currentOtpController.dispose();
    _newOtpController.dispose();
    super.dispose();
  }

  Future<void> _initiateChange() async {
    final email = _newEmailController.text.trim();
    if (email.isEmpty) {
      ApexToast.error(context, 'Please enter a new email address');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(profileProvider.notifier).updateEmail(email);
      if (mounted) {
        ApexToast.success(
          context,
          'Verification codes sent to both email addresses',
        );
        setState(() => _showOtpStep = true);
      }
    } catch (e) {
      if (mounted) {
        ApexToast.error(context, 'Failed to initiate email change');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyAndChange() async {
    final newEmail = _newEmailController.text.trim();
    final token = _newOtpController.text.trim();

    if (token.length != kOtpLength) {
      ApexToast.error(context, 'Please enter the 6-digit code');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref
          .read(profileProvider.notifier)
          .verifyEmailChangeOtp(email: newEmail, token: token);
      if (mounted) {
        ApexToast.success(context, 'Email address updated successfully');
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ApexToast.error(context, 'Invalid or expired verification code');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: GlassCard(
          padding: const EdgeInsets.all(24),
          borderRadius: 20,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Change Email',
                    style: AppTypography.playfairDisplay.copyWith(fontSize: 20),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.close,
                      color: AppColors.textMuted,
                      size: 18,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (!_showOtpStep) ...[
                ApexTextField(
                  controller: _newEmailController,
                  label: 'New Email Address',
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  autofocus: true,
                  onFieldSubmitted: (_) => _initiateChange(),
                ),
                const SizedBox(height: 16),
                ApexButton(
                  label: 'Send Verification Codes',
                  onPressed: _isLoading ? null : _initiateChange,
                  isLoading: _isLoading,
                ),
              ] else ...[
                Text(
                  'Enter the codes sent to both email addresses.',
                  style: AppTypography.interSecondary,
                ),
                const SizedBox(height: 12),
                ApexTextField(
                  controller: _newOtpController,
                  label: 'Code sent to new email',
                  keyboardType: TextInputType.number,
                  maxLength: kOtpLength,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _verifyAndChange(),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _isLoading
                      ? null
                      : () async {
                          await ref
                              .read(profileProvider.notifier)
                              .resendEmailChangeOtp(
                                _newEmailController.text.trim(),
                              );
                          if (context.mounted) {
                            ApexToast.success(
                              context,
                              'Verification codes resent',
                            );
                          }
                        },
                  child: Text(
                    'Resend codes',
                    style: AppTypography.interSmall.copyWith(
                      color: context.accent,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                ApexButton(
                  label: 'Verify & Update Email',
                  onPressed: _isLoading ? null : _verifyAndChange,
                  isLoading: _isLoading,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Change Password Row ────────────────────────────────────────────────────────

class _ChangePasswordRow extends ConsumerWidget {
  const _ChangePasswordRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Password', style: AppTypography.interSecondary),
              const SizedBox(height: 4),
              Text('••••••••', style: AppTypography.inter),
            ],
          ),
        ),
        TextButton(
          onPressed: () => _showChangePasswordSheet(context, ref),
          child: Text(
            'Change',
            style: AppTypography.interSmall.copyWith(color: context.accent),
          ),
        ),
      ],
    );
  }

  void _showChangePasswordSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _ChangePasswordSheet(),
    );
  }
}

// ── Change Password Bottom Sheet ───────────────────────────────────────────────

class _ChangePasswordSheet extends ConsumerStatefulWidget {
  const _ChangePasswordSheet();

  @override
  ConsumerState<_ChangePasswordSheet> createState() =>
      _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends ConsumerState<_ChangePasswordSheet> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _otpController = TextEditingController();

  bool _isLoading = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _showOtpStep = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
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
      await ref.read(profileProvider.notifier).reauthenticate();
      if (mounted) {
        ApexToast.success(context, 'Verification code sent to your email');
        setState(() => _showOtpStep = true);
      }
    } catch (e) {
      if (mounted) {
        ApexToast.error(context, 'Failed to send verification code');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _changePassword() async {
    final nonce = _otpController.text.trim();
    if (nonce.length != kOtpLength) {
      ApexToast.error(context, 'Please enter the 6-digit code');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref
          .read(profileProvider.notifier)
          .updatePasswordWithNonce(
            password: _passwordController.text,
            nonce: nonce,
          );
      if (mounted) {
        ApexToast.success(context, 'Password updated successfully');
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ApexToast.error(context, 'Invalid or expired verification code');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: GlassCard(
          padding: const EdgeInsets.all(24),
          borderRadius: 20,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Change Password',
                    style: AppTypography.playfairDisplay.copyWith(fontSize: 20),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.close,
                      color: AppColors.textMuted,
                      size: 18,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (!_showOtpStep) ...[
                ApexTextField(
                  controller: _passwordController,
                  label: 'New Password',
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
                    onPressed: () => setState(() => _obscureNew = !_obscureNew),
                  ),
                ),
                const SizedBox(height: 12),
                ApexTextField(
                  controller: _confirmController,
                  label: 'Confirm Password',
                  obscureText: _obscureConfirm,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _sendOtp(),
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
                ),
                const SizedBox(height: 16),
                ApexButton(
                  label: 'Send Verification Code',
                  onPressed: _isLoading ? null : _sendOtp,
                  isLoading: _isLoading,
                ),
              ] else ...[
                Text(
                  'Enter the verification code sent to your email.',
                  style: AppTypography.interSecondary,
                ),
                const SizedBox(height: 12),
                ApexTextField(
                  controller: _otpController,
                  label: 'Verification Code',
                  keyboardType: TextInputType.number,
                  maxLength: kOtpLength,
                  textInputAction: TextInputAction.done,
                  autofocus: true,
                  onFieldSubmitted: (_) => _changePassword(),
                ),
                const SizedBox(height: 16),
                ApexButton(
                  label: 'Update Password',
                  onPressed: _isLoading ? null : _changePassword,
                  isLoading: _isLoading,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Theme Section ──────────────────────────────────────────────────────────────

class _ThemeSection extends ConsumerWidget {
  const _ThemeSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeState = ref.watch(themeProvider);
    final notifier = ref.read(themeProvider.notifier);

    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('APPEARANCE', style: AppTypography.interLabel),
          const SizedBox(height: 20),

          // Background toggle
          Text('Background', style: AppTypography.interSecondary),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _PillToggleButton(
                  label: 'Standard',
                  isSelected:
                      themeState.background == BackgroundVariant.apexBlack,
                  onTap: () =>
                      notifier.setBackground(BackgroundVariant.apexBlack),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _PillToggleButton(
                  label: 'OLED Black',
                  isSelected:
                      themeState.background == BackgroundVariant.oledBlack,
                  onTap: () =>
                      notifier.setBackground(BackgroundVariant.oledBlack),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Accent color picker
          Text('Accent Colour', style: AppTypography.interSecondary),
          const SizedBox(height: 12),
          Row(
            children: AccentColor.values.map((accent) {
              final color = ThemeNotifier.accentColorFor(accent);
              final isSelected = themeState.accent == accent;
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () => notifier.setAccent(accent),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: color,
                      border: isSelected
                          ? Border.all(color: AppColors.textPrimary, width: 2.5)
                          : Border.all(color: Colors.transparent, width: 2.5),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: color.withValues(alpha: 0.4),
                                blurRadius: 8,
                              ),
                            ]
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, color: Colors.white, size: 16)
                        : null,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _PillToggleButton extends StatelessWidget {
  const _PillToggleButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? context.accent.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? context.accent : AppColors.cardBorder,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTypography.interSmall.copyWith(
            color: isSelected ? context.accent : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w400 : FontWeight.w300,
          ),
        ),
      ),
    );
  }
}

// ── App Section ────────────────────────────────────────────────────────────────

class _AppSection extends ConsumerWidget {
  const _AppSection({this.appVersion});

  final String? appVersion;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('APP', style: AppTypography.interLabel),
          const SizedBox(height: 16),

          // Version
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Version', style: AppTypography.interSecondary),
              Text(
                appVersion ?? '—',
                style: AppTypography.jetBrainsMonoSmall.copyWith(
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),

          const Divider(color: AppColors.cardBorder, height: 32),

          // What's New
          ApexButton(
            label: "What's New",
            onPressed: () => ChangelogSheet.show(context),
            variant: ApexButtonVariant.outlined,
          ),

          const SizedBox(height: 8),

          // Check for Updates
          ApexButton(
            label: 'Check for Updates',
            onPressed: () => UpdateChecker.check(context),
            variant: ApexButtonVariant.outlined,
          ),

          const SizedBox(height: 8),

          // Bug report
          ApexButton(
            label: 'Report Bug',
            onPressed: () => BugReportSheet.show(context),
            variant: ApexButtonVariant.outlined,
          ),

          const Divider(color: AppColors.cardBorder, height: 32),

          // Sign out
          ApexButton(
            label: 'Sign Out',
            onPressed: () => _handleSignOut(context, ref),
            variant: ApexButtonVariant.ghost,
            accentColor: AppColors.error,
          ),

          const SizedBox(height: 24),

          // Made with intent
          Center(
            child: GestureDetector(
              onTap: () => launchUrl(
                Uri.parse('https://purukitto.xyz'),
                mode: LaunchMode.externalApplication,
              ),
              child: Column(
                children: [
                  Text(
                    'Made with intent',
                    style: AppTypography.interMuted.copyWith(fontSize: 12),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Purukitto.',
                    style: AppTypography.interSmall.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      color: context.accent,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSignOut(BuildContext context, WidgetRef ref) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Sign Out',
      message:
          'Are you sure you want to sign out? You will need to sign in again to access your data.',
      confirmLabel: 'Sign Out',
      isDestructive: true,
    );

    if (!confirmed) return;
    if (!context.mounted) return;

    try {
      await ref.read(profileProvider.notifier).signOut();
      if (context.mounted) context.go('/login');
    } catch (e) {
      AppLogger.e('Sign out error', e);
      if (context.mounted) {
        ApexToast.error(context, 'Failed to sign out. Please try again.');
      }
    }
  }
}
