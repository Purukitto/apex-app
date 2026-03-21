import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/utils/logger.dart';

/// A bike spec from the global shared `global_bike_specs` table.
class GlobalBikeSpec {
  const GlobalBikeSpec({
    required this.id,
    required this.make,
    required this.model,
    this.year,
    this.category,
    this.displacement,
    this.power,
    this.torque,
    this.imageUrl,
    this.isVerified = false,
    this.reportCount = 0,
    this.searchText,
  });

  final String id;
  final String make;
  final String model;
  final int? year;
  final String? category;
  final String? displacement;
  final String? power;
  final String? torque;
  final String? imageUrl;
  final bool isVerified;
  final int reportCount;
  final String? searchText;

  factory GlobalBikeSpec.fromJson(Map<String, dynamic> json) {
    return GlobalBikeSpec(
      id: json['id'] as String,
      make: json['make'] as String? ?? '',
      model: json['model'] as String? ?? '',
      year: json['year'] as int?,
      category: json['category'] as String?,
      displacement: json['displacement'] as String?,
      power: json['power'] as String?,
      torque: json['torque'] as String?,
      imageUrl: json['image_url'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
      reportCount: json['report_count'] as int? ?? 0,
      searchText: json['search_text'] as String?,
    );
  }
}

/// Searches the global `global_bike_specs` table.
///
/// Ported from React `src/services/bikeLibrary.ts`.
class GlobalBikeSearchService {
  /// Search bikes with client-side scoring.
  static Future<List<GlobalBikeSpec>> searchBikes(
    SupabaseClient client,
    String query, {
    int limit = 5,
  }) async {
    if (query.length < 3) return [];

    try {
      final response = await client
          .from('global_bike_specs')
          .select()
          .ilike('search_text', '%$query%')
          .or('is_verified.eq.true,report_count.lt.3')
          .order('is_verified', ascending: false)
          .order('make')
          .order('model')
          .limit(20); // Fetch more, score client-side, return top N

      final specs =
          (response as List).map((r) => GlobalBikeSpec.fromJson(r)).toList();

      // Client-side scoring
      final queryLower = query.toLowerCase();
      final queryWords = queryLower.split(RegExp(r'\s+'));

      final scored = specs.map((spec) {
        int score = 0;
        final makeLower = spec.make.toLowerCase();
        final modelLower = spec.model.toLowerCase();

        // Exact match bonuses
        if (makeLower == queryLower) score += 150;
        if (modelLower == queryLower) score += 200;

        // Word match bonuses
        for (final word in queryWords) {
          if (makeLower.contains(word)) score += 20;
          if (modelLower.contains(word)) score += 20;
        }

        // Verified bonus
        if (spec.isVerified) score += 1000;

        // Has year bonus
        if (spec.year != null) score += 5;

        return (spec: spec, score: score);
      }).toList();

      scored.sort((a, b) => b.score.compareTo(a.score));

      final results = scored.take(limit).map((e) => e.spec).toList();

      // Self-healing image fetch for results with null imageUrl
      for (final spec in results) {
        if (spec.imageUrl == null) {
          _fetchAndCacheImage(client, spec.id, spec.make, spec.model);
        }
      }

      return results;
    } catch (e, st) {
      AppLogger.e('Global bike search failed', e, st);
      return [];
    }
  }

  /// Report a bike spec as inaccurate.
  static Future<void> reportBikeSpec(
    SupabaseClient client,
    String bikeId,
  ) async {
    try {
      final current = await client
          .from('global_bike_specs')
          .select('report_count')
          .eq('id', bikeId)
          .single();

      final currentCount = current['report_count'] as int? ?? 0;

      await client
          .from('global_bike_specs')
          .update({'report_count': currentCount + 1}).eq('id', bikeId);
    } catch (e, st) {
      AppLogger.e('Failed to report bike spec', e, st);
    }
  }

  /// Self-healing: call edge function to fetch + cache a bike image.
  static Future<void> _fetchAndCacheImage(
    SupabaseClient client,
    String specId,
    String make,
    String model,
  ) async {
    try {
      await client.functions.invoke(
        'fetch-bike-image',
        body: {'spec_id': specId, 'make': make, 'model': model},
      );
    } catch (e) {
      AppLogger.d('Image fetch edge function failed for $make $model: $e');
    }
  }
}
