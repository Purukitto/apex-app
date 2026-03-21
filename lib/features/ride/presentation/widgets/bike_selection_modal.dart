import 'package:flutter/material.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/pressable_glass_card.dart';

/// Bottom sheet for selecting a bike before starting a ride.
class BikeSelectionModal extends StatelessWidget {
  const BikeSelectionModal({
    super.key,
    required this.bikes,
    required this.onSelect,
  });

  final List<Bike> bikes;
  final ValueChanged<Bike> onSelect;

  static Future<Bike?> show(BuildContext context, List<Bike> bikes) {
    return showModalBottomSheet<Bike>(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => BikeSelectionModal(
        bikes: bikes,
        onSelect: (bike) => Navigator.of(ctx).pop(bike),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.6,
      ),
      decoration: BoxDecoration(
        color: AppColors.backgroundDark,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: const Border(
          top: BorderSide(color: AppColors.cardBorder),
          left: BorderSide(color: AppColors.cardBorder),
          right: BorderSide(color: AppColors.cardBorder),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Text(
              'Select Bike',
              style: AppTypography.playfairDisplay.copyWith(fontSize: 22),
            ),
          ),
          const SizedBox(height: 8),
          if (bikes.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(Icons.garage_outlined,
                      color: AppColors.textMuted, size: 48),
                  const SizedBox(height: 12),
                  Text('No bikes in garage',
                      style: AppTypography.interSecondary),
                ],
              ),
            )
          else
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: bikes.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final bike = bikes[index];
                  final label =
                      bike.nickName ?? '${bike.make} ${bike.model}';
                  return PressableGlassCard(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 16),
                    borderRadius: 16,
                    onTap: () => onSelect(bike),
                    child: Row(
                      children: [
                        Icon(Icons.two_wheeler,
                            color: context.accent, size: 24),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(label, style: AppTypography.inter),
                              if (bike.nickName != null)
                                Text(
                                  '${bike.make} ${bike.model}',
                                  style: AppTypography.interSecondary,
                                ),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right,
                            color: AppColors.textMuted, size: 20),
                      ],
                    ),
                  );
                },
              ),
            ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    );
  }
}
