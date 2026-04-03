import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/widgets/bottom_nav_bar.dart';

void main() {
  Widget buildTestApp({required int currentIndex}) {
    return MaterialApp(
      theme: ThemeData.dark().copyWith(
        colorScheme: const ColorScheme.dark(primary: Colors.green),
      ),
      home: Scaffold(
        bottomNavigationBar: ApexBottomNavBar(
          currentIndex: currentIndex,
          onTap: (_) {},
        ),
      ),
    );
  }

  group('ApexBottomNavBar', () {
    testWidgets('renders exactly 4 destinations (no settings tab)', (
      tester,
    ) async {
      await tester.pumpWidget(buildTestApp(currentIndex: 0));

      // Should NOT contain a settings icon
      expect(find.byIcon(Icons.settings_outlined), findsNothing);
      expect(find.byIcon(Icons.settings), findsNothing);
    });

    testWidgets('uses two_wheeler icon for Garage tab', (tester) async {
      await tester.pumpWidget(buildTestApp(currentIndex: 0));

      expect(find.byIcon(Icons.two_wheeler_outlined), findsOneWidget);
    });

    testWidgets('uses route icon for History tab', (tester) async {
      await tester.pumpWidget(buildTestApp(currentIndex: 0));

      expect(find.byIcon(Icons.route_outlined), findsOneWidget);
    });

    testWidgets('shows Start Ride CTA button with text', (tester) async {
      await tester.pumpWidget(buildTestApp(currentIndex: 0));

      expect(find.text('Start Ride'), findsOneWidget);
    });

    testWidgets('highlights active destination based on index', (tester) async {
      await tester.pumpWidget(buildTestApp(currentIndex: 1));

      // Garage (index 1) should show active (filled) icon
      expect(find.byIcon(Icons.two_wheeler), findsOneWidget);
    });
  });
}
