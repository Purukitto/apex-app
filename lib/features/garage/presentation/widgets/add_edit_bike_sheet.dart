import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/network/supabase_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/string_utils.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/apex_button.dart';
import '../../../../core/widgets/apex_text_field.dart';
import '../../../../core/widgets/pressable_glass_card.dart';
import '../../data/global_bike_search_service.dart';
import '../../providers/bikes_provider.dart';

/// Bottom sheet for adding or editing a bike.
class AddEditBikeSheet extends ConsumerStatefulWidget {
  const AddEditBikeSheet({super.key, this.bike});

  final Bike? bike;

  bool get isEdit => bike != null;

  static Future<void> show(BuildContext context, {Bike? bike}) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddEditBikeSheet(bike: bike),
    );
  }

  @override
  ConsumerState<AddEditBikeSheet> createState() => _AddEditBikeSheetState();
}

class _AddEditBikeSheetState extends ConsumerState<AddEditBikeSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _makeCtrl;
  late final TextEditingController _modelCtrl;
  late final TextEditingController _yearCtrl;
  late final TextEditingController _nicknameCtrl;
  late final TextEditingController _odoCtrl;
  late final TextEditingController _imageUrlCtrl;
  late final TextEditingController _engineCtrl;
  late final TextEditingController _powerCtrl;
  late final TextEditingController _searchCtrl;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final b = widget.bike;
    _makeCtrl = TextEditingController(text: b?.make ?? '');
    _modelCtrl = TextEditingController(text: b?.model ?? '');
    _yearCtrl = TextEditingController(text: b?.year?.toString() ?? '');
    _nicknameCtrl = TextEditingController(text: b?.nickName ?? '');
    _odoCtrl = TextEditingController(
      text: b != null ? b.currentOdo.toInt().toString() : '',
    );
    _imageUrlCtrl = TextEditingController(text: b?.imageUrl ?? '');
    _engineCtrl = TextEditingController(text: b?.specsEngine ?? '');
    _powerCtrl = TextEditingController(text: b?.specsPower ?? '');
    _searchCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _makeCtrl.dispose();
    _modelCtrl.dispose();
    _yearCtrl.dispose();
    _nicknameCtrl.dispose();
    _odoCtrl.dispose();
    _imageUrlCtrl.dispose();
    _engineCtrl.dispose();
    _powerCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    ref.read(globalBikeSearchProvider.notifier).search(query);
  }

  void _onSpecSelected(GlobalBikeSpec spec) {
    _makeCtrl.text = spec.make.toTitleCase();
    _modelCtrl.text = spec.model.toTitleCase();
    _yearCtrl.text = spec.year?.toString() ?? '';
    _imageUrlCtrl.text = spec.imageUrl ?? '';
    _engineCtrl.text = spec.displacement ?? '';
    _powerCtrl.text = spec.power ?? '';

    _searchCtrl.clear();
    ref.read(globalBikeSearchProvider.notifier).clear();

  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final make = _makeCtrl.text.trim();
    final model = _modelCtrl.text.trim();
    final year = int.tryParse(_yearCtrl.text.trim());
    final nickname = _nicknameCtrl.text.trim();
    final odo = double.tryParse(_odoCtrl.text.trim())?.roundToDouble() ?? 0;
    final imageUrl = _imageUrlCtrl.text.trim();
    final engine = _engineCtrl.text.trim();
    final power = _powerCtrl.text.trim();

    final actions = ref.read(bikeActionsProvider);

    try {
      if (widget.isEdit) {
        await actions.updateBike(
          widget.bike!.id,
          make: make,
          model: model,
          year: year,
          nickName: nickname.isEmpty ? null : nickname,
          currentOdo: odo,
          imageUrl: imageUrl.isEmpty ? null : imageUrl,
          specsEngine: engine.isEmpty ? null : engine,
          specsPower: power.isEmpty ? null : power,
        );
        if (mounted) {
          ApexToast.success(context, 'Bike updated successfully');
          Navigator.of(context).pop();
        }
      } else {
        await ApexToast.promise(
          context,
          actions.addBike(
            make: make,
            model: model,
            year: year,
            nickName: nickname.isEmpty ? null : nickname,
            currentOdo: odo,
            imageUrl: imageUrl.isEmpty ? null : imageUrl,
            specsEngine: engine.isEmpty ? null : engine,
            specsPower: power.isEmpty ? null : power,
          ),
          loading: 'Adding bike...',
          success: 'Bike Added',
          error: 'Failed to add bike',
        );
        if (mounted) Navigator.of(context).pop();
      }
    } catch (_) {
      // Toast already shown by promise/error handler
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
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
                widget.isEdit ? 'Edit Bike' : 'Add Bike',
                style: AppTypography.playfairDisplaySmall,
              ),
            ),
            const SizedBox(height: 16),
            // Scrollable content
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  // Global search (add mode only)
                  if (!widget.isEdit) ...[
                    _buildSearchSection(),
                    const SizedBox(height: 16),
                  ],
                  // Form
                  Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        ApexTextField(
                          controller: _makeCtrl,
                          label: 'Make',
                          hint: 'e.g. Yamaha',
                          validator: (v) =>
                              v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 14),
                        ApexTextField(
                          controller: _modelCtrl,
                          label: 'Model',
                          hint: 'e.g. MT-07',
                          validator: (v) =>
                              v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 14),
                        ApexTextField(
                          controller: _yearCtrl,
                          label: 'Year',
                          hint: 'e.g. 2023',
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return null;
                            final year = int.tryParse(v.trim());
                            if (year == null) return 'Invalid year';
                            final currentYear = DateTime.now().year;
                            if (year < 1900 || year > currentYear + 1) {
                              return 'Year must be 1900–${currentYear + 1}';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                        ApexTextField(
                          controller: _nicknameCtrl,
                          label: 'Nickname',
                          hint: 'Optional',
                        ),
                        const SizedBox(height: 14),
                        ApexTextField(
                          controller: _odoCtrl,
                          label: 'Current Odometer (km)',
                          hint: '0',
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            if (!widget.isEdit) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Required';
                              }
                            }
                            if (v != null && v.trim().isNotEmpty) {
                              final odo = double.tryParse(v.trim());
                              if (odo == null || odo < 0) {
                                return 'Must be 0 or greater';
                              }
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                        ApexTextField(
                          controller: _imageUrlCtrl,
                          label: 'Image URL',
                          hint: 'Optional',
                          keyboardType: TextInputType.url,
                        ),
                        const SizedBox(height: 14),
                        ApexTextField(
                          controller: _engineCtrl,
                          label: 'Engine Specs',
                          hint: 'e.g. 689cc parallel twin',
                        ),
                        const SizedBox(height: 14),
                        ApexTextField(
                          controller: _powerCtrl,
                          label: 'Power Specs',
                          hint: 'e.g. 73.4 HP @ 8750 RPM',
                        ),
                        const SizedBox(height: 24),
                        ApexButton(
                          label: widget.isEdit ? 'Save Changes' : 'Add Bike',
                          onPressed: _isSubmitting ? null : _onSubmit,
                          isLoading: _isSubmitting,
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchSection() {
    final searchAsync = ref.watch(globalBikeSearchProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ApexTextField(
          controller: _searchCtrl,
          label: 'Search bike database',
          hint: 'e.g. Yamaha MT',
          prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
          onChanged: _onSearchChanged,
        ),
        searchAsync.when(
          loading: () => Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: context.accent,
                ),
              ),
            ),
          ),
          error: (_, _) => const SizedBox.shrink(),
          data: (results) {
            if (results.isEmpty) return const SizedBox.shrink();
            return Column(
              children: [
                const SizedBox(height: 8),
                ...results.map((spec) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: _SearchResultCard(
                        spec: spec,
                        onTap: () => _onSpecSelected(spec),
                        onReport: () {
                          GlobalBikeSearchService.reportBikeSpec(
                            ref.read(supabaseClientProvider),
                            spec.id,
                          );
                          ApexToast.success(context, 'Spec reported');
                        },
                      ),
                    )),
                Center(
                  child: TextButton(
                    onPressed: () {
                      _searchCtrl.clear();
                      ref.read(globalBikeSearchProvider.notifier).clear();
                  
                    },
                    child: Text(
                      'Enter details manually',
                      style: AppTypography.interSmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  const _SearchResultCard({
    required this.spec,
    required this.onTap,
    required this.onReport,
  });

  final GlobalBikeSpec spec;
  final VoidCallback onTap;
  final VoidCallback onReport;

  @override
  Widget build(BuildContext context) {
    return PressableGlassCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      borderRadius: 14,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        '${spec.make} ${spec.model}',
                        style: AppTypography.interSmall.copyWith(
                          fontWeight: FontWeight.w400,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (spec.isVerified) ...[
                      const SizedBox(width: 6),
                      Icon(
                        Icons.verified,
                        size: 14,
                        color: context.accent,
                      ),
                    ],
                  ],
                ),
                if (spec.year != null || spec.category != null)
                  Text(
                    [
                      if (spec.year != null) '${spec.year}',
                      if (spec.category != null) spec.category,
                    ].join(' · '),
                    style: AppTypography.interMuted.copyWith(fontSize: 12),
                  ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.flag_outlined, size: 16),
            color: AppColors.textMuted,
            onPressed: onReport,
            tooltip: 'Report inaccurate',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }
}
