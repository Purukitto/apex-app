import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/utils/format_utils.dart';

void main() {
  group('formatDuration', () {
    test('formats minutes only', () {
      final start = DateTime(2026, 3, 20, 10, 0);
      final end = DateTime(2026, 3, 20, 10, 45);
      expect(formatDuration(start, end), '45m');
    });

    test('formats hours and minutes', () {
      final start = DateTime(2026, 3, 20, 10, 0);
      final end = DateTime(2026, 3, 20, 12, 30);
      expect(formatDuration(start, end), '2h 30m');
    });

    test('formats exactly one hour', () {
      final start = DateTime(2026, 3, 20, 10, 0);
      final end = DateTime(2026, 3, 20, 11, 0);
      expect(formatDuration(start, end), '1h 0m');
    });

    test('formats 0 minutes', () {
      final start = DateTime(2026, 3, 20, 10, 0);
      final end = DateTime(2026, 3, 20, 10, 0);
      expect(formatDuration(start, end), '0m');
    });
  });

  group('formatRelativeDate', () {
    test('returns Today for current date', () {
      expect(formatRelativeDate(DateTime.now()), 'Today');
    });

    test('returns Yesterday for previous day', () {
      final yesterday = DateTime.now().subtract(const Duration(days: 1));
      expect(formatRelativeDate(yesterday), 'Yesterday');
    });

    test('returns N days ago for dates within a week', () {
      final threeDaysAgo = DateTime.now().subtract(const Duration(days: 3));
      expect(formatRelativeDate(threeDaysAgo), '3 days ago');
    });

    test('returns formatted date for dates older than a week', () {
      final oldDate = DateTime(2026, 1, 15);
      expect(formatRelativeDate(oldDate), 'Jan 15');
    });
  });

  group('formatDateTime', () {
    test('formats date and time correctly', () {
      final dt = DateTime(2026, 3, 20, 14, 30);
      expect(formatDateTime(dt), 'Mar 20, 2026 at 2:30 PM');
    });
  });
}
