import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/apex_button.dart';
import '../../../../core/widgets/apex_text_field.dart';
import '../../providers/rides_provider.dart';

class EditRideSheet extends ConsumerStatefulWidget {
  const EditRideSheet({super.key, required this.ride});

  final Ride ride;

  static Future<void> show(BuildContext context, Ride ride) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EditRideSheet(ride: ride),
    );
  }

  @override
  ConsumerState<EditRideSheet> createState() => _EditRideSheetState();
}

class _EditRideSheetState extends ConsumerState<EditRideSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _notesController;
  late final TextEditingController _imageController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.ride.rideName ?? '');
    _notesController = TextEditingController(text: widget.ride.notes ?? '');
    _imageController = TextEditingController(text: widget.ride.imageUrl ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _notesController.dispose();
    _imageController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final actions = ref.read(rideActionsProvider);
    final nav = Navigator.of(context);

    await ApexToast.promise(
      context,
      actions.updateRide(
        widget.ride.id,
        rideName: _nameController.text.trim().isEmpty
            ? null
            : _nameController.text.trim(),
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        imageUrl: _imageController.text.trim().isEmpty
            ? null
            : _imageController.text.trim(),
      ),
      loading: 'Saving ride…',
      success: 'Ride updated',
    );

    nav.pop();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.9,
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
                'Edit Ride',
                style: AppTypography.playfairDisplay.copyWith(fontSize: 24),
              ),
            ),
            const SizedBox(height: 16),
            // Scrollable content
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: EdgeInsets.fromLTRB(
                  20,
                  0,
                  20,
                  MediaQuery.of(context).viewInsets.bottom + 40,
                ),
                children: [
                  ApexTextField(
                    controller: _nameController,
                    label: 'Ride Name',
                    hint: 'e.g. Morning Ghats Run',
                  ),
                  const SizedBox(height: 16),

                  ApexTextField(
                    controller: _notesController,
                    label: 'Notes',
                    hint: 'How was the ride?',
                    keyboardType: TextInputType.multiline,
                    maxLength: 500,
                  ),
                  const SizedBox(height: 16),

                  ApexTextField(
                    controller: _imageController,
                    label: 'Image URL',
                    hint: 'https://...',
                    keyboardType: TextInputType.url,
                  ),
                  const SizedBox(height: 24),

                  ApexButton(
                    label: 'Save',
                    onPressed: _save,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
