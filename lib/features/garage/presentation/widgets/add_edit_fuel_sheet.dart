import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/apex_button.dart';
import '../../../../core/widgets/apex_text_field.dart';
import '../../providers/fuel_logs_provider.dart';

/// Bottom sheet for adding or editing a fuel log.
class AddEditFuelSheet extends ConsumerStatefulWidget {
  const AddEditFuelSheet({
    super.key,
    required this.bike,
    this.fuelLog,
  });

  final Bike bike;
  final FuelLog? fuelLog;

  bool get isEdit => fuelLog != null;

  static Future<void> show(
    BuildContext context, {
    required Bike bike,
    FuelLog? fuelLog,
  }) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddEditFuelSheet(bike: bike, fuelLog: fuelLog),
    );
  }

  @override
  ConsumerState<AddEditFuelSheet> createState() => _AddEditFuelSheetState();
}

class _AddEditFuelSheetState extends ConsumerState<AddEditFuelSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _odoCtrl;
  late final TextEditingController _litresCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _totalCtrl;
  late bool _isFullTank;
  late DateTime _selectedDate;
  bool _isSubmitting = false;

  // Track which fields user manually edited
  String? _autoCalcField; // 'litres', 'price', 'total', or null
  String? _calcMessage;
  String? _calcError;

  @override
  void initState() {
    super.initState();
    final log = widget.fuelLog;

    _odoCtrl = TextEditingController(
      text: log != null
          ? log.odometer.toInt().toString()
          : widget.bike.currentOdo.toInt().toString(),
    );
    _litresCtrl = TextEditingController(
      text: log != null ? log.litres.toStringAsFixed(2) : '',
    );
    _priceCtrl = TextEditingController(
      text: log != null
          ? log.pricePerLitre.toStringAsFixed(2)
          : (widget.bike.lastFuelPrice != null
              ? widget.bike.lastFuelPrice!.toStringAsFixed(2)
              : ''),
    );
    _totalCtrl = TextEditingController(
      text: log != null ? log.totalCost.toStringAsFixed(2) : '',
    );
    _isFullTank = log?.isFullTank ?? false;
    _selectedDate = log != null
        ? (DateTime.tryParse(log.date) ?? DateTime.now())
        : DateTime.now();

    // Listen for changes to trigger 3-field calculation
    _litresCtrl.addListener(_recalculate);
    _priceCtrl.addListener(_recalculate);
    _totalCtrl.addListener(_recalculate);
  }

  @override
  void dispose() {
    _litresCtrl.removeListener(_recalculate);
    _priceCtrl.removeListener(_recalculate);
    _totalCtrl.removeListener(_recalculate);
    _odoCtrl.dispose();
    _litresCtrl.dispose();
    _priceCtrl.dispose();
    _totalCtrl.dispose();
    super.dispose();
  }

  void _recalculate() {
    final litres = double.tryParse(_litresCtrl.text.trim());
    final price = double.tryParse(_priceCtrl.text.trim());
    final total = double.tryParse(_totalCtrl.text.trim());

    final hasLitres = litres != null && litres > 0;
    final hasPrice = price != null && price > 0;
    final hasTotal = total != null && total > 0;

    final filledCount = [hasLitres, hasPrice, hasTotal].where((v) => v).length;

    setState(() {
      _autoCalcField = null;
      _calcMessage = null;
      _calcError = null;

      if (filledCount == 3) {
        // Validate consistency
        final expected = litres! * price!;
        if ((expected - total!).abs() > 0.05) {
          _calcError =
              'Values do not match. Clear one field to auto-calculate.';
        }
      } else if (filledCount == 2) {
        if (hasLitres && hasPrice) {
          final calc = (litres * price * 100).roundToDouble() / 100;
          _autoCalcField = 'total';
          _calcMessage = 'Total cost: ₹${calc.toStringAsFixed(2)}';
        } else if (hasLitres && hasTotal) {
          final calc = (total / litres * 100).roundToDouble() / 100;
          _autoCalcField = 'price';
          _calcMessage = 'Price per litre: ₹${calc.toStringAsFixed(2)}';
        } else if (hasPrice && hasTotal) {
          final calc = (total / price * 100).roundToDouble() / 100;
          _autoCalcField = 'litres';
          _calcMessage = 'Litres: ${calc.toStringAsFixed(2)}';
        }
      }
    });
  }

  double _round2(double v) => (v * 100).roundToDouble() / 100;

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    // 3-field validation
    final litres = double.tryParse(_litresCtrl.text.trim());
    final price = double.tryParse(_priceCtrl.text.trim());
    final total = double.tryParse(_totalCtrl.text.trim());

    final hasLitres = litres != null && litres > 0;
    final hasPrice = price != null && price > 0;
    final hasTotal = total != null && total > 0;
    final filledCount = [hasLitres, hasPrice, hasTotal].where((v) => v).length;

    if (filledCount < 2) {
      ApexToast.error(
        context,
        'Enter any two: litres, price per litre, or total cost.',
      );
      return;
    }

    if (_calcError != null) {
      ApexToast.error(context, _calcError!);
      return;
    }

    setState(() => _isSubmitting = true);

    // Resolve final values
    double finalLitres;
    double finalPrice;
    double finalTotal;

    if (_autoCalcField == 'litres') {
      finalLitres = _round2(total! / price!);
      finalPrice = _round2(price);
      finalTotal = _round2(total);
    } else if (_autoCalcField == 'price') {
      finalLitres = _round2(litres!);
      finalPrice = _round2(total! / litres);
      finalTotal = _round2(total);
    } else if (_autoCalcField == 'total') {
      finalLitres = _round2(litres!);
      finalPrice = _round2(price!);
      finalTotal = _round2(litres * price);
    } else {
      // All 3 provided
      finalLitres = _round2(litres!);
      finalPrice = _round2(price!);
      finalTotal = _round2(total!);
    }

    final odo =
        double.tryParse(_odoCtrl.text.trim())?.roundToDouble() ?? 0;
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    final actions = ref.read(fuelActionsProvider);

    try {
      if (widget.isEdit) {
        await actions.updateFuelLog(
          id: widget.fuelLog!.id,
          bikeId: widget.bike.id,
          odometer: odo,
          litres: finalLitres,
          pricePerLitre: finalPrice,
          totalCost: finalTotal,
          isFullTank: _isFullTank,
          date: dateStr,
        );
        if (mounted) {
          ApexToast.success(context, 'Fuel log updated');
          Navigator.of(context).pop();
        }
      } else {
        await ApexToast.promise(
          context,
          actions.addFuelLog(
            bikeId: widget.bike.id,
            odometer: odo,
            litres: finalLitres,
            pricePerLitre: finalPrice,
            totalCost: finalTotal,
            isFullTank: _isFullTank,
            date: dateStr,
          ),
          loading: 'Adding fuel log...',
          success: 'Fuel log added',
          error: 'Failed to add fuel log',
        );
        if (mounted) Navigator.of(context).pop();
      }
    } catch (_) {
      // Toast already shown
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.dark(
            primary: context.accent,
            surface: AppColors.backgroundDark,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
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
              child: Text(
                widget.isEdit ? 'Edit Fuel Log' : 'Add Fuel Log',
                style: AppTypography.playfairDisplaySmall,
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
                      controller: _litresCtrl,
                      label: 'Litres',
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return null;
                        final val = double.tryParse(v.trim());
                        if (val != null && val <= 0) return 'Must be > 0';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    ApexTextField(
                      controller: _priceCtrl,
                      label: 'Price per Litre',
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return null;
                        final val = double.tryParse(v.trim());
                        if (val != null && val <= 0) return 'Must be > 0';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    ApexTextField(
                      controller: _totalCtrl,
                      label: 'Total Cost',
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return null;
                        final val = double.tryParse(v.trim());
                        if (val != null && val <= 0) return 'Must be > 0';
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    // Auto-calc info/error
                    if (_calcMessage != null)
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: context.accent.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: context.accent.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.auto_fix_high,
                              size: 16,
                              color: context.accent,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _calcMessage!,
                              style: AppTypography.interSmall.copyWith(
                                color: context.accent,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (_calcError != null)
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: AppColors.error.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              size: 16,
                              color: AppColors.error,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _calcError!,
                                style: AppTypography.interSmall.copyWith(
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 14),
                    // Full Tank switch
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Full Tank', style: AppTypography.inter),
                        Switch.adaptive(
                          value: _isFullTank,
                          onChanged: (v) => setState(() => _isFullTank = v),
                          activeTrackColor:
                              context.accent.withValues(alpha: 0.5),
                          activeThumbColor: context.accent,
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    // Date picker
                    GestureDetector(
                      onTap: _pickDate,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.cardBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              DateFormat('MMM d, yyyy').format(_selectedDate),
                              style: AppTypography.inter,
                            ),
                            const Icon(
                              Icons.calendar_today,
                              size: 18,
                              color: AppColors.textSecondary,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ApexButton(
                      label: widget.isEdit ? 'Save Changes' : 'Add Fuel Log',
                      onPressed: _isSubmitting ? null : _onSubmit,
                      isLoading: _isSubmitting,
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
