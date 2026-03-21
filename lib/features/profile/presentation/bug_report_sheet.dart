import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/logger.dart';
import '../../../core/utils/toast.dart';
import '../../../core/widgets/apex_button.dart';
import '../../../core/widgets/apex_text_field.dart';
import '../data/bug_report_service.dart';

class BugReportSheet extends StatefulWidget {
  const BugReportSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const BugReportSheet(),
    );
  }

  @override
  State<BugReportSheet> createState() => _BugReportSheetState();
}

class _BugReportSheetState extends State<BugReportSheet> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _stepsController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _stepsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    final description = _descriptionController.text.trim();
    final steps = _stepsController.text.trim();

    if (title.isEmpty) {
      ApexToast.error(context, 'Please enter a title');
      return;
    }
    if (description.isEmpty) {
      ApexToast.error(context, 'Please describe the bug');
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final result = await BugReportService.submit(
        title: title,
        description: description,
        stepsToReproduce: steps.isNotEmpty ? steps : null,
      );

      AppLogger.i('Bug report created: ${result.issueUrl}');

      if (mounted) {
        ApexToast.success(
          context,
          'Bug report submitted (#${result.issueNumber})',
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      AppLogger.e('Bug report submission failed', e);
      if (mounted) {
        ApexToast.error(
          context,
          e is Exception
              ? e.toString().replaceFirst('Exception: ', '')
              : 'Failed to submit bug report',
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) {
          return Container(
            decoration: const BoxDecoration(
              color: AppColors.backgroundDark,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: ListView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.textMuted,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Header
                Row(
                  children: [
                    Icon(
                      Icons.bug_report_outlined,
                      color: context.accent,
                      size: 22,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Bug Report',
                      style: AppTypography.playfairDisplay.copyWith(
                        fontSize: 24,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Title
                ApexTextField(
                  controller: _titleController,
                  label: 'Title',
                  hint: 'Brief summary of the issue',
                  maxLength: 120,
                  textInputAction: TextInputAction.next,
                  enabled: !_isSubmitting,
                ),
                const SizedBox(height: 16),

                // Description
                ApexTextField(
                  controller: _descriptionController,
                  label: 'Description',
                  hint: 'What happened? What did you expect to happen?',
                  maxLines: 4,
                  textInputAction: TextInputAction.newline,
                  enabled: !_isSubmitting,
                ),
                const SizedBox(height: 16),

                // Steps to reproduce
                ApexTextField(
                  controller: _stepsController,
                  label: 'Steps to Reproduce (optional)',
                  hint: '1. Go to...\n2. Tap on...\n3. See error',
                  maxLines: 3,
                  textInputAction: TextInputAction.newline,
                  enabled: !_isSubmitting,
                ),
                const SizedBox(height: 12),

                // Auto-attach note
                Text(
                  'Device info and recent logs are attached automatically.',
                  style: AppTypography.interMuted.copyWith(fontSize: 12),
                ),
                const SizedBox(height: 24),

                // Submit button
                ApexButton(
                  label: _isSubmitting ? 'Submitting...' : 'Submit Bug Report',
                  onPressed: _isSubmitting ? null : _submit,
                  isLoading: _isSubmitting,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
