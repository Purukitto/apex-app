import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/theme/app_typography.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    // Stub out font loading to avoid async errors in unit tests.
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('flutter.io/WfkYJ'),
          (call) async => null,
        );
  });

  group('AppTypography', () {
    testWidgets('display styles use sans-serif (Inter), not serif Playfair', (
      tester,
    ) async {
      final display = AppTypography.playfairDisplay;
      final displayLarge = AppTypography.playfairDisplayLarge;
      final displaySmall = AppTypography.playfairDisplaySmall;

      for (final style in [display, displayLarge, displaySmall]) {
        expect(
          style.fontFamily!.contains('Playfair'),
          isFalse,
          reason: 'Display should not use Playfair serif: ${style.fontFamily}',
        );
        expect(
          style.fontFamily!.contains('Inter'),
          isTrue,
          reason: 'Display should use Inter: ${style.fontFamily}',
        );
      }
    });

    testWidgets('body styles use Inter font family', (tester) async {
      for (final style in [
        AppTypography.inter,
        AppTypography.interSmall,
        AppTypography.interLabel,
      ]) {
        expect(
          style.fontFamily!.contains('Inter'),
          isTrue,
          reason: 'Body style should use Inter: ${style.fontFamily}',
        );
      }
    });

    testWidgets('mono styles use JetBrains Mono font family', (tester) async {
      for (final style in [
        AppTypography.jetBrainsMono,
        AppTypography.jetBrainsMonoLarge,
        AppTypography.jetBrainsMonoSmall,
      ]) {
        expect(
          style.fontFamily!.contains('JetBrains'),
          isTrue,
          reason: 'Mono should use JetBrains Mono: ${style.fontFamily}',
        );
      }
    });
  });
}
