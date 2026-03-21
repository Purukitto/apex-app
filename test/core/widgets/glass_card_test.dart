import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/widgets/glass_card.dart';

void main() {
  Widget buildTestApp({required Widget child}) {
    return MaterialApp(
      theme: ThemeData.dark().copyWith(extensions: const []),
      home: Scaffold(body: child),
    );
  }

  group('GlassCard', () {
    testWidgets('renders child content', (tester) async {
      await tester.pumpWidget(
        buildTestApp(child: const GlassCard(child: Text('Test content'))),
      );

      expect(find.text('Test content'), findsOneWidget);
    });

    testWidgets('renders with default padding', (tester) async {
      await tester.pumpWidget(
        buildTestApp(child: const GlassCard(child: SizedBox())),
      );

      final container = tester.widget<Container>(find.byType(Container).first);
      expect(container.padding, const EdgeInsets.all(24));
    });

    testWidgets('renders accent variant', (tester) async {
      await tester.pumpWidget(
        buildTestApp(
          child: const GlassCard(isAccent: true, child: Text('Accent card')),
        ),
      );

      expect(find.text('Accent card'), findsOneWidget);
    });

    testWidgets('applies custom border radius', (tester) async {
      await tester.pumpWidget(
        buildTestApp(
          child: const GlassCard(borderRadius: 16, child: SizedBox()),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(16));
    });

    testWidgets('applies custom padding', (tester) async {
      await tester.pumpWidget(
        buildTestApp(
          child: const GlassCard(padding: EdgeInsets.all(8), child: SizedBox()),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container).first);
      expect(container.padding, const EdgeInsets.all(8));
    });
  });
}
