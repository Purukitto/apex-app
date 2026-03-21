import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/apex_button.dart';
import '../../../../core/widgets/apex_text_field.dart';
import '../../providers/service_provider.dart';

/// Bottom sheet for completing a maintenance service.
class CompleteServiceSheet extends ConsumerStatefulWidget {
  const CompleteServiceSheet({
    super.key,
    required this.schedule,
    required this.bike,
  });

  final MaintenanceSchedule schedule;
  final Bike bike;

  static Future<void> show(
    BuildContext context, {
    required MaintenanceSchedule schedule,
    required Bike bike,
  }) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CompleteServiceSheet(schedule: schedule, bike: bike),
    );
  }

  @override
  ConsumerState<CompleteServiceSheet> createState() =>
      _CompleteServiceSheetState();
}

class _CompleteServiceSheetState extends ConsumerState<CompleteServiceSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _odoCtrl;
  late final TextEditingController _costCtrl;
  late final TextEditingController _notesCtrl;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _odoCtrl = TextEditingController(
      text: widget.bike.currentOdo.toInt().toString(),
    );
    _costCtrl = TextEditingController();
    _notesCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _odoCtrl.dispose();
    _costCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final odo = double.tryParse(_odoCtrl.text.trim()) ?? 0;
    final cost = double.tryParse(_costCtrl.text.trim());
    final notes = _notesCtrl.text.trim().isEmpty
        ? null
        : _notesCtrl.text.trim();

    final actions = ref.read(serviceActionsProvider);

    try {
      await ApexToast.promise(
        context,
        actions.completeService(
          scheduleId: widget.schedule.id,
          bikeId: widget.bike.id,
          serviceOdo: odo,
          cost: cost,
          notes: notes,
        ),
        loading: 'Completing service...',
        success: '${widget.schedule.partName} service completed',
        error: 'Failed to complete service',
      );
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      // Toast already shown
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.4,
      maxChildSize: 0.85,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: AppColors.backgroundDark,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(
            top: BorderSide(color: AppColors.cardBorder),
            left: BorderSide(color: AppColors.cardBorder),
            right: BorderSide(color: AppColors.cardBorder),
          ),
        ),
        child: Column(
          children: [
            // Drag handle
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textMuted,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Complete Service',
                    style: AppTypography.playfairDisplaySmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.schedule.partName,
                    style: AppTypography.interSecondary,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Form
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  children: [
                    ApexTextField(
                      controller: _odoCtrl,
                      label: 'Odometer (km)',
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Required';
                        final odo = double.tryParse(v.trim());
                        if (odo == null || odo < 0) {
                          return 'Must be 0 or greater';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    ApexTextField(
                      controller: _costCtrl,
                      label: 'Cost (optional)',
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return null;
                        final val = double.tryParse(v.trim());
                        if (val != null && val < 0) {
                          return 'Must be 0 or greater';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    ApexTextField(
                      controller: _notesCtrl,
                      label: 'Notes (optional)',
                      keyboardType: TextInputType.text,
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: ApexButton(
                            label: 'Cancel',
                            onPressed: () => Navigator.of(context).pop(),
                            variant: ApexButtonVariant.outlined,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ApexButton(
                            label: 'Complete Service',
                            onPressed: _isSubmitting ? null : _onSubmit,
                            isLoading: _isSubmitting,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
