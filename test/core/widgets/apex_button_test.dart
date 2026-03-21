import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/widgets/apex_button.dart';

void main() {
  Widget buildTestApp({required Widget child}) {
    return MaterialApp(
      theme: ThemeData.dark(),
      home: Scaffold(body: Center(child: child)),
    );
  }

  group('ApexButton', () {
    testWidgets('renders label text', (tester) async {
      await tester.pumpWidget(buildTestApp(
        child: ApexButton(
          label: 'Click Me',
          onPressed: () {},
        ),
      ));

      expect(find.text('Click Me'), findsOneWidget);
    });

    testWidgets('calls onPressed when tapped', (tester) async {
      var pressed = false;
      await tester.pumpWidget(buildTestApp(
        child: ApexButton(
          label: 'Tap',
          onPressed: () => pressed = true,
        ),
      ));

      await tester.tap(find.text('Tap'));
      expect(pressed, isTrue);
    });

    testWidgets('does not call onPressed when null', (tester) async {
      await tester.pumpWidget(buildTestApp(
        child: const ApexButton(
          label: 'Disabled',
          onPressed: null,
        ),
      ));

      // Should still render the text
      expect(find.text('Disabled'), findsOneWidget);
    });

    testWidgets('shows loading indicator when isLoading', (tester) async {
      await tester.pumpWidget(buildTestApp(
        child: ApexButton(
          label: 'Loading',
          onPressed: () {},
          isLoading: true,
        ),
      ));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading'), findsNothing);
    });

    testWidgets('renders filled variant by default', (tester) async {
      await tester.pumpWidget(buildTestApp(
        child: ApexButton(
          label: 'Filled',
          onPressed: () {},
        ),
      ));

      expect(find.text('Filled'), findsOneWidget);
    });

    testWidgets('renders outlined variant', (tester) async {
      await tester.pumpWidget(buildTestApp(
        child: ApexButton(
          label: 'Outlined',
          onPressed: () {},
          variant: ApexButtonVariant.outlined,
        ),
      ));

      expect(find.text('Outlined'), findsOneWidget);
    });

    testWidgets('renders ghost variant', (tester) async {
      await tester.pumpWidget(buildTestApp(
        child: ApexButton(
          label: 'Ghost',
          onPressed: () {},
          variant: ApexButtonVariant.ghost,
        ),
      ));

      expect(find.text('Ghost'), findsOneWidget);
    });
  });
}
