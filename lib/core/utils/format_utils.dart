import 'package:intl/intl.dart';

/// Format a ride duration as "Xh Ym" or "Ym".
String formatDuration(DateTime start, DateTime? end) {
  final duration = (end ?? DateTime.now()).difference(start);
  final hours = duration.inHours;
  final minutes = duration.inMinutes % 60;

  if (hours > 0) {
    return '${hours}h ${minutes}m';
  }
  return '${minutes}m';
}

/// Format a date relative to now: "Today", "Yesterday", "3 days ago", "Mar 12".
String formatRelativeDate(DateTime date) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final target = DateTime(date.year, date.month, date.day);
  final diff = today.difference(target).inDays;

  if (diff == 0) return 'Today';
  if (diff == 1) return 'Yesterday';
  if (diff < 7) return '$diff days ago';
  return DateFormat('MMM d').format(date);
}

/// Format a full date+time: "Mar 12, 2026 at 2:30 PM".
String formatDateTime(DateTime dt) {
  return DateFormat("MMM d, y 'at' h:mm a").format(dt);
}
