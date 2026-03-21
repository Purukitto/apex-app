// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $BikesTable extends Bikes with TableInfo<$BikesTable, Bike> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $BikesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _makeMeta = const VerificationMeta('make');
  @override
  late final GeneratedColumn<String> make = GeneratedColumn<String>(
    'make',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _modelMeta = const VerificationMeta('model');
  @override
  late final GeneratedColumn<String> model = GeneratedColumn<String>(
    'model',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _yearMeta = const VerificationMeta('year');
  @override
  late final GeneratedColumn<int> year = GeneratedColumn<int>(
    'year',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _currentOdoMeta = const VerificationMeta(
    'currentOdo',
  );
  @override
  late final GeneratedColumn<double> currentOdo = GeneratedColumn<double>(
    'current_odo',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
    defaultValue: const Constant(0.0),
  );
  static const VerificationMeta _nickNameMeta = const VerificationMeta(
    'nickName',
  );
  @override
  late final GeneratedColumn<String> nickName = GeneratedColumn<String>(
    'nick_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _imageUrlMeta = const VerificationMeta(
    'imageUrl',
  );
  @override
  late final GeneratedColumn<String> imageUrl = GeneratedColumn<String>(
    'image_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _specsEngineMeta = const VerificationMeta(
    'specsEngine',
  );
  @override
  late final GeneratedColumn<String> specsEngine = GeneratedColumn<String>(
    'specs_engine',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _specsPowerMeta = const VerificationMeta(
    'specsPower',
  );
  @override
  late final GeneratedColumn<String> specsPower = GeneratedColumn<String>(
    'specs_power',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _avgMileageMeta = const VerificationMeta(
    'avgMileage',
  );
  @override
  late final GeneratedColumn<double> avgMileage = GeneratedColumn<double>(
    'avg_mileage',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastFuelPriceMeta = const VerificationMeta(
    'lastFuelPrice',
  );
  @override
  late final GeneratedColumn<double> lastFuelPrice = GeneratedColumn<double>(
    'last_fuel_price',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _lastModifiedMeta = const VerificationMeta(
    'lastModified',
  );
  @override
  late final GeneratedColumn<DateTime> lastModified = GeneratedColumn<DateTime>(
    'last_modified',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    userId,
    make,
    model,
    year,
    currentOdo,
    nickName,
    imageUrl,
    specsEngine,
    specsPower,
    avgMileage,
    lastFuelPrice,
    createdAt,
    isSynced,
    lastModified,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'bikes';
  @override
  VerificationContext validateIntegrity(
    Insertable<Bike> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('make')) {
      context.handle(
        _makeMeta,
        make.isAcceptableOrUnknown(data['make']!, _makeMeta),
      );
    } else if (isInserting) {
      context.missing(_makeMeta);
    }
    if (data.containsKey('model')) {
      context.handle(
        _modelMeta,
        model.isAcceptableOrUnknown(data['model']!, _modelMeta),
      );
    } else if (isInserting) {
      context.missing(_modelMeta);
    }
    if (data.containsKey('year')) {
      context.handle(
        _yearMeta,
        year.isAcceptableOrUnknown(data['year']!, _yearMeta),
      );
    }
    if (data.containsKey('current_odo')) {
      context.handle(
        _currentOdoMeta,
        currentOdo.isAcceptableOrUnknown(data['current_odo']!, _currentOdoMeta),
      );
    }
    if (data.containsKey('nick_name')) {
      context.handle(
        _nickNameMeta,
        nickName.isAcceptableOrUnknown(data['nick_name']!, _nickNameMeta),
      );
    }
    if (data.containsKey('image_url')) {
      context.handle(
        _imageUrlMeta,
        imageUrl.isAcceptableOrUnknown(data['image_url']!, _imageUrlMeta),
      );
    }
    if (data.containsKey('specs_engine')) {
      context.handle(
        _specsEngineMeta,
        specsEngine.isAcceptableOrUnknown(
          data['specs_engine']!,
          _specsEngineMeta,
        ),
      );
    }
    if (data.containsKey('specs_power')) {
      context.handle(
        _specsPowerMeta,
        specsPower.isAcceptableOrUnknown(data['specs_power']!, _specsPowerMeta),
      );
    }
    if (data.containsKey('avg_mileage')) {
      context.handle(
        _avgMileageMeta,
        avgMileage.isAcceptableOrUnknown(data['avg_mileage']!, _avgMileageMeta),
      );
    }
    if (data.containsKey('last_fuel_price')) {
      context.handle(
        _lastFuelPriceMeta,
        lastFuelPrice.isAcceptableOrUnknown(
          data['last_fuel_price']!,
          _lastFuelPriceMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('last_modified')) {
      context.handle(
        _lastModifiedMeta,
        lastModified.isAcceptableOrUnknown(
          data['last_modified']!,
          _lastModifiedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_lastModifiedMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Bike map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Bike(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      make: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}make'],
      )!,
      model: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model'],
      )!,
      year: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}year'],
      ),
      currentOdo: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}current_odo'],
      )!,
      nickName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}nick_name'],
      ),
      imageUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}image_url'],
      ),
      specsEngine: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}specs_engine'],
      ),
      specsPower: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}specs_power'],
      ),
      avgMileage: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}avg_mileage'],
      ),
      lastFuelPrice: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}last_fuel_price'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      lastModified: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_modified'],
      )!,
    );
  }

  @override
  $BikesTable createAlias(String alias) {
    return $BikesTable(attachedDatabase, alias);
  }
}

class Bike extends DataClass implements Insertable<Bike> {
  final String id;
  final String userId;
  final String make;
  final String model;
  final int? year;
  final double currentOdo;
  final String? nickName;
  final String? imageUrl;
  final String? specsEngine;
  final String? specsPower;
  final double? avgMileage;
  final double? lastFuelPrice;
  final DateTime createdAt;
  final bool isSynced;
  final DateTime lastModified;
  const Bike({
    required this.id,
    required this.userId,
    required this.make,
    required this.model,
    this.year,
    required this.currentOdo,
    this.nickName,
    this.imageUrl,
    this.specsEngine,
    this.specsPower,
    this.avgMileage,
    this.lastFuelPrice,
    required this.createdAt,
    required this.isSynced,
    required this.lastModified,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['make'] = Variable<String>(make);
    map['model'] = Variable<String>(model);
    if (!nullToAbsent || year != null) {
      map['year'] = Variable<int>(year);
    }
    map['current_odo'] = Variable<double>(currentOdo);
    if (!nullToAbsent || nickName != null) {
      map['nick_name'] = Variable<String>(nickName);
    }
    if (!nullToAbsent || imageUrl != null) {
      map['image_url'] = Variable<String>(imageUrl);
    }
    if (!nullToAbsent || specsEngine != null) {
      map['specs_engine'] = Variable<String>(specsEngine);
    }
    if (!nullToAbsent || specsPower != null) {
      map['specs_power'] = Variable<String>(specsPower);
    }
    if (!nullToAbsent || avgMileage != null) {
      map['avg_mileage'] = Variable<double>(avgMileage);
    }
    if (!nullToAbsent || lastFuelPrice != null) {
      map['last_fuel_price'] = Variable<double>(lastFuelPrice);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['is_synced'] = Variable<bool>(isSynced);
    map['last_modified'] = Variable<DateTime>(lastModified);
    return map;
  }

  BikesCompanion toCompanion(bool nullToAbsent) {
    return BikesCompanion(
      id: Value(id),
      userId: Value(userId),
      make: Value(make),
      model: Value(model),
      year: year == null && nullToAbsent ? const Value.absent() : Value(year),
      currentOdo: Value(currentOdo),
      nickName: nickName == null && nullToAbsent
          ? const Value.absent()
          : Value(nickName),
      imageUrl: imageUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(imageUrl),
      specsEngine: specsEngine == null && nullToAbsent
          ? const Value.absent()
          : Value(specsEngine),
      specsPower: specsPower == null && nullToAbsent
          ? const Value.absent()
          : Value(specsPower),
      avgMileage: avgMileage == null && nullToAbsent
          ? const Value.absent()
          : Value(avgMileage),
      lastFuelPrice: lastFuelPrice == null && nullToAbsent
          ? const Value.absent()
          : Value(lastFuelPrice),
      createdAt: Value(createdAt),
      isSynced: Value(isSynced),
      lastModified: Value(lastModified),
    );
  }

  factory Bike.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Bike(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      make: serializer.fromJson<String>(json['make']),
      model: serializer.fromJson<String>(json['model']),
      year: serializer.fromJson<int?>(json['year']),
      currentOdo: serializer.fromJson<double>(json['currentOdo']),
      nickName: serializer.fromJson<String?>(json['nickName']),
      imageUrl: serializer.fromJson<String?>(json['imageUrl']),
      specsEngine: serializer.fromJson<String?>(json['specsEngine']),
      specsPower: serializer.fromJson<String?>(json['specsPower']),
      avgMileage: serializer.fromJson<double?>(json['avgMileage']),
      lastFuelPrice: serializer.fromJson<double?>(json['lastFuelPrice']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      lastModified: serializer.fromJson<DateTime>(json['lastModified']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'make': serializer.toJson<String>(make),
      'model': serializer.toJson<String>(model),
      'year': serializer.toJson<int?>(year),
      'currentOdo': serializer.toJson<double>(currentOdo),
      'nickName': serializer.toJson<String?>(nickName),
      'imageUrl': serializer.toJson<String?>(imageUrl),
      'specsEngine': serializer.toJson<String?>(specsEngine),
      'specsPower': serializer.toJson<String?>(specsPower),
      'avgMileage': serializer.toJson<double?>(avgMileage),
      'lastFuelPrice': serializer.toJson<double?>(lastFuelPrice),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'isSynced': serializer.toJson<bool>(isSynced),
      'lastModified': serializer.toJson<DateTime>(lastModified),
    };
  }

  Bike copyWith({
    String? id,
    String? userId,
    String? make,
    String? model,
    Value<int?> year = const Value.absent(),
    double? currentOdo,
    Value<String?> nickName = const Value.absent(),
    Value<String?> imageUrl = const Value.absent(),
    Value<String?> specsEngine = const Value.absent(),
    Value<String?> specsPower = const Value.absent(),
    Value<double?> avgMileage = const Value.absent(),
    Value<double?> lastFuelPrice = const Value.absent(),
    DateTime? createdAt,
    bool? isSynced,
    DateTime? lastModified,
  }) => Bike(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    make: make ?? this.make,
    model: model ?? this.model,
    year: year.present ? year.value : this.year,
    currentOdo: currentOdo ?? this.currentOdo,
    nickName: nickName.present ? nickName.value : this.nickName,
    imageUrl: imageUrl.present ? imageUrl.value : this.imageUrl,
    specsEngine: specsEngine.present ? specsEngine.value : this.specsEngine,
    specsPower: specsPower.present ? specsPower.value : this.specsPower,
    avgMileage: avgMileage.present ? avgMileage.value : this.avgMileage,
    lastFuelPrice: lastFuelPrice.present
        ? lastFuelPrice.value
        : this.lastFuelPrice,
    createdAt: createdAt ?? this.createdAt,
    isSynced: isSynced ?? this.isSynced,
    lastModified: lastModified ?? this.lastModified,
  );
  Bike copyWithCompanion(BikesCompanion data) {
    return Bike(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      make: data.make.present ? data.make.value : this.make,
      model: data.model.present ? data.model.value : this.model,
      year: data.year.present ? data.year.value : this.year,
      currentOdo: data.currentOdo.present
          ? data.currentOdo.value
          : this.currentOdo,
      nickName: data.nickName.present ? data.nickName.value : this.nickName,
      imageUrl: data.imageUrl.present ? data.imageUrl.value : this.imageUrl,
      specsEngine: data.specsEngine.present
          ? data.specsEngine.value
          : this.specsEngine,
      specsPower: data.specsPower.present
          ? data.specsPower.value
          : this.specsPower,
      avgMileage: data.avgMileage.present
          ? data.avgMileage.value
          : this.avgMileage,
      lastFuelPrice: data.lastFuelPrice.present
          ? data.lastFuelPrice.value
          : this.lastFuelPrice,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      lastModified: data.lastModified.present
          ? data.lastModified.value
          : this.lastModified,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Bike(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('year: $year, ')
          ..write('currentOdo: $currentOdo, ')
          ..write('nickName: $nickName, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('specsEngine: $specsEngine, ')
          ..write('specsPower: $specsPower, ')
          ..write('avgMileage: $avgMileage, ')
          ..write('lastFuelPrice: $lastFuelPrice, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    userId,
    make,
    model,
    year,
    currentOdo,
    nickName,
    imageUrl,
    specsEngine,
    specsPower,
    avgMileage,
    lastFuelPrice,
    createdAt,
    isSynced,
    lastModified,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Bike &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.make == this.make &&
          other.model == this.model &&
          other.year == this.year &&
          other.currentOdo == this.currentOdo &&
          other.nickName == this.nickName &&
          other.imageUrl == this.imageUrl &&
          other.specsEngine == this.specsEngine &&
          other.specsPower == this.specsPower &&
          other.avgMileage == this.avgMileage &&
          other.lastFuelPrice == this.lastFuelPrice &&
          other.createdAt == this.createdAt &&
          other.isSynced == this.isSynced &&
          other.lastModified == this.lastModified);
}

class BikesCompanion extends UpdateCompanion<Bike> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> make;
  final Value<String> model;
  final Value<int?> year;
  final Value<double> currentOdo;
  final Value<String?> nickName;
  final Value<String?> imageUrl;
  final Value<String?> specsEngine;
  final Value<String?> specsPower;
  final Value<double?> avgMileage;
  final Value<double?> lastFuelPrice;
  final Value<DateTime> createdAt;
  final Value<bool> isSynced;
  final Value<DateTime> lastModified;
  final Value<int> rowid;
  const BikesCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.make = const Value.absent(),
    this.model = const Value.absent(),
    this.year = const Value.absent(),
    this.currentOdo = const Value.absent(),
    this.nickName = const Value.absent(),
    this.imageUrl = const Value.absent(),
    this.specsEngine = const Value.absent(),
    this.specsPower = const Value.absent(),
    this.avgMileage = const Value.absent(),
    this.lastFuelPrice = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.lastModified = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  BikesCompanion.insert({
    required String id,
    required String userId,
    required String make,
    required String model,
    this.year = const Value.absent(),
    this.currentOdo = const Value.absent(),
    this.nickName = const Value.absent(),
    this.imageUrl = const Value.absent(),
    this.specsEngine = const Value.absent(),
    this.specsPower = const Value.absent(),
    this.avgMileage = const Value.absent(),
    this.lastFuelPrice = const Value.absent(),
    required DateTime createdAt,
    this.isSynced = const Value.absent(),
    required DateTime lastModified,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       userId = Value(userId),
       make = Value(make),
       model = Value(model),
       createdAt = Value(createdAt),
       lastModified = Value(lastModified);
  static Insertable<Bike> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? make,
    Expression<String>? model,
    Expression<int>? year,
    Expression<double>? currentOdo,
    Expression<String>? nickName,
    Expression<String>? imageUrl,
    Expression<String>? specsEngine,
    Expression<String>? specsPower,
    Expression<double>? avgMileage,
    Expression<double>? lastFuelPrice,
    Expression<DateTime>? createdAt,
    Expression<bool>? isSynced,
    Expression<DateTime>? lastModified,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (make != null) 'make': make,
      if (model != null) 'model': model,
      if (year != null) 'year': year,
      if (currentOdo != null) 'current_odo': currentOdo,
      if (nickName != null) 'nick_name': nickName,
      if (imageUrl != null) 'image_url': imageUrl,
      if (specsEngine != null) 'specs_engine': specsEngine,
      if (specsPower != null) 'specs_power': specsPower,
      if (avgMileage != null) 'avg_mileage': avgMileage,
      if (lastFuelPrice != null) 'last_fuel_price': lastFuelPrice,
      if (createdAt != null) 'created_at': createdAt,
      if (isSynced != null) 'is_synced': isSynced,
      if (lastModified != null) 'last_modified': lastModified,
      if (rowid != null) 'rowid': rowid,
    });
  }

  BikesCompanion copyWith({
    Value<String>? id,
    Value<String>? userId,
    Value<String>? make,
    Value<String>? model,
    Value<int?>? year,
    Value<double>? currentOdo,
    Value<String?>? nickName,
    Value<String?>? imageUrl,
    Value<String?>? specsEngine,
    Value<String?>? specsPower,
    Value<double?>? avgMileage,
    Value<double?>? lastFuelPrice,
    Value<DateTime>? createdAt,
    Value<bool>? isSynced,
    Value<DateTime>? lastModified,
    Value<int>? rowid,
  }) {
    return BikesCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      make: make ?? this.make,
      model: model ?? this.model,
      year: year ?? this.year,
      currentOdo: currentOdo ?? this.currentOdo,
      nickName: nickName ?? this.nickName,
      imageUrl: imageUrl ?? this.imageUrl,
      specsEngine: specsEngine ?? this.specsEngine,
      specsPower: specsPower ?? this.specsPower,
      avgMileage: avgMileage ?? this.avgMileage,
      lastFuelPrice: lastFuelPrice ?? this.lastFuelPrice,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
      lastModified: lastModified ?? this.lastModified,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (make.present) {
      map['make'] = Variable<String>(make.value);
    }
    if (model.present) {
      map['model'] = Variable<String>(model.value);
    }
    if (year.present) {
      map['year'] = Variable<int>(year.value);
    }
    if (currentOdo.present) {
      map['current_odo'] = Variable<double>(currentOdo.value);
    }
    if (nickName.present) {
      map['nick_name'] = Variable<String>(nickName.value);
    }
    if (imageUrl.present) {
      map['image_url'] = Variable<String>(imageUrl.value);
    }
    if (specsEngine.present) {
      map['specs_engine'] = Variable<String>(specsEngine.value);
    }
    if (specsPower.present) {
      map['specs_power'] = Variable<String>(specsPower.value);
    }
    if (avgMileage.present) {
      map['avg_mileage'] = Variable<double>(avgMileage.value);
    }
    if (lastFuelPrice.present) {
      map['last_fuel_price'] = Variable<double>(lastFuelPrice.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (lastModified.present) {
      map['last_modified'] = Variable<DateTime>(lastModified.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('BikesCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('year: $year, ')
          ..write('currentOdo: $currentOdo, ')
          ..write('nickName: $nickName, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('specsEngine: $specsEngine, ')
          ..write('specsPower: $specsPower, ')
          ..write('avgMileage: $avgMileage, ')
          ..write('lastFuelPrice: $lastFuelPrice, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $RidesTable extends Rides with TableInfo<$RidesTable, Ride> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RidesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bikeIdMeta = const VerificationMeta('bikeId');
  @override
  late final GeneratedColumn<String> bikeId = GeneratedColumn<String>(
    'bike_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _startTimeMeta = const VerificationMeta(
    'startTime',
  );
  @override
  late final GeneratedColumn<DateTime> startTime = GeneratedColumn<DateTime>(
    'start_time',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _endTimeMeta = const VerificationMeta(
    'endTime',
  );
  @override
  late final GeneratedColumn<DateTime> endTime = GeneratedColumn<DateTime>(
    'end_time',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _distanceKmMeta = const VerificationMeta(
    'distanceKm',
  );
  @override
  late final GeneratedColumn<double> distanceKm = GeneratedColumn<double>(
    'distance_km',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _maxLeanLeftMeta = const VerificationMeta(
    'maxLeanLeft',
  );
  @override
  late final GeneratedColumn<double> maxLeanLeft = GeneratedColumn<double>(
    'max_lean_left',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _maxLeanRightMeta = const VerificationMeta(
    'maxLeanRight',
  );
  @override
  late final GeneratedColumn<double> maxLeanRight = GeneratedColumn<double>(
    'max_lean_right',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _routePathMeta = const VerificationMeta(
    'routePath',
  );
  @override
  late final GeneratedColumn<String> routePath = GeneratedColumn<String>(
    'route_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _rideNameMeta = const VerificationMeta(
    'rideName',
  );
  @override
  late final GeneratedColumn<String> rideName = GeneratedColumn<String>(
    'ride_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _imageUrlMeta = const VerificationMeta(
    'imageUrl',
  );
  @override
  late final GeneratedColumn<String> imageUrl = GeneratedColumn<String>(
    'image_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _lastModifiedMeta = const VerificationMeta(
    'lastModified',
  );
  @override
  late final GeneratedColumn<DateTime> lastModified = GeneratedColumn<DateTime>(
    'last_modified',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    bikeId,
    userId,
    startTime,
    endTime,
    distanceKm,
    maxLeanLeft,
    maxLeanRight,
    routePath,
    rideName,
    notes,
    imageUrl,
    createdAt,
    isSynced,
    lastModified,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'rides';
  @override
  VerificationContext validateIntegrity(
    Insertable<Ride> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('bike_id')) {
      context.handle(
        _bikeIdMeta,
        bikeId.isAcceptableOrUnknown(data['bike_id']!, _bikeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bikeIdMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('start_time')) {
      context.handle(
        _startTimeMeta,
        startTime.isAcceptableOrUnknown(data['start_time']!, _startTimeMeta),
      );
    } else if (isInserting) {
      context.missing(_startTimeMeta);
    }
    if (data.containsKey('end_time')) {
      context.handle(
        _endTimeMeta,
        endTime.isAcceptableOrUnknown(data['end_time']!, _endTimeMeta),
      );
    }
    if (data.containsKey('distance_km')) {
      context.handle(
        _distanceKmMeta,
        distanceKm.isAcceptableOrUnknown(data['distance_km']!, _distanceKmMeta),
      );
    } else if (isInserting) {
      context.missing(_distanceKmMeta);
    }
    if (data.containsKey('max_lean_left')) {
      context.handle(
        _maxLeanLeftMeta,
        maxLeanLeft.isAcceptableOrUnknown(
          data['max_lean_left']!,
          _maxLeanLeftMeta,
        ),
      );
    }
    if (data.containsKey('max_lean_right')) {
      context.handle(
        _maxLeanRightMeta,
        maxLeanRight.isAcceptableOrUnknown(
          data['max_lean_right']!,
          _maxLeanRightMeta,
        ),
      );
    }
    if (data.containsKey('route_path')) {
      context.handle(
        _routePathMeta,
        routePath.isAcceptableOrUnknown(data['route_path']!, _routePathMeta),
      );
    }
    if (data.containsKey('ride_name')) {
      context.handle(
        _rideNameMeta,
        rideName.isAcceptableOrUnknown(data['ride_name']!, _rideNameMeta),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('image_url')) {
      context.handle(
        _imageUrlMeta,
        imageUrl.isAcceptableOrUnknown(data['image_url']!, _imageUrlMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('last_modified')) {
      context.handle(
        _lastModifiedMeta,
        lastModified.isAcceptableOrUnknown(
          data['last_modified']!,
          _lastModifiedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_lastModifiedMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Ride map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Ride(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      bikeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bike_id'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      startTime: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}start_time'],
      )!,
      endTime: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}end_time'],
      ),
      distanceKm: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}distance_km'],
      )!,
      maxLeanLeft: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}max_lean_left'],
      ),
      maxLeanRight: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}max_lean_right'],
      ),
      routePath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}route_path'],
      ),
      rideName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}ride_name'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      imageUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}image_url'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      lastModified: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_modified'],
      )!,
    );
  }

  @override
  $RidesTable createAlias(String alias) {
    return $RidesTable(attachedDatabase, alias);
  }
}

class Ride extends DataClass implements Insertable<Ride> {
  final String id;
  final String bikeId;
  final String userId;
  final DateTime startTime;
  final DateTime? endTime;
  final double distanceKm;
  final double? maxLeanLeft;
  final double? maxLeanRight;
  final String? routePath;
  final String? rideName;
  final String? notes;
  final String? imageUrl;
  final DateTime createdAt;
  final bool isSynced;
  final DateTime lastModified;
  const Ride({
    required this.id,
    required this.bikeId,
    required this.userId,
    required this.startTime,
    this.endTime,
    required this.distanceKm,
    this.maxLeanLeft,
    this.maxLeanRight,
    this.routePath,
    this.rideName,
    this.notes,
    this.imageUrl,
    required this.createdAt,
    required this.isSynced,
    required this.lastModified,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['bike_id'] = Variable<String>(bikeId);
    map['user_id'] = Variable<String>(userId);
    map['start_time'] = Variable<DateTime>(startTime);
    if (!nullToAbsent || endTime != null) {
      map['end_time'] = Variable<DateTime>(endTime);
    }
    map['distance_km'] = Variable<double>(distanceKm);
    if (!nullToAbsent || maxLeanLeft != null) {
      map['max_lean_left'] = Variable<double>(maxLeanLeft);
    }
    if (!nullToAbsent || maxLeanRight != null) {
      map['max_lean_right'] = Variable<double>(maxLeanRight);
    }
    if (!nullToAbsent || routePath != null) {
      map['route_path'] = Variable<String>(routePath);
    }
    if (!nullToAbsent || rideName != null) {
      map['ride_name'] = Variable<String>(rideName);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    if (!nullToAbsent || imageUrl != null) {
      map['image_url'] = Variable<String>(imageUrl);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['is_synced'] = Variable<bool>(isSynced);
    map['last_modified'] = Variable<DateTime>(lastModified);
    return map;
  }

  RidesCompanion toCompanion(bool nullToAbsent) {
    return RidesCompanion(
      id: Value(id),
      bikeId: Value(bikeId),
      userId: Value(userId),
      startTime: Value(startTime),
      endTime: endTime == null && nullToAbsent
          ? const Value.absent()
          : Value(endTime),
      distanceKm: Value(distanceKm),
      maxLeanLeft: maxLeanLeft == null && nullToAbsent
          ? const Value.absent()
          : Value(maxLeanLeft),
      maxLeanRight: maxLeanRight == null && nullToAbsent
          ? const Value.absent()
          : Value(maxLeanRight),
      routePath: routePath == null && nullToAbsent
          ? const Value.absent()
          : Value(routePath),
      rideName: rideName == null && nullToAbsent
          ? const Value.absent()
          : Value(rideName),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      imageUrl: imageUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(imageUrl),
      createdAt: Value(createdAt),
      isSynced: Value(isSynced),
      lastModified: Value(lastModified),
    );
  }

  factory Ride.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Ride(
      id: serializer.fromJson<String>(json['id']),
      bikeId: serializer.fromJson<String>(json['bikeId']),
      userId: serializer.fromJson<String>(json['userId']),
      startTime: serializer.fromJson<DateTime>(json['startTime']),
      endTime: serializer.fromJson<DateTime?>(json['endTime']),
      distanceKm: serializer.fromJson<double>(json['distanceKm']),
      maxLeanLeft: serializer.fromJson<double?>(json['maxLeanLeft']),
      maxLeanRight: serializer.fromJson<double?>(json['maxLeanRight']),
      routePath: serializer.fromJson<String?>(json['routePath']),
      rideName: serializer.fromJson<String?>(json['rideName']),
      notes: serializer.fromJson<String?>(json['notes']),
      imageUrl: serializer.fromJson<String?>(json['imageUrl']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      lastModified: serializer.fromJson<DateTime>(json['lastModified']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'bikeId': serializer.toJson<String>(bikeId),
      'userId': serializer.toJson<String>(userId),
      'startTime': serializer.toJson<DateTime>(startTime),
      'endTime': serializer.toJson<DateTime?>(endTime),
      'distanceKm': serializer.toJson<double>(distanceKm),
      'maxLeanLeft': serializer.toJson<double?>(maxLeanLeft),
      'maxLeanRight': serializer.toJson<double?>(maxLeanRight),
      'routePath': serializer.toJson<String?>(routePath),
      'rideName': serializer.toJson<String?>(rideName),
      'notes': serializer.toJson<String?>(notes),
      'imageUrl': serializer.toJson<String?>(imageUrl),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'isSynced': serializer.toJson<bool>(isSynced),
      'lastModified': serializer.toJson<DateTime>(lastModified),
    };
  }

  Ride copyWith({
    String? id,
    String? bikeId,
    String? userId,
    DateTime? startTime,
    Value<DateTime?> endTime = const Value.absent(),
    double? distanceKm,
    Value<double?> maxLeanLeft = const Value.absent(),
    Value<double?> maxLeanRight = const Value.absent(),
    Value<String?> routePath = const Value.absent(),
    Value<String?> rideName = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    Value<String?> imageUrl = const Value.absent(),
    DateTime? createdAt,
    bool? isSynced,
    DateTime? lastModified,
  }) => Ride(
    id: id ?? this.id,
    bikeId: bikeId ?? this.bikeId,
    userId: userId ?? this.userId,
    startTime: startTime ?? this.startTime,
    endTime: endTime.present ? endTime.value : this.endTime,
    distanceKm: distanceKm ?? this.distanceKm,
    maxLeanLeft: maxLeanLeft.present ? maxLeanLeft.value : this.maxLeanLeft,
    maxLeanRight: maxLeanRight.present ? maxLeanRight.value : this.maxLeanRight,
    routePath: routePath.present ? routePath.value : this.routePath,
    rideName: rideName.present ? rideName.value : this.rideName,
    notes: notes.present ? notes.value : this.notes,
    imageUrl: imageUrl.present ? imageUrl.value : this.imageUrl,
    createdAt: createdAt ?? this.createdAt,
    isSynced: isSynced ?? this.isSynced,
    lastModified: lastModified ?? this.lastModified,
  );
  Ride copyWithCompanion(RidesCompanion data) {
    return Ride(
      id: data.id.present ? data.id.value : this.id,
      bikeId: data.bikeId.present ? data.bikeId.value : this.bikeId,
      userId: data.userId.present ? data.userId.value : this.userId,
      startTime: data.startTime.present ? data.startTime.value : this.startTime,
      endTime: data.endTime.present ? data.endTime.value : this.endTime,
      distanceKm: data.distanceKm.present
          ? data.distanceKm.value
          : this.distanceKm,
      maxLeanLeft: data.maxLeanLeft.present
          ? data.maxLeanLeft.value
          : this.maxLeanLeft,
      maxLeanRight: data.maxLeanRight.present
          ? data.maxLeanRight.value
          : this.maxLeanRight,
      routePath: data.routePath.present ? data.routePath.value : this.routePath,
      rideName: data.rideName.present ? data.rideName.value : this.rideName,
      notes: data.notes.present ? data.notes.value : this.notes,
      imageUrl: data.imageUrl.present ? data.imageUrl.value : this.imageUrl,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      lastModified: data.lastModified.present
          ? data.lastModified.value
          : this.lastModified,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Ride(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('userId: $userId, ')
          ..write('startTime: $startTime, ')
          ..write('endTime: $endTime, ')
          ..write('distanceKm: $distanceKm, ')
          ..write('maxLeanLeft: $maxLeanLeft, ')
          ..write('maxLeanRight: $maxLeanRight, ')
          ..write('routePath: $routePath, ')
          ..write('rideName: $rideName, ')
          ..write('notes: $notes, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    bikeId,
    userId,
    startTime,
    endTime,
    distanceKm,
    maxLeanLeft,
    maxLeanRight,
    routePath,
    rideName,
    notes,
    imageUrl,
    createdAt,
    isSynced,
    lastModified,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Ride &&
          other.id == this.id &&
          other.bikeId == this.bikeId &&
          other.userId == this.userId &&
          other.startTime == this.startTime &&
          other.endTime == this.endTime &&
          other.distanceKm == this.distanceKm &&
          other.maxLeanLeft == this.maxLeanLeft &&
          other.maxLeanRight == this.maxLeanRight &&
          other.routePath == this.routePath &&
          other.rideName == this.rideName &&
          other.notes == this.notes &&
          other.imageUrl == this.imageUrl &&
          other.createdAt == this.createdAt &&
          other.isSynced == this.isSynced &&
          other.lastModified == this.lastModified);
}

class RidesCompanion extends UpdateCompanion<Ride> {
  final Value<String> id;
  final Value<String> bikeId;
  final Value<String> userId;
  final Value<DateTime> startTime;
  final Value<DateTime?> endTime;
  final Value<double> distanceKm;
  final Value<double?> maxLeanLeft;
  final Value<double?> maxLeanRight;
  final Value<String?> routePath;
  final Value<String?> rideName;
  final Value<String?> notes;
  final Value<String?> imageUrl;
  final Value<DateTime> createdAt;
  final Value<bool> isSynced;
  final Value<DateTime> lastModified;
  final Value<int> rowid;
  const RidesCompanion({
    this.id = const Value.absent(),
    this.bikeId = const Value.absent(),
    this.userId = const Value.absent(),
    this.startTime = const Value.absent(),
    this.endTime = const Value.absent(),
    this.distanceKm = const Value.absent(),
    this.maxLeanLeft = const Value.absent(),
    this.maxLeanRight = const Value.absent(),
    this.routePath = const Value.absent(),
    this.rideName = const Value.absent(),
    this.notes = const Value.absent(),
    this.imageUrl = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.lastModified = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  RidesCompanion.insert({
    required String id,
    required String bikeId,
    required String userId,
    required DateTime startTime,
    this.endTime = const Value.absent(),
    required double distanceKm,
    this.maxLeanLeft = const Value.absent(),
    this.maxLeanRight = const Value.absent(),
    this.routePath = const Value.absent(),
    this.rideName = const Value.absent(),
    this.notes = const Value.absent(),
    this.imageUrl = const Value.absent(),
    required DateTime createdAt,
    this.isSynced = const Value.absent(),
    required DateTime lastModified,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       bikeId = Value(bikeId),
       userId = Value(userId),
       startTime = Value(startTime),
       distanceKm = Value(distanceKm),
       createdAt = Value(createdAt),
       lastModified = Value(lastModified);
  static Insertable<Ride> custom({
    Expression<String>? id,
    Expression<String>? bikeId,
    Expression<String>? userId,
    Expression<DateTime>? startTime,
    Expression<DateTime>? endTime,
    Expression<double>? distanceKm,
    Expression<double>? maxLeanLeft,
    Expression<double>? maxLeanRight,
    Expression<String>? routePath,
    Expression<String>? rideName,
    Expression<String>? notes,
    Expression<String>? imageUrl,
    Expression<DateTime>? createdAt,
    Expression<bool>? isSynced,
    Expression<DateTime>? lastModified,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (bikeId != null) 'bike_id': bikeId,
      if (userId != null) 'user_id': userId,
      if (startTime != null) 'start_time': startTime,
      if (endTime != null) 'end_time': endTime,
      if (distanceKm != null) 'distance_km': distanceKm,
      if (maxLeanLeft != null) 'max_lean_left': maxLeanLeft,
      if (maxLeanRight != null) 'max_lean_right': maxLeanRight,
      if (routePath != null) 'route_path': routePath,
      if (rideName != null) 'ride_name': rideName,
      if (notes != null) 'notes': notes,
      if (imageUrl != null) 'image_url': imageUrl,
      if (createdAt != null) 'created_at': createdAt,
      if (isSynced != null) 'is_synced': isSynced,
      if (lastModified != null) 'last_modified': lastModified,
      if (rowid != null) 'rowid': rowid,
    });
  }

  RidesCompanion copyWith({
    Value<String>? id,
    Value<String>? bikeId,
    Value<String>? userId,
    Value<DateTime>? startTime,
    Value<DateTime?>? endTime,
    Value<double>? distanceKm,
    Value<double?>? maxLeanLeft,
    Value<double?>? maxLeanRight,
    Value<String?>? routePath,
    Value<String?>? rideName,
    Value<String?>? notes,
    Value<String?>? imageUrl,
    Value<DateTime>? createdAt,
    Value<bool>? isSynced,
    Value<DateTime>? lastModified,
    Value<int>? rowid,
  }) {
    return RidesCompanion(
      id: id ?? this.id,
      bikeId: bikeId ?? this.bikeId,
      userId: userId ?? this.userId,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      distanceKm: distanceKm ?? this.distanceKm,
      maxLeanLeft: maxLeanLeft ?? this.maxLeanLeft,
      maxLeanRight: maxLeanRight ?? this.maxLeanRight,
      routePath: routePath ?? this.routePath,
      rideName: rideName ?? this.rideName,
      notes: notes ?? this.notes,
      imageUrl: imageUrl ?? this.imageUrl,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
      lastModified: lastModified ?? this.lastModified,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (bikeId.present) {
      map['bike_id'] = Variable<String>(bikeId.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (startTime.present) {
      map['start_time'] = Variable<DateTime>(startTime.value);
    }
    if (endTime.present) {
      map['end_time'] = Variable<DateTime>(endTime.value);
    }
    if (distanceKm.present) {
      map['distance_km'] = Variable<double>(distanceKm.value);
    }
    if (maxLeanLeft.present) {
      map['max_lean_left'] = Variable<double>(maxLeanLeft.value);
    }
    if (maxLeanRight.present) {
      map['max_lean_right'] = Variable<double>(maxLeanRight.value);
    }
    if (routePath.present) {
      map['route_path'] = Variable<String>(routePath.value);
    }
    if (rideName.present) {
      map['ride_name'] = Variable<String>(rideName.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (imageUrl.present) {
      map['image_url'] = Variable<String>(imageUrl.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (lastModified.present) {
      map['last_modified'] = Variable<DateTime>(lastModified.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RidesCompanion(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('userId: $userId, ')
          ..write('startTime: $startTime, ')
          ..write('endTime: $endTime, ')
          ..write('distanceKm: $distanceKm, ')
          ..write('maxLeanLeft: $maxLeanLeft, ')
          ..write('maxLeanRight: $maxLeanRight, ')
          ..write('routePath: $routePath, ')
          ..write('rideName: $rideName, ')
          ..write('notes: $notes, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FuelLogsTable extends FuelLogs with TableInfo<$FuelLogsTable, FuelLog> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FuelLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bikeIdMeta = const VerificationMeta('bikeId');
  @override
  late final GeneratedColumn<String> bikeId = GeneratedColumn<String>(
    'bike_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _odometerMeta = const VerificationMeta(
    'odometer',
  );
  @override
  late final GeneratedColumn<double> odometer = GeneratedColumn<double>(
    'odometer',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _litresMeta = const VerificationMeta('litres');
  @override
  late final GeneratedColumn<double> litres = GeneratedColumn<double>(
    'litres',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _pricePerLitreMeta = const VerificationMeta(
    'pricePerLitre',
  );
  @override
  late final GeneratedColumn<double> pricePerLitre = GeneratedColumn<double>(
    'price_per_litre',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _totalCostMeta = const VerificationMeta(
    'totalCost',
  );
  @override
  late final GeneratedColumn<double> totalCost = GeneratedColumn<double>(
    'total_cost',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isFullTankMeta = const VerificationMeta(
    'isFullTank',
  );
  @override
  late final GeneratedColumn<bool> isFullTank = GeneratedColumn<bool>(
    'is_full_tank',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_full_tank" IN (0, 1))',
    ),
  );
  static const VerificationMeta _dateMeta = const VerificationMeta('date');
  @override
  late final GeneratedColumn<String> date = GeneratedColumn<String>(
    'date',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _lastModifiedMeta = const VerificationMeta(
    'lastModified',
  );
  @override
  late final GeneratedColumn<DateTime> lastModified = GeneratedColumn<DateTime>(
    'last_modified',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    bikeId,
    odometer,
    litres,
    pricePerLitre,
    totalCost,
    isFullTank,
    date,
    createdAt,
    isSynced,
    lastModified,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'fuel_logs';
  @override
  VerificationContext validateIntegrity(
    Insertable<FuelLog> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('bike_id')) {
      context.handle(
        _bikeIdMeta,
        bikeId.isAcceptableOrUnknown(data['bike_id']!, _bikeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bikeIdMeta);
    }
    if (data.containsKey('odometer')) {
      context.handle(
        _odometerMeta,
        odometer.isAcceptableOrUnknown(data['odometer']!, _odometerMeta),
      );
    } else if (isInserting) {
      context.missing(_odometerMeta);
    }
    if (data.containsKey('litres')) {
      context.handle(
        _litresMeta,
        litres.isAcceptableOrUnknown(data['litres']!, _litresMeta),
      );
    } else if (isInserting) {
      context.missing(_litresMeta);
    }
    if (data.containsKey('price_per_litre')) {
      context.handle(
        _pricePerLitreMeta,
        pricePerLitre.isAcceptableOrUnknown(
          data['price_per_litre']!,
          _pricePerLitreMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_pricePerLitreMeta);
    }
    if (data.containsKey('total_cost')) {
      context.handle(
        _totalCostMeta,
        totalCost.isAcceptableOrUnknown(data['total_cost']!, _totalCostMeta),
      );
    } else if (isInserting) {
      context.missing(_totalCostMeta);
    }
    if (data.containsKey('is_full_tank')) {
      context.handle(
        _isFullTankMeta,
        isFullTank.isAcceptableOrUnknown(
          data['is_full_tank']!,
          _isFullTankMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_isFullTankMeta);
    }
    if (data.containsKey('date')) {
      context.handle(
        _dateMeta,
        date.isAcceptableOrUnknown(data['date']!, _dateMeta),
      );
    } else if (isInserting) {
      context.missing(_dateMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('last_modified')) {
      context.handle(
        _lastModifiedMeta,
        lastModified.isAcceptableOrUnknown(
          data['last_modified']!,
          _lastModifiedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_lastModifiedMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FuelLog map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FuelLog(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      bikeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bike_id'],
      )!,
      odometer: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}odometer'],
      )!,
      litres: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}litres'],
      )!,
      pricePerLitre: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}price_per_litre'],
      )!,
      totalCost: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}total_cost'],
      )!,
      isFullTank: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_full_tank'],
      )!,
      date: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}date'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      lastModified: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_modified'],
      )!,
    );
  }

  @override
  $FuelLogsTable createAlias(String alias) {
    return $FuelLogsTable(attachedDatabase, alias);
  }
}

class FuelLog extends DataClass implements Insertable<FuelLog> {
  final String id;
  final String bikeId;
  final double odometer;
  final double litres;
  final double pricePerLitre;
  final double totalCost;
  final bool isFullTank;
  final String date;
  final DateTime createdAt;
  final bool isSynced;
  final DateTime lastModified;
  const FuelLog({
    required this.id,
    required this.bikeId,
    required this.odometer,
    required this.litres,
    required this.pricePerLitre,
    required this.totalCost,
    required this.isFullTank,
    required this.date,
    required this.createdAt,
    required this.isSynced,
    required this.lastModified,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['bike_id'] = Variable<String>(bikeId);
    map['odometer'] = Variable<double>(odometer);
    map['litres'] = Variable<double>(litres);
    map['price_per_litre'] = Variable<double>(pricePerLitre);
    map['total_cost'] = Variable<double>(totalCost);
    map['is_full_tank'] = Variable<bool>(isFullTank);
    map['date'] = Variable<String>(date);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['is_synced'] = Variable<bool>(isSynced);
    map['last_modified'] = Variable<DateTime>(lastModified);
    return map;
  }

  FuelLogsCompanion toCompanion(bool nullToAbsent) {
    return FuelLogsCompanion(
      id: Value(id),
      bikeId: Value(bikeId),
      odometer: Value(odometer),
      litres: Value(litres),
      pricePerLitre: Value(pricePerLitre),
      totalCost: Value(totalCost),
      isFullTank: Value(isFullTank),
      date: Value(date),
      createdAt: Value(createdAt),
      isSynced: Value(isSynced),
      lastModified: Value(lastModified),
    );
  }

  factory FuelLog.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FuelLog(
      id: serializer.fromJson<String>(json['id']),
      bikeId: serializer.fromJson<String>(json['bikeId']),
      odometer: serializer.fromJson<double>(json['odometer']),
      litres: serializer.fromJson<double>(json['litres']),
      pricePerLitre: serializer.fromJson<double>(json['pricePerLitre']),
      totalCost: serializer.fromJson<double>(json['totalCost']),
      isFullTank: serializer.fromJson<bool>(json['isFullTank']),
      date: serializer.fromJson<String>(json['date']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      lastModified: serializer.fromJson<DateTime>(json['lastModified']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'bikeId': serializer.toJson<String>(bikeId),
      'odometer': serializer.toJson<double>(odometer),
      'litres': serializer.toJson<double>(litres),
      'pricePerLitre': serializer.toJson<double>(pricePerLitre),
      'totalCost': serializer.toJson<double>(totalCost),
      'isFullTank': serializer.toJson<bool>(isFullTank),
      'date': serializer.toJson<String>(date),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'isSynced': serializer.toJson<bool>(isSynced),
      'lastModified': serializer.toJson<DateTime>(lastModified),
    };
  }

  FuelLog copyWith({
    String? id,
    String? bikeId,
    double? odometer,
    double? litres,
    double? pricePerLitre,
    double? totalCost,
    bool? isFullTank,
    String? date,
    DateTime? createdAt,
    bool? isSynced,
    DateTime? lastModified,
  }) => FuelLog(
    id: id ?? this.id,
    bikeId: bikeId ?? this.bikeId,
    odometer: odometer ?? this.odometer,
    litres: litres ?? this.litres,
    pricePerLitre: pricePerLitre ?? this.pricePerLitre,
    totalCost: totalCost ?? this.totalCost,
    isFullTank: isFullTank ?? this.isFullTank,
    date: date ?? this.date,
    createdAt: createdAt ?? this.createdAt,
    isSynced: isSynced ?? this.isSynced,
    lastModified: lastModified ?? this.lastModified,
  );
  FuelLog copyWithCompanion(FuelLogsCompanion data) {
    return FuelLog(
      id: data.id.present ? data.id.value : this.id,
      bikeId: data.bikeId.present ? data.bikeId.value : this.bikeId,
      odometer: data.odometer.present ? data.odometer.value : this.odometer,
      litres: data.litres.present ? data.litres.value : this.litres,
      pricePerLitre: data.pricePerLitre.present
          ? data.pricePerLitre.value
          : this.pricePerLitre,
      totalCost: data.totalCost.present ? data.totalCost.value : this.totalCost,
      isFullTank: data.isFullTank.present
          ? data.isFullTank.value
          : this.isFullTank,
      date: data.date.present ? data.date.value : this.date,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      lastModified: data.lastModified.present
          ? data.lastModified.value
          : this.lastModified,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FuelLog(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('odometer: $odometer, ')
          ..write('litres: $litres, ')
          ..write('pricePerLitre: $pricePerLitre, ')
          ..write('totalCost: $totalCost, ')
          ..write('isFullTank: $isFullTank, ')
          ..write('date: $date, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    bikeId,
    odometer,
    litres,
    pricePerLitre,
    totalCost,
    isFullTank,
    date,
    createdAt,
    isSynced,
    lastModified,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FuelLog &&
          other.id == this.id &&
          other.bikeId == this.bikeId &&
          other.odometer == this.odometer &&
          other.litres == this.litres &&
          other.pricePerLitre == this.pricePerLitre &&
          other.totalCost == this.totalCost &&
          other.isFullTank == this.isFullTank &&
          other.date == this.date &&
          other.createdAt == this.createdAt &&
          other.isSynced == this.isSynced &&
          other.lastModified == this.lastModified);
}

class FuelLogsCompanion extends UpdateCompanion<FuelLog> {
  final Value<String> id;
  final Value<String> bikeId;
  final Value<double> odometer;
  final Value<double> litres;
  final Value<double> pricePerLitre;
  final Value<double> totalCost;
  final Value<bool> isFullTank;
  final Value<String> date;
  final Value<DateTime> createdAt;
  final Value<bool> isSynced;
  final Value<DateTime> lastModified;
  final Value<int> rowid;
  const FuelLogsCompanion({
    this.id = const Value.absent(),
    this.bikeId = const Value.absent(),
    this.odometer = const Value.absent(),
    this.litres = const Value.absent(),
    this.pricePerLitre = const Value.absent(),
    this.totalCost = const Value.absent(),
    this.isFullTank = const Value.absent(),
    this.date = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.lastModified = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FuelLogsCompanion.insert({
    required String id,
    required String bikeId,
    required double odometer,
    required double litres,
    required double pricePerLitre,
    required double totalCost,
    required bool isFullTank,
    required String date,
    required DateTime createdAt,
    this.isSynced = const Value.absent(),
    required DateTime lastModified,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       bikeId = Value(bikeId),
       odometer = Value(odometer),
       litres = Value(litres),
       pricePerLitre = Value(pricePerLitre),
       totalCost = Value(totalCost),
       isFullTank = Value(isFullTank),
       date = Value(date),
       createdAt = Value(createdAt),
       lastModified = Value(lastModified);
  static Insertable<FuelLog> custom({
    Expression<String>? id,
    Expression<String>? bikeId,
    Expression<double>? odometer,
    Expression<double>? litres,
    Expression<double>? pricePerLitre,
    Expression<double>? totalCost,
    Expression<bool>? isFullTank,
    Expression<String>? date,
    Expression<DateTime>? createdAt,
    Expression<bool>? isSynced,
    Expression<DateTime>? lastModified,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (bikeId != null) 'bike_id': bikeId,
      if (odometer != null) 'odometer': odometer,
      if (litres != null) 'litres': litres,
      if (pricePerLitre != null) 'price_per_litre': pricePerLitre,
      if (totalCost != null) 'total_cost': totalCost,
      if (isFullTank != null) 'is_full_tank': isFullTank,
      if (date != null) 'date': date,
      if (createdAt != null) 'created_at': createdAt,
      if (isSynced != null) 'is_synced': isSynced,
      if (lastModified != null) 'last_modified': lastModified,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FuelLogsCompanion copyWith({
    Value<String>? id,
    Value<String>? bikeId,
    Value<double>? odometer,
    Value<double>? litres,
    Value<double>? pricePerLitre,
    Value<double>? totalCost,
    Value<bool>? isFullTank,
    Value<String>? date,
    Value<DateTime>? createdAt,
    Value<bool>? isSynced,
    Value<DateTime>? lastModified,
    Value<int>? rowid,
  }) {
    return FuelLogsCompanion(
      id: id ?? this.id,
      bikeId: bikeId ?? this.bikeId,
      odometer: odometer ?? this.odometer,
      litres: litres ?? this.litres,
      pricePerLitre: pricePerLitre ?? this.pricePerLitre,
      totalCost: totalCost ?? this.totalCost,
      isFullTank: isFullTank ?? this.isFullTank,
      date: date ?? this.date,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
      lastModified: lastModified ?? this.lastModified,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (bikeId.present) {
      map['bike_id'] = Variable<String>(bikeId.value);
    }
    if (odometer.present) {
      map['odometer'] = Variable<double>(odometer.value);
    }
    if (litres.present) {
      map['litres'] = Variable<double>(litres.value);
    }
    if (pricePerLitre.present) {
      map['price_per_litre'] = Variable<double>(pricePerLitre.value);
    }
    if (totalCost.present) {
      map['total_cost'] = Variable<double>(totalCost.value);
    }
    if (isFullTank.present) {
      map['is_full_tank'] = Variable<bool>(isFullTank.value);
    }
    if (date.present) {
      map['date'] = Variable<String>(date.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (lastModified.present) {
      map['last_modified'] = Variable<DateTime>(lastModified.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FuelLogsCompanion(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('odometer: $odometer, ')
          ..write('litres: $litres, ')
          ..write('pricePerLitre: $pricePerLitre, ')
          ..write('totalCost: $totalCost, ')
          ..write('isFullTank: $isFullTank, ')
          ..write('date: $date, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $MaintenanceLogsTable extends MaintenanceLogs
    with TableInfo<$MaintenanceLogsTable, MaintenanceLog> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MaintenanceLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bikeIdMeta = const VerificationMeta('bikeId');
  @override
  late final GeneratedColumn<String> bikeId = GeneratedColumn<String>(
    'bike_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serviceTypeMeta = const VerificationMeta(
    'serviceType',
  );
  @override
  late final GeneratedColumn<String> serviceType = GeneratedColumn<String>(
    'service_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _odoAtServiceMeta = const VerificationMeta(
    'odoAtService',
  );
  @override
  late final GeneratedColumn<double> odoAtService = GeneratedColumn<double>(
    'odo_at_service',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _datePerformedMeta = const VerificationMeta(
    'datePerformed',
  );
  @override
  late final GeneratedColumn<String> datePerformed = GeneratedColumn<String>(
    'date_performed',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _receiptUrlMeta = const VerificationMeta(
    'receiptUrl',
  );
  @override
  late final GeneratedColumn<String> receiptUrl = GeneratedColumn<String>(
    'receipt_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _lastModifiedMeta = const VerificationMeta(
    'lastModified',
  );
  @override
  late final GeneratedColumn<DateTime> lastModified = GeneratedColumn<DateTime>(
    'last_modified',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    bikeId,
    serviceType,
    odoAtService,
    datePerformed,
    notes,
    receiptUrl,
    createdAt,
    isSynced,
    lastModified,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'maintenance_logs';
  @override
  VerificationContext validateIntegrity(
    Insertable<MaintenanceLog> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('bike_id')) {
      context.handle(
        _bikeIdMeta,
        bikeId.isAcceptableOrUnknown(data['bike_id']!, _bikeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bikeIdMeta);
    }
    if (data.containsKey('service_type')) {
      context.handle(
        _serviceTypeMeta,
        serviceType.isAcceptableOrUnknown(
          data['service_type']!,
          _serviceTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_serviceTypeMeta);
    }
    if (data.containsKey('odo_at_service')) {
      context.handle(
        _odoAtServiceMeta,
        odoAtService.isAcceptableOrUnknown(
          data['odo_at_service']!,
          _odoAtServiceMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_odoAtServiceMeta);
    }
    if (data.containsKey('date_performed')) {
      context.handle(
        _datePerformedMeta,
        datePerformed.isAcceptableOrUnknown(
          data['date_performed']!,
          _datePerformedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_datePerformedMeta);
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('receipt_url')) {
      context.handle(
        _receiptUrlMeta,
        receiptUrl.isAcceptableOrUnknown(data['receipt_url']!, _receiptUrlMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('last_modified')) {
      context.handle(
        _lastModifiedMeta,
        lastModified.isAcceptableOrUnknown(
          data['last_modified']!,
          _lastModifiedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_lastModifiedMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  MaintenanceLog map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MaintenanceLog(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      bikeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bike_id'],
      )!,
      serviceType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}service_type'],
      )!,
      odoAtService: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}odo_at_service'],
      )!,
      datePerformed: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}date_performed'],
      )!,
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      receiptUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}receipt_url'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      lastModified: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_modified'],
      )!,
    );
  }

  @override
  $MaintenanceLogsTable createAlias(String alias) {
    return $MaintenanceLogsTable(attachedDatabase, alias);
  }
}

class MaintenanceLog extends DataClass implements Insertable<MaintenanceLog> {
  final String id;
  final String bikeId;
  final String serviceType;
  final double odoAtService;
  final String datePerformed;
  final String? notes;
  final String? receiptUrl;
  final DateTime createdAt;
  final bool isSynced;
  final DateTime lastModified;
  const MaintenanceLog({
    required this.id,
    required this.bikeId,
    required this.serviceType,
    required this.odoAtService,
    required this.datePerformed,
    this.notes,
    this.receiptUrl,
    required this.createdAt,
    required this.isSynced,
    required this.lastModified,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['bike_id'] = Variable<String>(bikeId);
    map['service_type'] = Variable<String>(serviceType);
    map['odo_at_service'] = Variable<double>(odoAtService);
    map['date_performed'] = Variable<String>(datePerformed);
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    if (!nullToAbsent || receiptUrl != null) {
      map['receipt_url'] = Variable<String>(receiptUrl);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['is_synced'] = Variable<bool>(isSynced);
    map['last_modified'] = Variable<DateTime>(lastModified);
    return map;
  }

  MaintenanceLogsCompanion toCompanion(bool nullToAbsent) {
    return MaintenanceLogsCompanion(
      id: Value(id),
      bikeId: Value(bikeId),
      serviceType: Value(serviceType),
      odoAtService: Value(odoAtService),
      datePerformed: Value(datePerformed),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      receiptUrl: receiptUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(receiptUrl),
      createdAt: Value(createdAt),
      isSynced: Value(isSynced),
      lastModified: Value(lastModified),
    );
  }

  factory MaintenanceLog.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MaintenanceLog(
      id: serializer.fromJson<String>(json['id']),
      bikeId: serializer.fromJson<String>(json['bikeId']),
      serviceType: serializer.fromJson<String>(json['serviceType']),
      odoAtService: serializer.fromJson<double>(json['odoAtService']),
      datePerformed: serializer.fromJson<String>(json['datePerformed']),
      notes: serializer.fromJson<String?>(json['notes']),
      receiptUrl: serializer.fromJson<String?>(json['receiptUrl']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      lastModified: serializer.fromJson<DateTime>(json['lastModified']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'bikeId': serializer.toJson<String>(bikeId),
      'serviceType': serializer.toJson<String>(serviceType),
      'odoAtService': serializer.toJson<double>(odoAtService),
      'datePerformed': serializer.toJson<String>(datePerformed),
      'notes': serializer.toJson<String?>(notes),
      'receiptUrl': serializer.toJson<String?>(receiptUrl),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'isSynced': serializer.toJson<bool>(isSynced),
      'lastModified': serializer.toJson<DateTime>(lastModified),
    };
  }

  MaintenanceLog copyWith({
    String? id,
    String? bikeId,
    String? serviceType,
    double? odoAtService,
    String? datePerformed,
    Value<String?> notes = const Value.absent(),
    Value<String?> receiptUrl = const Value.absent(),
    DateTime? createdAt,
    bool? isSynced,
    DateTime? lastModified,
  }) => MaintenanceLog(
    id: id ?? this.id,
    bikeId: bikeId ?? this.bikeId,
    serviceType: serviceType ?? this.serviceType,
    odoAtService: odoAtService ?? this.odoAtService,
    datePerformed: datePerformed ?? this.datePerformed,
    notes: notes.present ? notes.value : this.notes,
    receiptUrl: receiptUrl.present ? receiptUrl.value : this.receiptUrl,
    createdAt: createdAt ?? this.createdAt,
    isSynced: isSynced ?? this.isSynced,
    lastModified: lastModified ?? this.lastModified,
  );
  MaintenanceLog copyWithCompanion(MaintenanceLogsCompanion data) {
    return MaintenanceLog(
      id: data.id.present ? data.id.value : this.id,
      bikeId: data.bikeId.present ? data.bikeId.value : this.bikeId,
      serviceType: data.serviceType.present
          ? data.serviceType.value
          : this.serviceType,
      odoAtService: data.odoAtService.present
          ? data.odoAtService.value
          : this.odoAtService,
      datePerformed: data.datePerformed.present
          ? data.datePerformed.value
          : this.datePerformed,
      notes: data.notes.present ? data.notes.value : this.notes,
      receiptUrl: data.receiptUrl.present
          ? data.receiptUrl.value
          : this.receiptUrl,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      lastModified: data.lastModified.present
          ? data.lastModified.value
          : this.lastModified,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MaintenanceLog(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('serviceType: $serviceType, ')
          ..write('odoAtService: $odoAtService, ')
          ..write('datePerformed: $datePerformed, ')
          ..write('notes: $notes, ')
          ..write('receiptUrl: $receiptUrl, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    bikeId,
    serviceType,
    odoAtService,
    datePerformed,
    notes,
    receiptUrl,
    createdAt,
    isSynced,
    lastModified,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MaintenanceLog &&
          other.id == this.id &&
          other.bikeId == this.bikeId &&
          other.serviceType == this.serviceType &&
          other.odoAtService == this.odoAtService &&
          other.datePerformed == this.datePerformed &&
          other.notes == this.notes &&
          other.receiptUrl == this.receiptUrl &&
          other.createdAt == this.createdAt &&
          other.isSynced == this.isSynced &&
          other.lastModified == this.lastModified);
}

class MaintenanceLogsCompanion extends UpdateCompanion<MaintenanceLog> {
  final Value<String> id;
  final Value<String> bikeId;
  final Value<String> serviceType;
  final Value<double> odoAtService;
  final Value<String> datePerformed;
  final Value<String?> notes;
  final Value<String?> receiptUrl;
  final Value<DateTime> createdAt;
  final Value<bool> isSynced;
  final Value<DateTime> lastModified;
  final Value<int> rowid;
  const MaintenanceLogsCompanion({
    this.id = const Value.absent(),
    this.bikeId = const Value.absent(),
    this.serviceType = const Value.absent(),
    this.odoAtService = const Value.absent(),
    this.datePerformed = const Value.absent(),
    this.notes = const Value.absent(),
    this.receiptUrl = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.lastModified = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  MaintenanceLogsCompanion.insert({
    required String id,
    required String bikeId,
    required String serviceType,
    required double odoAtService,
    required String datePerformed,
    this.notes = const Value.absent(),
    this.receiptUrl = const Value.absent(),
    required DateTime createdAt,
    this.isSynced = const Value.absent(),
    required DateTime lastModified,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       bikeId = Value(bikeId),
       serviceType = Value(serviceType),
       odoAtService = Value(odoAtService),
       datePerformed = Value(datePerformed),
       createdAt = Value(createdAt),
       lastModified = Value(lastModified);
  static Insertable<MaintenanceLog> custom({
    Expression<String>? id,
    Expression<String>? bikeId,
    Expression<String>? serviceType,
    Expression<double>? odoAtService,
    Expression<String>? datePerformed,
    Expression<String>? notes,
    Expression<String>? receiptUrl,
    Expression<DateTime>? createdAt,
    Expression<bool>? isSynced,
    Expression<DateTime>? lastModified,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (bikeId != null) 'bike_id': bikeId,
      if (serviceType != null) 'service_type': serviceType,
      if (odoAtService != null) 'odo_at_service': odoAtService,
      if (datePerformed != null) 'date_performed': datePerformed,
      if (notes != null) 'notes': notes,
      if (receiptUrl != null) 'receipt_url': receiptUrl,
      if (createdAt != null) 'created_at': createdAt,
      if (isSynced != null) 'is_synced': isSynced,
      if (lastModified != null) 'last_modified': lastModified,
      if (rowid != null) 'rowid': rowid,
    });
  }

  MaintenanceLogsCompanion copyWith({
    Value<String>? id,
    Value<String>? bikeId,
    Value<String>? serviceType,
    Value<double>? odoAtService,
    Value<String>? datePerformed,
    Value<String?>? notes,
    Value<String?>? receiptUrl,
    Value<DateTime>? createdAt,
    Value<bool>? isSynced,
    Value<DateTime>? lastModified,
    Value<int>? rowid,
  }) {
    return MaintenanceLogsCompanion(
      id: id ?? this.id,
      bikeId: bikeId ?? this.bikeId,
      serviceType: serviceType ?? this.serviceType,
      odoAtService: odoAtService ?? this.odoAtService,
      datePerformed: datePerformed ?? this.datePerformed,
      notes: notes ?? this.notes,
      receiptUrl: receiptUrl ?? this.receiptUrl,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
      lastModified: lastModified ?? this.lastModified,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (bikeId.present) {
      map['bike_id'] = Variable<String>(bikeId.value);
    }
    if (serviceType.present) {
      map['service_type'] = Variable<String>(serviceType.value);
    }
    if (odoAtService.present) {
      map['odo_at_service'] = Variable<double>(odoAtService.value);
    }
    if (datePerformed.present) {
      map['date_performed'] = Variable<String>(datePerformed.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (receiptUrl.present) {
      map['receipt_url'] = Variable<String>(receiptUrl.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (lastModified.present) {
      map['last_modified'] = Variable<DateTime>(lastModified.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MaintenanceLogsCompanion(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('serviceType: $serviceType, ')
          ..write('odoAtService: $odoAtService, ')
          ..write('datePerformed: $datePerformed, ')
          ..write('notes: $notes, ')
          ..write('receiptUrl: $receiptUrl, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $MaintenanceSchedulesTable extends MaintenanceSchedules
    with TableInfo<$MaintenanceSchedulesTable, MaintenanceSchedule> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MaintenanceSchedulesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bikeIdMeta = const VerificationMeta('bikeId');
  @override
  late final GeneratedColumn<String> bikeId = GeneratedColumn<String>(
    'bike_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _partNameMeta = const VerificationMeta(
    'partName',
  );
  @override
  late final GeneratedColumn<String> partName = GeneratedColumn<String>(
    'part_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _intervalKmMeta = const VerificationMeta(
    'intervalKm',
  );
  @override
  late final GeneratedColumn<int> intervalKm = GeneratedColumn<int>(
    'interval_km',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _intervalMonthsMeta = const VerificationMeta(
    'intervalMonths',
  );
  @override
  late final GeneratedColumn<int> intervalMonths = GeneratedColumn<int>(
    'interval_months',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lastServiceDateMeta = const VerificationMeta(
    'lastServiceDate',
  );
  @override
  late final GeneratedColumn<String> lastServiceDate = GeneratedColumn<String>(
    'last_service_date',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastServiceOdoMeta = const VerificationMeta(
    'lastServiceOdo',
  );
  @override
  late final GeneratedColumn<double> lastServiceOdo = GeneratedColumn<double>(
    'last_service_odo',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isActiveMeta = const VerificationMeta(
    'isActive',
  );
  @override
  late final GeneratedColumn<bool> isActive = GeneratedColumn<bool>(
    'is_active',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_active" IN (0, 1))',
    ),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _lastModifiedMeta = const VerificationMeta(
    'lastModified',
  );
  @override
  late final GeneratedColumn<DateTime> lastModified = GeneratedColumn<DateTime>(
    'last_modified',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    bikeId,
    partName,
    intervalKm,
    intervalMonths,
    lastServiceDate,
    lastServiceOdo,
    isActive,
    createdAt,
    isSynced,
    lastModified,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'maintenance_schedules';
  @override
  VerificationContext validateIntegrity(
    Insertable<MaintenanceSchedule> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('bike_id')) {
      context.handle(
        _bikeIdMeta,
        bikeId.isAcceptableOrUnknown(data['bike_id']!, _bikeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bikeIdMeta);
    }
    if (data.containsKey('part_name')) {
      context.handle(
        _partNameMeta,
        partName.isAcceptableOrUnknown(data['part_name']!, _partNameMeta),
      );
    } else if (isInserting) {
      context.missing(_partNameMeta);
    }
    if (data.containsKey('interval_km')) {
      context.handle(
        _intervalKmMeta,
        intervalKm.isAcceptableOrUnknown(data['interval_km']!, _intervalKmMeta),
      );
    } else if (isInserting) {
      context.missing(_intervalKmMeta);
    }
    if (data.containsKey('interval_months')) {
      context.handle(
        _intervalMonthsMeta,
        intervalMonths.isAcceptableOrUnknown(
          data['interval_months']!,
          _intervalMonthsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_intervalMonthsMeta);
    }
    if (data.containsKey('last_service_date')) {
      context.handle(
        _lastServiceDateMeta,
        lastServiceDate.isAcceptableOrUnknown(
          data['last_service_date']!,
          _lastServiceDateMeta,
        ),
      );
    }
    if (data.containsKey('last_service_odo')) {
      context.handle(
        _lastServiceOdoMeta,
        lastServiceOdo.isAcceptableOrUnknown(
          data['last_service_odo']!,
          _lastServiceOdoMeta,
        ),
      );
    }
    if (data.containsKey('is_active')) {
      context.handle(
        _isActiveMeta,
        isActive.isAcceptableOrUnknown(data['is_active']!, _isActiveMeta),
      );
    } else if (isInserting) {
      context.missing(_isActiveMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('last_modified')) {
      context.handle(
        _lastModifiedMeta,
        lastModified.isAcceptableOrUnknown(
          data['last_modified']!,
          _lastModifiedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_lastModifiedMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  MaintenanceSchedule map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MaintenanceSchedule(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      bikeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bike_id'],
      )!,
      partName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}part_name'],
      )!,
      intervalKm: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}interval_km'],
      )!,
      intervalMonths: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}interval_months'],
      )!,
      lastServiceDate: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_service_date'],
      ),
      lastServiceOdo: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}last_service_odo'],
      ),
      isActive: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_active'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      lastModified: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_modified'],
      )!,
    );
  }

  @override
  $MaintenanceSchedulesTable createAlias(String alias) {
    return $MaintenanceSchedulesTable(attachedDatabase, alias);
  }
}

class MaintenanceSchedule extends DataClass
    implements Insertable<MaintenanceSchedule> {
  final String id;
  final String bikeId;
  final String partName;
  final int intervalKm;
  final int intervalMonths;
  final String? lastServiceDate;
  final double? lastServiceOdo;
  final bool isActive;
  final DateTime createdAt;
  final bool isSynced;
  final DateTime lastModified;
  const MaintenanceSchedule({
    required this.id,
    required this.bikeId,
    required this.partName,
    required this.intervalKm,
    required this.intervalMonths,
    this.lastServiceDate,
    this.lastServiceOdo,
    required this.isActive,
    required this.createdAt,
    required this.isSynced,
    required this.lastModified,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['bike_id'] = Variable<String>(bikeId);
    map['part_name'] = Variable<String>(partName);
    map['interval_km'] = Variable<int>(intervalKm);
    map['interval_months'] = Variable<int>(intervalMonths);
    if (!nullToAbsent || lastServiceDate != null) {
      map['last_service_date'] = Variable<String>(lastServiceDate);
    }
    if (!nullToAbsent || lastServiceOdo != null) {
      map['last_service_odo'] = Variable<double>(lastServiceOdo);
    }
    map['is_active'] = Variable<bool>(isActive);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['is_synced'] = Variable<bool>(isSynced);
    map['last_modified'] = Variable<DateTime>(lastModified);
    return map;
  }

  MaintenanceSchedulesCompanion toCompanion(bool nullToAbsent) {
    return MaintenanceSchedulesCompanion(
      id: Value(id),
      bikeId: Value(bikeId),
      partName: Value(partName),
      intervalKm: Value(intervalKm),
      intervalMonths: Value(intervalMonths),
      lastServiceDate: lastServiceDate == null && nullToAbsent
          ? const Value.absent()
          : Value(lastServiceDate),
      lastServiceOdo: lastServiceOdo == null && nullToAbsent
          ? const Value.absent()
          : Value(lastServiceOdo),
      isActive: Value(isActive),
      createdAt: Value(createdAt),
      isSynced: Value(isSynced),
      lastModified: Value(lastModified),
    );
  }

  factory MaintenanceSchedule.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MaintenanceSchedule(
      id: serializer.fromJson<String>(json['id']),
      bikeId: serializer.fromJson<String>(json['bikeId']),
      partName: serializer.fromJson<String>(json['partName']),
      intervalKm: serializer.fromJson<int>(json['intervalKm']),
      intervalMonths: serializer.fromJson<int>(json['intervalMonths']),
      lastServiceDate: serializer.fromJson<String?>(json['lastServiceDate']),
      lastServiceOdo: serializer.fromJson<double?>(json['lastServiceOdo']),
      isActive: serializer.fromJson<bool>(json['isActive']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      lastModified: serializer.fromJson<DateTime>(json['lastModified']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'bikeId': serializer.toJson<String>(bikeId),
      'partName': serializer.toJson<String>(partName),
      'intervalKm': serializer.toJson<int>(intervalKm),
      'intervalMonths': serializer.toJson<int>(intervalMonths),
      'lastServiceDate': serializer.toJson<String?>(lastServiceDate),
      'lastServiceOdo': serializer.toJson<double?>(lastServiceOdo),
      'isActive': serializer.toJson<bool>(isActive),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'isSynced': serializer.toJson<bool>(isSynced),
      'lastModified': serializer.toJson<DateTime>(lastModified),
    };
  }

  MaintenanceSchedule copyWith({
    String? id,
    String? bikeId,
    String? partName,
    int? intervalKm,
    int? intervalMonths,
    Value<String?> lastServiceDate = const Value.absent(),
    Value<double?> lastServiceOdo = const Value.absent(),
    bool? isActive,
    DateTime? createdAt,
    bool? isSynced,
    DateTime? lastModified,
  }) => MaintenanceSchedule(
    id: id ?? this.id,
    bikeId: bikeId ?? this.bikeId,
    partName: partName ?? this.partName,
    intervalKm: intervalKm ?? this.intervalKm,
    intervalMonths: intervalMonths ?? this.intervalMonths,
    lastServiceDate: lastServiceDate.present
        ? lastServiceDate.value
        : this.lastServiceDate,
    lastServiceOdo: lastServiceOdo.present
        ? lastServiceOdo.value
        : this.lastServiceOdo,
    isActive: isActive ?? this.isActive,
    createdAt: createdAt ?? this.createdAt,
    isSynced: isSynced ?? this.isSynced,
    lastModified: lastModified ?? this.lastModified,
  );
  MaintenanceSchedule copyWithCompanion(MaintenanceSchedulesCompanion data) {
    return MaintenanceSchedule(
      id: data.id.present ? data.id.value : this.id,
      bikeId: data.bikeId.present ? data.bikeId.value : this.bikeId,
      partName: data.partName.present ? data.partName.value : this.partName,
      intervalKm: data.intervalKm.present
          ? data.intervalKm.value
          : this.intervalKm,
      intervalMonths: data.intervalMonths.present
          ? data.intervalMonths.value
          : this.intervalMonths,
      lastServiceDate: data.lastServiceDate.present
          ? data.lastServiceDate.value
          : this.lastServiceDate,
      lastServiceOdo: data.lastServiceOdo.present
          ? data.lastServiceOdo.value
          : this.lastServiceOdo,
      isActive: data.isActive.present ? data.isActive.value : this.isActive,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      lastModified: data.lastModified.present
          ? data.lastModified.value
          : this.lastModified,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MaintenanceSchedule(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('partName: $partName, ')
          ..write('intervalKm: $intervalKm, ')
          ..write('intervalMonths: $intervalMonths, ')
          ..write('lastServiceDate: $lastServiceDate, ')
          ..write('lastServiceOdo: $lastServiceOdo, ')
          ..write('isActive: $isActive, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    bikeId,
    partName,
    intervalKm,
    intervalMonths,
    lastServiceDate,
    lastServiceOdo,
    isActive,
    createdAt,
    isSynced,
    lastModified,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MaintenanceSchedule &&
          other.id == this.id &&
          other.bikeId == this.bikeId &&
          other.partName == this.partName &&
          other.intervalKm == this.intervalKm &&
          other.intervalMonths == this.intervalMonths &&
          other.lastServiceDate == this.lastServiceDate &&
          other.lastServiceOdo == this.lastServiceOdo &&
          other.isActive == this.isActive &&
          other.createdAt == this.createdAt &&
          other.isSynced == this.isSynced &&
          other.lastModified == this.lastModified);
}

class MaintenanceSchedulesCompanion
    extends UpdateCompanion<MaintenanceSchedule> {
  final Value<String> id;
  final Value<String> bikeId;
  final Value<String> partName;
  final Value<int> intervalKm;
  final Value<int> intervalMonths;
  final Value<String?> lastServiceDate;
  final Value<double?> lastServiceOdo;
  final Value<bool> isActive;
  final Value<DateTime> createdAt;
  final Value<bool> isSynced;
  final Value<DateTime> lastModified;
  final Value<int> rowid;
  const MaintenanceSchedulesCompanion({
    this.id = const Value.absent(),
    this.bikeId = const Value.absent(),
    this.partName = const Value.absent(),
    this.intervalKm = const Value.absent(),
    this.intervalMonths = const Value.absent(),
    this.lastServiceDate = const Value.absent(),
    this.lastServiceOdo = const Value.absent(),
    this.isActive = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.lastModified = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  MaintenanceSchedulesCompanion.insert({
    required String id,
    required String bikeId,
    required String partName,
    required int intervalKm,
    required int intervalMonths,
    this.lastServiceDate = const Value.absent(),
    this.lastServiceOdo = const Value.absent(),
    required bool isActive,
    required DateTime createdAt,
    this.isSynced = const Value.absent(),
    required DateTime lastModified,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       bikeId = Value(bikeId),
       partName = Value(partName),
       intervalKm = Value(intervalKm),
       intervalMonths = Value(intervalMonths),
       isActive = Value(isActive),
       createdAt = Value(createdAt),
       lastModified = Value(lastModified);
  static Insertable<MaintenanceSchedule> custom({
    Expression<String>? id,
    Expression<String>? bikeId,
    Expression<String>? partName,
    Expression<int>? intervalKm,
    Expression<int>? intervalMonths,
    Expression<String>? lastServiceDate,
    Expression<double>? lastServiceOdo,
    Expression<bool>? isActive,
    Expression<DateTime>? createdAt,
    Expression<bool>? isSynced,
    Expression<DateTime>? lastModified,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (bikeId != null) 'bike_id': bikeId,
      if (partName != null) 'part_name': partName,
      if (intervalKm != null) 'interval_km': intervalKm,
      if (intervalMonths != null) 'interval_months': intervalMonths,
      if (lastServiceDate != null) 'last_service_date': lastServiceDate,
      if (lastServiceOdo != null) 'last_service_odo': lastServiceOdo,
      if (isActive != null) 'is_active': isActive,
      if (createdAt != null) 'created_at': createdAt,
      if (isSynced != null) 'is_synced': isSynced,
      if (lastModified != null) 'last_modified': lastModified,
      if (rowid != null) 'rowid': rowid,
    });
  }

  MaintenanceSchedulesCompanion copyWith({
    Value<String>? id,
    Value<String>? bikeId,
    Value<String>? partName,
    Value<int>? intervalKm,
    Value<int>? intervalMonths,
    Value<String?>? lastServiceDate,
    Value<double?>? lastServiceOdo,
    Value<bool>? isActive,
    Value<DateTime>? createdAt,
    Value<bool>? isSynced,
    Value<DateTime>? lastModified,
    Value<int>? rowid,
  }) {
    return MaintenanceSchedulesCompanion(
      id: id ?? this.id,
      bikeId: bikeId ?? this.bikeId,
      partName: partName ?? this.partName,
      intervalKm: intervalKm ?? this.intervalKm,
      intervalMonths: intervalMonths ?? this.intervalMonths,
      lastServiceDate: lastServiceDate ?? this.lastServiceDate,
      lastServiceOdo: lastServiceOdo ?? this.lastServiceOdo,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
      lastModified: lastModified ?? this.lastModified,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (bikeId.present) {
      map['bike_id'] = Variable<String>(bikeId.value);
    }
    if (partName.present) {
      map['part_name'] = Variable<String>(partName.value);
    }
    if (intervalKm.present) {
      map['interval_km'] = Variable<int>(intervalKm.value);
    }
    if (intervalMonths.present) {
      map['interval_months'] = Variable<int>(intervalMonths.value);
    }
    if (lastServiceDate.present) {
      map['last_service_date'] = Variable<String>(lastServiceDate.value);
    }
    if (lastServiceOdo.present) {
      map['last_service_odo'] = Variable<double>(lastServiceOdo.value);
    }
    if (isActive.present) {
      map['is_active'] = Variable<bool>(isActive.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (lastModified.present) {
      map['last_modified'] = Variable<DateTime>(lastModified.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MaintenanceSchedulesCompanion(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('partName: $partName, ')
          ..write('intervalKm: $intervalKm, ')
          ..write('intervalMonths: $intervalMonths, ')
          ..write('lastServiceDate: $lastServiceDate, ')
          ..write('lastServiceOdo: $lastServiceOdo, ')
          ..write('isActive: $isActive, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ServiceHistoryTable extends ServiceHistory
    with TableInfo<$ServiceHistoryTable, ServiceHistoryData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ServiceHistoryTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bikeIdMeta = const VerificationMeta('bikeId');
  @override
  late final GeneratedColumn<String> bikeId = GeneratedColumn<String>(
    'bike_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _scheduleIdMeta = const VerificationMeta(
    'scheduleId',
  );
  @override
  late final GeneratedColumn<String> scheduleId = GeneratedColumn<String>(
    'schedule_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serviceDateMeta = const VerificationMeta(
    'serviceDate',
  );
  @override
  late final GeneratedColumn<String> serviceDate = GeneratedColumn<String>(
    'service_date',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serviceOdoMeta = const VerificationMeta(
    'serviceOdo',
  );
  @override
  late final GeneratedColumn<double> serviceOdo = GeneratedColumn<double>(
    'service_odo',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _costMeta = const VerificationMeta('cost');
  @override
  late final GeneratedColumn<double> cost = GeneratedColumn<double>(
    'cost',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _lastModifiedMeta = const VerificationMeta(
    'lastModified',
  );
  @override
  late final GeneratedColumn<DateTime> lastModified = GeneratedColumn<DateTime>(
    'last_modified',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    bikeId,
    scheduleId,
    serviceDate,
    serviceOdo,
    cost,
    notes,
    createdAt,
    isSynced,
    lastModified,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'service_history';
  @override
  VerificationContext validateIntegrity(
    Insertable<ServiceHistoryData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('bike_id')) {
      context.handle(
        _bikeIdMeta,
        bikeId.isAcceptableOrUnknown(data['bike_id']!, _bikeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bikeIdMeta);
    }
    if (data.containsKey('schedule_id')) {
      context.handle(
        _scheduleIdMeta,
        scheduleId.isAcceptableOrUnknown(data['schedule_id']!, _scheduleIdMeta),
      );
    } else if (isInserting) {
      context.missing(_scheduleIdMeta);
    }
    if (data.containsKey('service_date')) {
      context.handle(
        _serviceDateMeta,
        serviceDate.isAcceptableOrUnknown(
          data['service_date']!,
          _serviceDateMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_serviceDateMeta);
    }
    if (data.containsKey('service_odo')) {
      context.handle(
        _serviceOdoMeta,
        serviceOdo.isAcceptableOrUnknown(data['service_odo']!, _serviceOdoMeta),
      );
    } else if (isInserting) {
      context.missing(_serviceOdoMeta);
    }
    if (data.containsKey('cost')) {
      context.handle(
        _costMeta,
        cost.isAcceptableOrUnknown(data['cost']!, _costMeta),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('last_modified')) {
      context.handle(
        _lastModifiedMeta,
        lastModified.isAcceptableOrUnknown(
          data['last_modified']!,
          _lastModifiedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_lastModifiedMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ServiceHistoryData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ServiceHistoryData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      bikeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bike_id'],
      )!,
      scheduleId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}schedule_id'],
      )!,
      serviceDate: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}service_date'],
      )!,
      serviceOdo: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}service_odo'],
      )!,
      cost: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}cost'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      lastModified: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_modified'],
      )!,
    );
  }

  @override
  $ServiceHistoryTable createAlias(String alias) {
    return $ServiceHistoryTable(attachedDatabase, alias);
  }
}

class ServiceHistoryData extends DataClass
    implements Insertable<ServiceHistoryData> {
  final String id;
  final String bikeId;
  final String scheduleId;
  final String serviceDate;
  final double serviceOdo;
  final double? cost;
  final String? notes;
  final DateTime createdAt;
  final bool isSynced;
  final DateTime lastModified;
  const ServiceHistoryData({
    required this.id,
    required this.bikeId,
    required this.scheduleId,
    required this.serviceDate,
    required this.serviceOdo,
    this.cost,
    this.notes,
    required this.createdAt,
    required this.isSynced,
    required this.lastModified,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['bike_id'] = Variable<String>(bikeId);
    map['schedule_id'] = Variable<String>(scheduleId);
    map['service_date'] = Variable<String>(serviceDate);
    map['service_odo'] = Variable<double>(serviceOdo);
    if (!nullToAbsent || cost != null) {
      map['cost'] = Variable<double>(cost);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['is_synced'] = Variable<bool>(isSynced);
    map['last_modified'] = Variable<DateTime>(lastModified);
    return map;
  }

  ServiceHistoryCompanion toCompanion(bool nullToAbsent) {
    return ServiceHistoryCompanion(
      id: Value(id),
      bikeId: Value(bikeId),
      scheduleId: Value(scheduleId),
      serviceDate: Value(serviceDate),
      serviceOdo: Value(serviceOdo),
      cost: cost == null && nullToAbsent ? const Value.absent() : Value(cost),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      createdAt: Value(createdAt),
      isSynced: Value(isSynced),
      lastModified: Value(lastModified),
    );
  }

  factory ServiceHistoryData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ServiceHistoryData(
      id: serializer.fromJson<String>(json['id']),
      bikeId: serializer.fromJson<String>(json['bikeId']),
      scheduleId: serializer.fromJson<String>(json['scheduleId']),
      serviceDate: serializer.fromJson<String>(json['serviceDate']),
      serviceOdo: serializer.fromJson<double>(json['serviceOdo']),
      cost: serializer.fromJson<double?>(json['cost']),
      notes: serializer.fromJson<String?>(json['notes']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      lastModified: serializer.fromJson<DateTime>(json['lastModified']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'bikeId': serializer.toJson<String>(bikeId),
      'scheduleId': serializer.toJson<String>(scheduleId),
      'serviceDate': serializer.toJson<String>(serviceDate),
      'serviceOdo': serializer.toJson<double>(serviceOdo),
      'cost': serializer.toJson<double?>(cost),
      'notes': serializer.toJson<String?>(notes),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'isSynced': serializer.toJson<bool>(isSynced),
      'lastModified': serializer.toJson<DateTime>(lastModified),
    };
  }

  ServiceHistoryData copyWith({
    String? id,
    String? bikeId,
    String? scheduleId,
    String? serviceDate,
    double? serviceOdo,
    Value<double?> cost = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    DateTime? createdAt,
    bool? isSynced,
    DateTime? lastModified,
  }) => ServiceHistoryData(
    id: id ?? this.id,
    bikeId: bikeId ?? this.bikeId,
    scheduleId: scheduleId ?? this.scheduleId,
    serviceDate: serviceDate ?? this.serviceDate,
    serviceOdo: serviceOdo ?? this.serviceOdo,
    cost: cost.present ? cost.value : this.cost,
    notes: notes.present ? notes.value : this.notes,
    createdAt: createdAt ?? this.createdAt,
    isSynced: isSynced ?? this.isSynced,
    lastModified: lastModified ?? this.lastModified,
  );
  ServiceHistoryData copyWithCompanion(ServiceHistoryCompanion data) {
    return ServiceHistoryData(
      id: data.id.present ? data.id.value : this.id,
      bikeId: data.bikeId.present ? data.bikeId.value : this.bikeId,
      scheduleId: data.scheduleId.present
          ? data.scheduleId.value
          : this.scheduleId,
      serviceDate: data.serviceDate.present
          ? data.serviceDate.value
          : this.serviceDate,
      serviceOdo: data.serviceOdo.present
          ? data.serviceOdo.value
          : this.serviceOdo,
      cost: data.cost.present ? data.cost.value : this.cost,
      notes: data.notes.present ? data.notes.value : this.notes,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      lastModified: data.lastModified.present
          ? data.lastModified.value
          : this.lastModified,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ServiceHistoryData(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('scheduleId: $scheduleId, ')
          ..write('serviceDate: $serviceDate, ')
          ..write('serviceOdo: $serviceOdo, ')
          ..write('cost: $cost, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    bikeId,
    scheduleId,
    serviceDate,
    serviceOdo,
    cost,
    notes,
    createdAt,
    isSynced,
    lastModified,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ServiceHistoryData &&
          other.id == this.id &&
          other.bikeId == this.bikeId &&
          other.scheduleId == this.scheduleId &&
          other.serviceDate == this.serviceDate &&
          other.serviceOdo == this.serviceOdo &&
          other.cost == this.cost &&
          other.notes == this.notes &&
          other.createdAt == this.createdAt &&
          other.isSynced == this.isSynced &&
          other.lastModified == this.lastModified);
}

class ServiceHistoryCompanion extends UpdateCompanion<ServiceHistoryData> {
  final Value<String> id;
  final Value<String> bikeId;
  final Value<String> scheduleId;
  final Value<String> serviceDate;
  final Value<double> serviceOdo;
  final Value<double?> cost;
  final Value<String?> notes;
  final Value<DateTime> createdAt;
  final Value<bool> isSynced;
  final Value<DateTime> lastModified;
  final Value<int> rowid;
  const ServiceHistoryCompanion({
    this.id = const Value.absent(),
    this.bikeId = const Value.absent(),
    this.scheduleId = const Value.absent(),
    this.serviceDate = const Value.absent(),
    this.serviceOdo = const Value.absent(),
    this.cost = const Value.absent(),
    this.notes = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.lastModified = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ServiceHistoryCompanion.insert({
    required String id,
    required String bikeId,
    required String scheduleId,
    required String serviceDate,
    required double serviceOdo,
    this.cost = const Value.absent(),
    this.notes = const Value.absent(),
    required DateTime createdAt,
    this.isSynced = const Value.absent(),
    required DateTime lastModified,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       bikeId = Value(bikeId),
       scheduleId = Value(scheduleId),
       serviceDate = Value(serviceDate),
       serviceOdo = Value(serviceOdo),
       createdAt = Value(createdAt),
       lastModified = Value(lastModified);
  static Insertable<ServiceHistoryData> custom({
    Expression<String>? id,
    Expression<String>? bikeId,
    Expression<String>? scheduleId,
    Expression<String>? serviceDate,
    Expression<double>? serviceOdo,
    Expression<double>? cost,
    Expression<String>? notes,
    Expression<DateTime>? createdAt,
    Expression<bool>? isSynced,
    Expression<DateTime>? lastModified,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (bikeId != null) 'bike_id': bikeId,
      if (scheduleId != null) 'schedule_id': scheduleId,
      if (serviceDate != null) 'service_date': serviceDate,
      if (serviceOdo != null) 'service_odo': serviceOdo,
      if (cost != null) 'cost': cost,
      if (notes != null) 'notes': notes,
      if (createdAt != null) 'created_at': createdAt,
      if (isSynced != null) 'is_synced': isSynced,
      if (lastModified != null) 'last_modified': lastModified,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ServiceHistoryCompanion copyWith({
    Value<String>? id,
    Value<String>? bikeId,
    Value<String>? scheduleId,
    Value<String>? serviceDate,
    Value<double>? serviceOdo,
    Value<double?>? cost,
    Value<String?>? notes,
    Value<DateTime>? createdAt,
    Value<bool>? isSynced,
    Value<DateTime>? lastModified,
    Value<int>? rowid,
  }) {
    return ServiceHistoryCompanion(
      id: id ?? this.id,
      bikeId: bikeId ?? this.bikeId,
      scheduleId: scheduleId ?? this.scheduleId,
      serviceDate: serviceDate ?? this.serviceDate,
      serviceOdo: serviceOdo ?? this.serviceOdo,
      cost: cost ?? this.cost,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
      lastModified: lastModified ?? this.lastModified,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (bikeId.present) {
      map['bike_id'] = Variable<String>(bikeId.value);
    }
    if (scheduleId.present) {
      map['schedule_id'] = Variable<String>(scheduleId.value);
    }
    if (serviceDate.present) {
      map['service_date'] = Variable<String>(serviceDate.value);
    }
    if (serviceOdo.present) {
      map['service_odo'] = Variable<double>(serviceOdo.value);
    }
    if (cost.present) {
      map['cost'] = Variable<double>(cost.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (lastModified.present) {
      map['last_modified'] = Variable<DateTime>(lastModified.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ServiceHistoryCompanion(')
          ..write('id: $id, ')
          ..write('bikeId: $bikeId, ')
          ..write('scheduleId: $scheduleId, ')
          ..write('serviceDate: $serviceDate, ')
          ..write('serviceOdo: $serviceOdo, ')
          ..write('cost: $cost, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $NotificationsTable extends Notifications
    with TableInfo<$NotificationsTable, Notification> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $NotificationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _messageMeta = const VerificationMeta(
    'message',
  );
  @override
  late final GeneratedColumn<String> message = GeneratedColumn<String>(
    'message',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _readAtMeta = const VerificationMeta('readAt');
  @override
  late final GeneratedColumn<DateTime> readAt = GeneratedColumn<DateTime>(
    'read_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dismissedAtMeta = const VerificationMeta(
    'dismissedAt',
  );
  @override
  late final GeneratedColumn<DateTime> dismissedAt = GeneratedColumn<DateTime>(
    'dismissed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bikeIdMeta = const VerificationMeta('bikeId');
  @override
  late final GeneratedColumn<String> bikeId = GeneratedColumn<String>(
    'bike_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _scheduleIdMeta = const VerificationMeta(
    'scheduleId',
  );
  @override
  late final GeneratedColumn<String> scheduleId = GeneratedColumn<String>(
    'schedule_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sourceMeta = const VerificationMeta('source');
  @override
  late final GeneratedColumn<String> source = GeneratedColumn<String>(
    'source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dedupeKeyMeta = const VerificationMeta(
    'dedupeKey',
  );
  @override
  late final GeneratedColumn<String> dedupeKey = GeneratedColumn<String>(
    'dedupe_key',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _lastModifiedMeta = const VerificationMeta(
    'lastModified',
  );
  @override
  late final GeneratedColumn<DateTime> lastModified = GeneratedColumn<DateTime>(
    'last_modified',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    userId,
    type,
    title,
    message,
    readAt,
    dismissedAt,
    createdAt,
    bikeId,
    scheduleId,
    source,
    dedupeKey,
    isSynced,
    lastModified,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'notifications';
  @override
  VerificationContext validateIntegrity(
    Insertable<Notification> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
        _typeMeta,
        type.isAcceptableOrUnknown(data['type']!, _typeMeta),
      );
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    }
    if (data.containsKey('message')) {
      context.handle(
        _messageMeta,
        message.isAcceptableOrUnknown(data['message']!, _messageMeta),
      );
    } else if (isInserting) {
      context.missing(_messageMeta);
    }
    if (data.containsKey('read_at')) {
      context.handle(
        _readAtMeta,
        readAt.isAcceptableOrUnknown(data['read_at']!, _readAtMeta),
      );
    }
    if (data.containsKey('dismissed_at')) {
      context.handle(
        _dismissedAtMeta,
        dismissedAt.isAcceptableOrUnknown(
          data['dismissed_at']!,
          _dismissedAtMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('bike_id')) {
      context.handle(
        _bikeIdMeta,
        bikeId.isAcceptableOrUnknown(data['bike_id']!, _bikeIdMeta),
      );
    }
    if (data.containsKey('schedule_id')) {
      context.handle(
        _scheduleIdMeta,
        scheduleId.isAcceptableOrUnknown(data['schedule_id']!, _scheduleIdMeta),
      );
    }
    if (data.containsKey('source')) {
      context.handle(
        _sourceMeta,
        source.isAcceptableOrUnknown(data['source']!, _sourceMeta),
      );
    }
    if (data.containsKey('dedupe_key')) {
      context.handle(
        _dedupeKeyMeta,
        dedupeKey.isAcceptableOrUnknown(data['dedupe_key']!, _dedupeKeyMeta),
      );
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('last_modified')) {
      context.handle(
        _lastModifiedMeta,
        lastModified.isAcceptableOrUnknown(
          data['last_modified']!,
          _lastModifiedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_lastModifiedMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Notification map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Notification(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}type'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      ),
      message: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}message'],
      )!,
      readAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}read_at'],
      ),
      dismissedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}dismissed_at'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      bikeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bike_id'],
      ),
      scheduleId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}schedule_id'],
      ),
      source: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source'],
      ),
      dedupeKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}dedupe_key'],
      ),
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      lastModified: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_modified'],
      )!,
    );
  }

  @override
  $NotificationsTable createAlias(String alias) {
    return $NotificationsTable(attachedDatabase, alias);
  }
}

class Notification extends DataClass implements Insertable<Notification> {
  final String id;
  final String userId;
  final String type;
  final String? title;
  final String message;
  final DateTime? readAt;
  final DateTime? dismissedAt;
  final DateTime createdAt;
  final String? bikeId;
  final String? scheduleId;
  final String? source;
  final String? dedupeKey;
  final bool isSynced;
  final DateTime lastModified;
  const Notification({
    required this.id,
    required this.userId,
    required this.type,
    this.title,
    required this.message,
    this.readAt,
    this.dismissedAt,
    required this.createdAt,
    this.bikeId,
    this.scheduleId,
    this.source,
    this.dedupeKey,
    required this.isSynced,
    required this.lastModified,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['type'] = Variable<String>(type);
    if (!nullToAbsent || title != null) {
      map['title'] = Variable<String>(title);
    }
    map['message'] = Variable<String>(message);
    if (!nullToAbsent || readAt != null) {
      map['read_at'] = Variable<DateTime>(readAt);
    }
    if (!nullToAbsent || dismissedAt != null) {
      map['dismissed_at'] = Variable<DateTime>(dismissedAt);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || bikeId != null) {
      map['bike_id'] = Variable<String>(bikeId);
    }
    if (!nullToAbsent || scheduleId != null) {
      map['schedule_id'] = Variable<String>(scheduleId);
    }
    if (!nullToAbsent || source != null) {
      map['source'] = Variable<String>(source);
    }
    if (!nullToAbsent || dedupeKey != null) {
      map['dedupe_key'] = Variable<String>(dedupeKey);
    }
    map['is_synced'] = Variable<bool>(isSynced);
    map['last_modified'] = Variable<DateTime>(lastModified);
    return map;
  }

  NotificationsCompanion toCompanion(bool nullToAbsent) {
    return NotificationsCompanion(
      id: Value(id),
      userId: Value(userId),
      type: Value(type),
      title: title == null && nullToAbsent
          ? const Value.absent()
          : Value(title),
      message: Value(message),
      readAt: readAt == null && nullToAbsent
          ? const Value.absent()
          : Value(readAt),
      dismissedAt: dismissedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(dismissedAt),
      createdAt: Value(createdAt),
      bikeId: bikeId == null && nullToAbsent
          ? const Value.absent()
          : Value(bikeId),
      scheduleId: scheduleId == null && nullToAbsent
          ? const Value.absent()
          : Value(scheduleId),
      source: source == null && nullToAbsent
          ? const Value.absent()
          : Value(source),
      dedupeKey: dedupeKey == null && nullToAbsent
          ? const Value.absent()
          : Value(dedupeKey),
      isSynced: Value(isSynced),
      lastModified: Value(lastModified),
    );
  }

  factory Notification.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Notification(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      type: serializer.fromJson<String>(json['type']),
      title: serializer.fromJson<String?>(json['title']),
      message: serializer.fromJson<String>(json['message']),
      readAt: serializer.fromJson<DateTime?>(json['readAt']),
      dismissedAt: serializer.fromJson<DateTime?>(json['dismissedAt']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      bikeId: serializer.fromJson<String?>(json['bikeId']),
      scheduleId: serializer.fromJson<String?>(json['scheduleId']),
      source: serializer.fromJson<String?>(json['source']),
      dedupeKey: serializer.fromJson<String?>(json['dedupeKey']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      lastModified: serializer.fromJson<DateTime>(json['lastModified']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'type': serializer.toJson<String>(type),
      'title': serializer.toJson<String?>(title),
      'message': serializer.toJson<String>(message),
      'readAt': serializer.toJson<DateTime?>(readAt),
      'dismissedAt': serializer.toJson<DateTime?>(dismissedAt),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'bikeId': serializer.toJson<String?>(bikeId),
      'scheduleId': serializer.toJson<String?>(scheduleId),
      'source': serializer.toJson<String?>(source),
      'dedupeKey': serializer.toJson<String?>(dedupeKey),
      'isSynced': serializer.toJson<bool>(isSynced),
      'lastModified': serializer.toJson<DateTime>(lastModified),
    };
  }

  Notification copyWith({
    String? id,
    String? userId,
    String? type,
    Value<String?> title = const Value.absent(),
    String? message,
    Value<DateTime?> readAt = const Value.absent(),
    Value<DateTime?> dismissedAt = const Value.absent(),
    DateTime? createdAt,
    Value<String?> bikeId = const Value.absent(),
    Value<String?> scheduleId = const Value.absent(),
    Value<String?> source = const Value.absent(),
    Value<String?> dedupeKey = const Value.absent(),
    bool? isSynced,
    DateTime? lastModified,
  }) => Notification(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    type: type ?? this.type,
    title: title.present ? title.value : this.title,
    message: message ?? this.message,
    readAt: readAt.present ? readAt.value : this.readAt,
    dismissedAt: dismissedAt.present ? dismissedAt.value : this.dismissedAt,
    createdAt: createdAt ?? this.createdAt,
    bikeId: bikeId.present ? bikeId.value : this.bikeId,
    scheduleId: scheduleId.present ? scheduleId.value : this.scheduleId,
    source: source.present ? source.value : this.source,
    dedupeKey: dedupeKey.present ? dedupeKey.value : this.dedupeKey,
    isSynced: isSynced ?? this.isSynced,
    lastModified: lastModified ?? this.lastModified,
  );
  Notification copyWithCompanion(NotificationsCompanion data) {
    return Notification(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      type: data.type.present ? data.type.value : this.type,
      title: data.title.present ? data.title.value : this.title,
      message: data.message.present ? data.message.value : this.message,
      readAt: data.readAt.present ? data.readAt.value : this.readAt,
      dismissedAt: data.dismissedAt.present
          ? data.dismissedAt.value
          : this.dismissedAt,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      bikeId: data.bikeId.present ? data.bikeId.value : this.bikeId,
      scheduleId: data.scheduleId.present
          ? data.scheduleId.value
          : this.scheduleId,
      source: data.source.present ? data.source.value : this.source,
      dedupeKey: data.dedupeKey.present ? data.dedupeKey.value : this.dedupeKey,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      lastModified: data.lastModified.present
          ? data.lastModified.value
          : this.lastModified,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Notification(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('type: $type, ')
          ..write('title: $title, ')
          ..write('message: $message, ')
          ..write('readAt: $readAt, ')
          ..write('dismissedAt: $dismissedAt, ')
          ..write('createdAt: $createdAt, ')
          ..write('bikeId: $bikeId, ')
          ..write('scheduleId: $scheduleId, ')
          ..write('source: $source, ')
          ..write('dedupeKey: $dedupeKey, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    userId,
    type,
    title,
    message,
    readAt,
    dismissedAt,
    createdAt,
    bikeId,
    scheduleId,
    source,
    dedupeKey,
    isSynced,
    lastModified,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Notification &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.type == this.type &&
          other.title == this.title &&
          other.message == this.message &&
          other.readAt == this.readAt &&
          other.dismissedAt == this.dismissedAt &&
          other.createdAt == this.createdAt &&
          other.bikeId == this.bikeId &&
          other.scheduleId == this.scheduleId &&
          other.source == this.source &&
          other.dedupeKey == this.dedupeKey &&
          other.isSynced == this.isSynced &&
          other.lastModified == this.lastModified);
}

class NotificationsCompanion extends UpdateCompanion<Notification> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> type;
  final Value<String?> title;
  final Value<String> message;
  final Value<DateTime?> readAt;
  final Value<DateTime?> dismissedAt;
  final Value<DateTime> createdAt;
  final Value<String?> bikeId;
  final Value<String?> scheduleId;
  final Value<String?> source;
  final Value<String?> dedupeKey;
  final Value<bool> isSynced;
  final Value<DateTime> lastModified;
  final Value<int> rowid;
  const NotificationsCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.type = const Value.absent(),
    this.title = const Value.absent(),
    this.message = const Value.absent(),
    this.readAt = const Value.absent(),
    this.dismissedAt = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.bikeId = const Value.absent(),
    this.scheduleId = const Value.absent(),
    this.source = const Value.absent(),
    this.dedupeKey = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.lastModified = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  NotificationsCompanion.insert({
    required String id,
    required String userId,
    required String type,
    this.title = const Value.absent(),
    required String message,
    this.readAt = const Value.absent(),
    this.dismissedAt = const Value.absent(),
    required DateTime createdAt,
    this.bikeId = const Value.absent(),
    this.scheduleId = const Value.absent(),
    this.source = const Value.absent(),
    this.dedupeKey = const Value.absent(),
    this.isSynced = const Value.absent(),
    required DateTime lastModified,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       userId = Value(userId),
       type = Value(type),
       message = Value(message),
       createdAt = Value(createdAt),
       lastModified = Value(lastModified);
  static Insertable<Notification> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? type,
    Expression<String>? title,
    Expression<String>? message,
    Expression<DateTime>? readAt,
    Expression<DateTime>? dismissedAt,
    Expression<DateTime>? createdAt,
    Expression<String>? bikeId,
    Expression<String>? scheduleId,
    Expression<String>? source,
    Expression<String>? dedupeKey,
    Expression<bool>? isSynced,
    Expression<DateTime>? lastModified,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (type != null) 'type': type,
      if (title != null) 'title': title,
      if (message != null) 'message': message,
      if (readAt != null) 'read_at': readAt,
      if (dismissedAt != null) 'dismissed_at': dismissedAt,
      if (createdAt != null) 'created_at': createdAt,
      if (bikeId != null) 'bike_id': bikeId,
      if (scheduleId != null) 'schedule_id': scheduleId,
      if (source != null) 'source': source,
      if (dedupeKey != null) 'dedupe_key': dedupeKey,
      if (isSynced != null) 'is_synced': isSynced,
      if (lastModified != null) 'last_modified': lastModified,
      if (rowid != null) 'rowid': rowid,
    });
  }

  NotificationsCompanion copyWith({
    Value<String>? id,
    Value<String>? userId,
    Value<String>? type,
    Value<String?>? title,
    Value<String>? message,
    Value<DateTime?>? readAt,
    Value<DateTime?>? dismissedAt,
    Value<DateTime>? createdAt,
    Value<String?>? bikeId,
    Value<String?>? scheduleId,
    Value<String?>? source,
    Value<String?>? dedupeKey,
    Value<bool>? isSynced,
    Value<DateTime>? lastModified,
    Value<int>? rowid,
  }) {
    return NotificationsCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      readAt: readAt ?? this.readAt,
      dismissedAt: dismissedAt ?? this.dismissedAt,
      createdAt: createdAt ?? this.createdAt,
      bikeId: bikeId ?? this.bikeId,
      scheduleId: scheduleId ?? this.scheduleId,
      source: source ?? this.source,
      dedupeKey: dedupeKey ?? this.dedupeKey,
      isSynced: isSynced ?? this.isSynced,
      lastModified: lastModified ?? this.lastModified,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (message.present) {
      map['message'] = Variable<String>(message.value);
    }
    if (readAt.present) {
      map['read_at'] = Variable<DateTime>(readAt.value);
    }
    if (dismissedAt.present) {
      map['dismissed_at'] = Variable<DateTime>(dismissedAt.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (bikeId.present) {
      map['bike_id'] = Variable<String>(bikeId.value);
    }
    if (scheduleId.present) {
      map['schedule_id'] = Variable<String>(scheduleId.value);
    }
    if (source.present) {
      map['source'] = Variable<String>(source.value);
    }
    if (dedupeKey.present) {
      map['dedupe_key'] = Variable<String>(dedupeKey.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (lastModified.present) {
      map['last_modified'] = Variable<DateTime>(lastModified.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('NotificationsCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('type: $type, ')
          ..write('title: $title, ')
          ..write('message: $message, ')
          ..write('readAt: $readAt, ')
          ..write('dismissedAt: $dismissedAt, ')
          ..write('createdAt: $createdAt, ')
          ..write('bikeId: $bikeId, ')
          ..write('scheduleId: $scheduleId, ')
          ..write('source: $source, ')
          ..write('dedupeKey: $dedupeKey, ')
          ..write('isSynced: $isSynced, ')
          ..write('lastModified: $lastModified, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $BikesTable bikes = $BikesTable(this);
  late final $RidesTable rides = $RidesTable(this);
  late final $FuelLogsTable fuelLogs = $FuelLogsTable(this);
  late final $MaintenanceLogsTable maintenanceLogs = $MaintenanceLogsTable(
    this,
  );
  late final $MaintenanceSchedulesTable maintenanceSchedules =
      $MaintenanceSchedulesTable(this);
  late final $ServiceHistoryTable serviceHistory = $ServiceHistoryTable(this);
  late final $NotificationsTable notifications = $NotificationsTable(this);
  late final BikesDao bikesDao = BikesDao(this as AppDatabase);
  late final RidesDao ridesDao = RidesDao(this as AppDatabase);
  late final FuelDao fuelDao = FuelDao(this as AppDatabase);
  late final MaintenanceDao maintenanceDao = MaintenanceDao(
    this as AppDatabase,
  );
  late final NotificationsDao notificationsDao = NotificationsDao(
    this as AppDatabase,
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    bikes,
    rides,
    fuelLogs,
    maintenanceLogs,
    maintenanceSchedules,
    serviceHistory,
    notifications,
  ];
}

typedef $$BikesTableCreateCompanionBuilder =
    BikesCompanion Function({
      required String id,
      required String userId,
      required String make,
      required String model,
      Value<int?> year,
      Value<double> currentOdo,
      Value<String?> nickName,
      Value<String?> imageUrl,
      Value<String?> specsEngine,
      Value<String?> specsPower,
      Value<double?> avgMileage,
      Value<double?> lastFuelPrice,
      required DateTime createdAt,
      Value<bool> isSynced,
      required DateTime lastModified,
      Value<int> rowid,
    });
typedef $$BikesTableUpdateCompanionBuilder =
    BikesCompanion Function({
      Value<String> id,
      Value<String> userId,
      Value<String> make,
      Value<String> model,
      Value<int?> year,
      Value<double> currentOdo,
      Value<String?> nickName,
      Value<String?> imageUrl,
      Value<String?> specsEngine,
      Value<String?> specsPower,
      Value<double?> avgMileage,
      Value<double?> lastFuelPrice,
      Value<DateTime> createdAt,
      Value<bool> isSynced,
      Value<DateTime> lastModified,
      Value<int> rowid,
    });

class $$BikesTableFilterComposer extends Composer<_$AppDatabase, $BikesTable> {
  $$BikesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get make => $composableBuilder(
    column: $table.make,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get model => $composableBuilder(
    column: $table.model,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get year => $composableBuilder(
    column: $table.year,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get currentOdo => $composableBuilder(
    column: $table.currentOdo,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get nickName => $composableBuilder(
    column: $table.nickName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get imageUrl => $composableBuilder(
    column: $table.imageUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get specsEngine => $composableBuilder(
    column: $table.specsEngine,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get specsPower => $composableBuilder(
    column: $table.specsPower,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get avgMileage => $composableBuilder(
    column: $table.avgMileage,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get lastFuelPrice => $composableBuilder(
    column: $table.lastFuelPrice,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnFilters(column),
  );
}

class $$BikesTableOrderingComposer
    extends Composer<_$AppDatabase, $BikesTable> {
  $$BikesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get make => $composableBuilder(
    column: $table.make,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get model => $composableBuilder(
    column: $table.model,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get year => $composableBuilder(
    column: $table.year,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get currentOdo => $composableBuilder(
    column: $table.currentOdo,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get nickName => $composableBuilder(
    column: $table.nickName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get imageUrl => $composableBuilder(
    column: $table.imageUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get specsEngine => $composableBuilder(
    column: $table.specsEngine,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get specsPower => $composableBuilder(
    column: $table.specsPower,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get avgMileage => $composableBuilder(
    column: $table.avgMileage,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get lastFuelPrice => $composableBuilder(
    column: $table.lastFuelPrice,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$BikesTableAnnotationComposer
    extends Composer<_$AppDatabase, $BikesTable> {
  $$BikesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get make =>
      $composableBuilder(column: $table.make, builder: (column) => column);

  GeneratedColumn<String> get model =>
      $composableBuilder(column: $table.model, builder: (column) => column);

  GeneratedColumn<int> get year =>
      $composableBuilder(column: $table.year, builder: (column) => column);

  GeneratedColumn<double> get currentOdo => $composableBuilder(
    column: $table.currentOdo,
    builder: (column) => column,
  );

  GeneratedColumn<String> get nickName =>
      $composableBuilder(column: $table.nickName, builder: (column) => column);

  GeneratedColumn<String> get imageUrl =>
      $composableBuilder(column: $table.imageUrl, builder: (column) => column);

  GeneratedColumn<String> get specsEngine => $composableBuilder(
    column: $table.specsEngine,
    builder: (column) => column,
  );

  GeneratedColumn<String> get specsPower => $composableBuilder(
    column: $table.specsPower,
    builder: (column) => column,
  );

  GeneratedColumn<double> get avgMileage => $composableBuilder(
    column: $table.avgMileage,
    builder: (column) => column,
  );

  GeneratedColumn<double> get lastFuelPrice => $composableBuilder(
    column: $table.lastFuelPrice,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => column,
  );
}

class $$BikesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $BikesTable,
          Bike,
          $$BikesTableFilterComposer,
          $$BikesTableOrderingComposer,
          $$BikesTableAnnotationComposer,
          $$BikesTableCreateCompanionBuilder,
          $$BikesTableUpdateCompanionBuilder,
          (Bike, BaseReferences<_$AppDatabase, $BikesTable, Bike>),
          Bike,
          PrefetchHooks Function()
        > {
  $$BikesTableTableManager(_$AppDatabase db, $BikesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$BikesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$BikesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$BikesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> userId = const Value.absent(),
                Value<String> make = const Value.absent(),
                Value<String> model = const Value.absent(),
                Value<int?> year = const Value.absent(),
                Value<double> currentOdo = const Value.absent(),
                Value<String?> nickName = const Value.absent(),
                Value<String?> imageUrl = const Value.absent(),
                Value<String?> specsEngine = const Value.absent(),
                Value<String?> specsPower = const Value.absent(),
                Value<double?> avgMileage = const Value.absent(),
                Value<double?> lastFuelPrice = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> lastModified = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => BikesCompanion(
                id: id,
                userId: userId,
                make: make,
                model: model,
                year: year,
                currentOdo: currentOdo,
                nickName: nickName,
                imageUrl: imageUrl,
                specsEngine: specsEngine,
                specsPower: specsPower,
                avgMileage: avgMileage,
                lastFuelPrice: lastFuelPrice,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String userId,
                required String make,
                required String model,
                Value<int?> year = const Value.absent(),
                Value<double> currentOdo = const Value.absent(),
                Value<String?> nickName = const Value.absent(),
                Value<String?> imageUrl = const Value.absent(),
                Value<String?> specsEngine = const Value.absent(),
                Value<String?> specsPower = const Value.absent(),
                Value<double?> avgMileage = const Value.absent(),
                Value<double?> lastFuelPrice = const Value.absent(),
                required DateTime createdAt,
                Value<bool> isSynced = const Value.absent(),
                required DateTime lastModified,
                Value<int> rowid = const Value.absent(),
              }) => BikesCompanion.insert(
                id: id,
                userId: userId,
                make: make,
                model: model,
                year: year,
                currentOdo: currentOdo,
                nickName: nickName,
                imageUrl: imageUrl,
                specsEngine: specsEngine,
                specsPower: specsPower,
                avgMileage: avgMileage,
                lastFuelPrice: lastFuelPrice,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$BikesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $BikesTable,
      Bike,
      $$BikesTableFilterComposer,
      $$BikesTableOrderingComposer,
      $$BikesTableAnnotationComposer,
      $$BikesTableCreateCompanionBuilder,
      $$BikesTableUpdateCompanionBuilder,
      (Bike, BaseReferences<_$AppDatabase, $BikesTable, Bike>),
      Bike,
      PrefetchHooks Function()
    >;
typedef $$RidesTableCreateCompanionBuilder =
    RidesCompanion Function({
      required String id,
      required String bikeId,
      required String userId,
      required DateTime startTime,
      Value<DateTime?> endTime,
      required double distanceKm,
      Value<double?> maxLeanLeft,
      Value<double?> maxLeanRight,
      Value<String?> routePath,
      Value<String?> rideName,
      Value<String?> notes,
      Value<String?> imageUrl,
      required DateTime createdAt,
      Value<bool> isSynced,
      required DateTime lastModified,
      Value<int> rowid,
    });
typedef $$RidesTableUpdateCompanionBuilder =
    RidesCompanion Function({
      Value<String> id,
      Value<String> bikeId,
      Value<String> userId,
      Value<DateTime> startTime,
      Value<DateTime?> endTime,
      Value<double> distanceKm,
      Value<double?> maxLeanLeft,
      Value<double?> maxLeanRight,
      Value<String?> routePath,
      Value<String?> rideName,
      Value<String?> notes,
      Value<String?> imageUrl,
      Value<DateTime> createdAt,
      Value<bool> isSynced,
      Value<DateTime> lastModified,
      Value<int> rowid,
    });

class $$RidesTableFilterComposer extends Composer<_$AppDatabase, $RidesTable> {
  $$RidesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startTime => $composableBuilder(
    column: $table.startTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get endTime => $composableBuilder(
    column: $table.endTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get distanceKm => $composableBuilder(
    column: $table.distanceKm,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get maxLeanLeft => $composableBuilder(
    column: $table.maxLeanLeft,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get maxLeanRight => $composableBuilder(
    column: $table.maxLeanRight,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get routePath => $composableBuilder(
    column: $table.routePath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get rideName => $composableBuilder(
    column: $table.rideName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get imageUrl => $composableBuilder(
    column: $table.imageUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnFilters(column),
  );
}

class $$RidesTableOrderingComposer
    extends Composer<_$AppDatabase, $RidesTable> {
  $$RidesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startTime => $composableBuilder(
    column: $table.startTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get endTime => $composableBuilder(
    column: $table.endTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get distanceKm => $composableBuilder(
    column: $table.distanceKm,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get maxLeanLeft => $composableBuilder(
    column: $table.maxLeanLeft,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get maxLeanRight => $composableBuilder(
    column: $table.maxLeanRight,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get routePath => $composableBuilder(
    column: $table.routePath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get rideName => $composableBuilder(
    column: $table.rideName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get imageUrl => $composableBuilder(
    column: $table.imageUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$RidesTableAnnotationComposer
    extends Composer<_$AppDatabase, $RidesTable> {
  $$RidesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get bikeId =>
      $composableBuilder(column: $table.bikeId, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<DateTime> get startTime =>
      $composableBuilder(column: $table.startTime, builder: (column) => column);

  GeneratedColumn<DateTime> get endTime =>
      $composableBuilder(column: $table.endTime, builder: (column) => column);

  GeneratedColumn<double> get distanceKm => $composableBuilder(
    column: $table.distanceKm,
    builder: (column) => column,
  );

  GeneratedColumn<double> get maxLeanLeft => $composableBuilder(
    column: $table.maxLeanLeft,
    builder: (column) => column,
  );

  GeneratedColumn<double> get maxLeanRight => $composableBuilder(
    column: $table.maxLeanRight,
    builder: (column) => column,
  );

  GeneratedColumn<String> get routePath =>
      $composableBuilder(column: $table.routePath, builder: (column) => column);

  GeneratedColumn<String> get rideName =>
      $composableBuilder(column: $table.rideName, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<String> get imageUrl =>
      $composableBuilder(column: $table.imageUrl, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => column,
  );
}

class $$RidesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $RidesTable,
          Ride,
          $$RidesTableFilterComposer,
          $$RidesTableOrderingComposer,
          $$RidesTableAnnotationComposer,
          $$RidesTableCreateCompanionBuilder,
          $$RidesTableUpdateCompanionBuilder,
          (Ride, BaseReferences<_$AppDatabase, $RidesTable, Ride>),
          Ride,
          PrefetchHooks Function()
        > {
  $$RidesTableTableManager(_$AppDatabase db, $RidesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$RidesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$RidesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$RidesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> bikeId = const Value.absent(),
                Value<String> userId = const Value.absent(),
                Value<DateTime> startTime = const Value.absent(),
                Value<DateTime?> endTime = const Value.absent(),
                Value<double> distanceKm = const Value.absent(),
                Value<double?> maxLeanLeft = const Value.absent(),
                Value<double?> maxLeanRight = const Value.absent(),
                Value<String?> routePath = const Value.absent(),
                Value<String?> rideName = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<String?> imageUrl = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> lastModified = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => RidesCompanion(
                id: id,
                bikeId: bikeId,
                userId: userId,
                startTime: startTime,
                endTime: endTime,
                distanceKm: distanceKm,
                maxLeanLeft: maxLeanLeft,
                maxLeanRight: maxLeanRight,
                routePath: routePath,
                rideName: rideName,
                notes: notes,
                imageUrl: imageUrl,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String bikeId,
                required String userId,
                required DateTime startTime,
                Value<DateTime?> endTime = const Value.absent(),
                required double distanceKm,
                Value<double?> maxLeanLeft = const Value.absent(),
                Value<double?> maxLeanRight = const Value.absent(),
                Value<String?> routePath = const Value.absent(),
                Value<String?> rideName = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<String?> imageUrl = const Value.absent(),
                required DateTime createdAt,
                Value<bool> isSynced = const Value.absent(),
                required DateTime lastModified,
                Value<int> rowid = const Value.absent(),
              }) => RidesCompanion.insert(
                id: id,
                bikeId: bikeId,
                userId: userId,
                startTime: startTime,
                endTime: endTime,
                distanceKm: distanceKm,
                maxLeanLeft: maxLeanLeft,
                maxLeanRight: maxLeanRight,
                routePath: routePath,
                rideName: rideName,
                notes: notes,
                imageUrl: imageUrl,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$RidesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $RidesTable,
      Ride,
      $$RidesTableFilterComposer,
      $$RidesTableOrderingComposer,
      $$RidesTableAnnotationComposer,
      $$RidesTableCreateCompanionBuilder,
      $$RidesTableUpdateCompanionBuilder,
      (Ride, BaseReferences<_$AppDatabase, $RidesTable, Ride>),
      Ride,
      PrefetchHooks Function()
    >;
typedef $$FuelLogsTableCreateCompanionBuilder =
    FuelLogsCompanion Function({
      required String id,
      required String bikeId,
      required double odometer,
      required double litres,
      required double pricePerLitre,
      required double totalCost,
      required bool isFullTank,
      required String date,
      required DateTime createdAt,
      Value<bool> isSynced,
      required DateTime lastModified,
      Value<int> rowid,
    });
typedef $$FuelLogsTableUpdateCompanionBuilder =
    FuelLogsCompanion Function({
      Value<String> id,
      Value<String> bikeId,
      Value<double> odometer,
      Value<double> litres,
      Value<double> pricePerLitre,
      Value<double> totalCost,
      Value<bool> isFullTank,
      Value<String> date,
      Value<DateTime> createdAt,
      Value<bool> isSynced,
      Value<DateTime> lastModified,
      Value<int> rowid,
    });

class $$FuelLogsTableFilterComposer
    extends Composer<_$AppDatabase, $FuelLogsTable> {
  $$FuelLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get odometer => $composableBuilder(
    column: $table.odometer,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get litres => $composableBuilder(
    column: $table.litres,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get pricePerLitre => $composableBuilder(
    column: $table.pricePerLitre,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get totalCost => $composableBuilder(
    column: $table.totalCost,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isFullTank => $composableBuilder(
    column: $table.isFullTank,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get date => $composableBuilder(
    column: $table.date,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnFilters(column),
  );
}

class $$FuelLogsTableOrderingComposer
    extends Composer<_$AppDatabase, $FuelLogsTable> {
  $$FuelLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get odometer => $composableBuilder(
    column: $table.odometer,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get litres => $composableBuilder(
    column: $table.litres,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get pricePerLitre => $composableBuilder(
    column: $table.pricePerLitre,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get totalCost => $composableBuilder(
    column: $table.totalCost,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isFullTank => $composableBuilder(
    column: $table.isFullTank,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get date => $composableBuilder(
    column: $table.date,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$FuelLogsTableAnnotationComposer
    extends Composer<_$AppDatabase, $FuelLogsTable> {
  $$FuelLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get bikeId =>
      $composableBuilder(column: $table.bikeId, builder: (column) => column);

  GeneratedColumn<double> get odometer =>
      $composableBuilder(column: $table.odometer, builder: (column) => column);

  GeneratedColumn<double> get litres =>
      $composableBuilder(column: $table.litres, builder: (column) => column);

  GeneratedColumn<double> get pricePerLitre => $composableBuilder(
    column: $table.pricePerLitre,
    builder: (column) => column,
  );

  GeneratedColumn<double> get totalCost =>
      $composableBuilder(column: $table.totalCost, builder: (column) => column);

  GeneratedColumn<bool> get isFullTank => $composableBuilder(
    column: $table.isFullTank,
    builder: (column) => column,
  );

  GeneratedColumn<String> get date =>
      $composableBuilder(column: $table.date, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => column,
  );
}

class $$FuelLogsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FuelLogsTable,
          FuelLog,
          $$FuelLogsTableFilterComposer,
          $$FuelLogsTableOrderingComposer,
          $$FuelLogsTableAnnotationComposer,
          $$FuelLogsTableCreateCompanionBuilder,
          $$FuelLogsTableUpdateCompanionBuilder,
          (FuelLog, BaseReferences<_$AppDatabase, $FuelLogsTable, FuelLog>),
          FuelLog,
          PrefetchHooks Function()
        > {
  $$FuelLogsTableTableManager(_$AppDatabase db, $FuelLogsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FuelLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FuelLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FuelLogsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> bikeId = const Value.absent(),
                Value<double> odometer = const Value.absent(),
                Value<double> litres = const Value.absent(),
                Value<double> pricePerLitre = const Value.absent(),
                Value<double> totalCost = const Value.absent(),
                Value<bool> isFullTank = const Value.absent(),
                Value<String> date = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> lastModified = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FuelLogsCompanion(
                id: id,
                bikeId: bikeId,
                odometer: odometer,
                litres: litres,
                pricePerLitre: pricePerLitre,
                totalCost: totalCost,
                isFullTank: isFullTank,
                date: date,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String bikeId,
                required double odometer,
                required double litres,
                required double pricePerLitre,
                required double totalCost,
                required bool isFullTank,
                required String date,
                required DateTime createdAt,
                Value<bool> isSynced = const Value.absent(),
                required DateTime lastModified,
                Value<int> rowid = const Value.absent(),
              }) => FuelLogsCompanion.insert(
                id: id,
                bikeId: bikeId,
                odometer: odometer,
                litres: litres,
                pricePerLitre: pricePerLitre,
                totalCost: totalCost,
                isFullTank: isFullTank,
                date: date,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$FuelLogsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FuelLogsTable,
      FuelLog,
      $$FuelLogsTableFilterComposer,
      $$FuelLogsTableOrderingComposer,
      $$FuelLogsTableAnnotationComposer,
      $$FuelLogsTableCreateCompanionBuilder,
      $$FuelLogsTableUpdateCompanionBuilder,
      (FuelLog, BaseReferences<_$AppDatabase, $FuelLogsTable, FuelLog>),
      FuelLog,
      PrefetchHooks Function()
    >;
typedef $$MaintenanceLogsTableCreateCompanionBuilder =
    MaintenanceLogsCompanion Function({
      required String id,
      required String bikeId,
      required String serviceType,
      required double odoAtService,
      required String datePerformed,
      Value<String?> notes,
      Value<String?> receiptUrl,
      required DateTime createdAt,
      Value<bool> isSynced,
      required DateTime lastModified,
      Value<int> rowid,
    });
typedef $$MaintenanceLogsTableUpdateCompanionBuilder =
    MaintenanceLogsCompanion Function({
      Value<String> id,
      Value<String> bikeId,
      Value<String> serviceType,
      Value<double> odoAtService,
      Value<String> datePerformed,
      Value<String?> notes,
      Value<String?> receiptUrl,
      Value<DateTime> createdAt,
      Value<bool> isSynced,
      Value<DateTime> lastModified,
      Value<int> rowid,
    });

class $$MaintenanceLogsTableFilterComposer
    extends Composer<_$AppDatabase, $MaintenanceLogsTable> {
  $$MaintenanceLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serviceType => $composableBuilder(
    column: $table.serviceType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get odoAtService => $composableBuilder(
    column: $table.odoAtService,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get datePerformed => $composableBuilder(
    column: $table.datePerformed,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get receiptUrl => $composableBuilder(
    column: $table.receiptUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnFilters(column),
  );
}

class $$MaintenanceLogsTableOrderingComposer
    extends Composer<_$AppDatabase, $MaintenanceLogsTable> {
  $$MaintenanceLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serviceType => $composableBuilder(
    column: $table.serviceType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get odoAtService => $composableBuilder(
    column: $table.odoAtService,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get datePerformed => $composableBuilder(
    column: $table.datePerformed,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get receiptUrl => $composableBuilder(
    column: $table.receiptUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$MaintenanceLogsTableAnnotationComposer
    extends Composer<_$AppDatabase, $MaintenanceLogsTable> {
  $$MaintenanceLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get bikeId =>
      $composableBuilder(column: $table.bikeId, builder: (column) => column);

  GeneratedColumn<String> get serviceType => $composableBuilder(
    column: $table.serviceType,
    builder: (column) => column,
  );

  GeneratedColumn<double> get odoAtService => $composableBuilder(
    column: $table.odoAtService,
    builder: (column) => column,
  );

  GeneratedColumn<String> get datePerformed => $composableBuilder(
    column: $table.datePerformed,
    builder: (column) => column,
  );

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<String> get receiptUrl => $composableBuilder(
    column: $table.receiptUrl,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => column,
  );
}

class $$MaintenanceLogsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $MaintenanceLogsTable,
          MaintenanceLog,
          $$MaintenanceLogsTableFilterComposer,
          $$MaintenanceLogsTableOrderingComposer,
          $$MaintenanceLogsTableAnnotationComposer,
          $$MaintenanceLogsTableCreateCompanionBuilder,
          $$MaintenanceLogsTableUpdateCompanionBuilder,
          (
            MaintenanceLog,
            BaseReferences<
              _$AppDatabase,
              $MaintenanceLogsTable,
              MaintenanceLog
            >,
          ),
          MaintenanceLog,
          PrefetchHooks Function()
        > {
  $$MaintenanceLogsTableTableManager(
    _$AppDatabase db,
    $MaintenanceLogsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MaintenanceLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MaintenanceLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$MaintenanceLogsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> bikeId = const Value.absent(),
                Value<String> serviceType = const Value.absent(),
                Value<double> odoAtService = const Value.absent(),
                Value<String> datePerformed = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<String?> receiptUrl = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> lastModified = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => MaintenanceLogsCompanion(
                id: id,
                bikeId: bikeId,
                serviceType: serviceType,
                odoAtService: odoAtService,
                datePerformed: datePerformed,
                notes: notes,
                receiptUrl: receiptUrl,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String bikeId,
                required String serviceType,
                required double odoAtService,
                required String datePerformed,
                Value<String?> notes = const Value.absent(),
                Value<String?> receiptUrl = const Value.absent(),
                required DateTime createdAt,
                Value<bool> isSynced = const Value.absent(),
                required DateTime lastModified,
                Value<int> rowid = const Value.absent(),
              }) => MaintenanceLogsCompanion.insert(
                id: id,
                bikeId: bikeId,
                serviceType: serviceType,
                odoAtService: odoAtService,
                datePerformed: datePerformed,
                notes: notes,
                receiptUrl: receiptUrl,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$MaintenanceLogsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $MaintenanceLogsTable,
      MaintenanceLog,
      $$MaintenanceLogsTableFilterComposer,
      $$MaintenanceLogsTableOrderingComposer,
      $$MaintenanceLogsTableAnnotationComposer,
      $$MaintenanceLogsTableCreateCompanionBuilder,
      $$MaintenanceLogsTableUpdateCompanionBuilder,
      (
        MaintenanceLog,
        BaseReferences<_$AppDatabase, $MaintenanceLogsTable, MaintenanceLog>,
      ),
      MaintenanceLog,
      PrefetchHooks Function()
    >;
typedef $$MaintenanceSchedulesTableCreateCompanionBuilder =
    MaintenanceSchedulesCompanion Function({
      required String id,
      required String bikeId,
      required String partName,
      required int intervalKm,
      required int intervalMonths,
      Value<String?> lastServiceDate,
      Value<double?> lastServiceOdo,
      required bool isActive,
      required DateTime createdAt,
      Value<bool> isSynced,
      required DateTime lastModified,
      Value<int> rowid,
    });
typedef $$MaintenanceSchedulesTableUpdateCompanionBuilder =
    MaintenanceSchedulesCompanion Function({
      Value<String> id,
      Value<String> bikeId,
      Value<String> partName,
      Value<int> intervalKm,
      Value<int> intervalMonths,
      Value<String?> lastServiceDate,
      Value<double?> lastServiceOdo,
      Value<bool> isActive,
      Value<DateTime> createdAt,
      Value<bool> isSynced,
      Value<DateTime> lastModified,
      Value<int> rowid,
    });

class $$MaintenanceSchedulesTableFilterComposer
    extends Composer<_$AppDatabase, $MaintenanceSchedulesTable> {
  $$MaintenanceSchedulesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get partName => $composableBuilder(
    column: $table.partName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get intervalKm => $composableBuilder(
    column: $table.intervalKm,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get intervalMonths => $composableBuilder(
    column: $table.intervalMonths,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastServiceDate => $composableBuilder(
    column: $table.lastServiceDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get lastServiceOdo => $composableBuilder(
    column: $table.lastServiceOdo,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnFilters(column),
  );
}

class $$MaintenanceSchedulesTableOrderingComposer
    extends Composer<_$AppDatabase, $MaintenanceSchedulesTable> {
  $$MaintenanceSchedulesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get partName => $composableBuilder(
    column: $table.partName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get intervalKm => $composableBuilder(
    column: $table.intervalKm,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get intervalMonths => $composableBuilder(
    column: $table.intervalMonths,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastServiceDate => $composableBuilder(
    column: $table.lastServiceDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get lastServiceOdo => $composableBuilder(
    column: $table.lastServiceOdo,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$MaintenanceSchedulesTableAnnotationComposer
    extends Composer<_$AppDatabase, $MaintenanceSchedulesTable> {
  $$MaintenanceSchedulesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get bikeId =>
      $composableBuilder(column: $table.bikeId, builder: (column) => column);

  GeneratedColumn<String> get partName =>
      $composableBuilder(column: $table.partName, builder: (column) => column);

  GeneratedColumn<int> get intervalKm => $composableBuilder(
    column: $table.intervalKm,
    builder: (column) => column,
  );

  GeneratedColumn<int> get intervalMonths => $composableBuilder(
    column: $table.intervalMonths,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastServiceDate => $composableBuilder(
    column: $table.lastServiceDate,
    builder: (column) => column,
  );

  GeneratedColumn<double> get lastServiceOdo => $composableBuilder(
    column: $table.lastServiceOdo,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get isActive =>
      $composableBuilder(column: $table.isActive, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => column,
  );
}

class $$MaintenanceSchedulesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $MaintenanceSchedulesTable,
          MaintenanceSchedule,
          $$MaintenanceSchedulesTableFilterComposer,
          $$MaintenanceSchedulesTableOrderingComposer,
          $$MaintenanceSchedulesTableAnnotationComposer,
          $$MaintenanceSchedulesTableCreateCompanionBuilder,
          $$MaintenanceSchedulesTableUpdateCompanionBuilder,
          (
            MaintenanceSchedule,
            BaseReferences<
              _$AppDatabase,
              $MaintenanceSchedulesTable,
              MaintenanceSchedule
            >,
          ),
          MaintenanceSchedule,
          PrefetchHooks Function()
        > {
  $$MaintenanceSchedulesTableTableManager(
    _$AppDatabase db,
    $MaintenanceSchedulesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MaintenanceSchedulesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MaintenanceSchedulesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$MaintenanceSchedulesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> bikeId = const Value.absent(),
                Value<String> partName = const Value.absent(),
                Value<int> intervalKm = const Value.absent(),
                Value<int> intervalMonths = const Value.absent(),
                Value<String?> lastServiceDate = const Value.absent(),
                Value<double?> lastServiceOdo = const Value.absent(),
                Value<bool> isActive = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> lastModified = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => MaintenanceSchedulesCompanion(
                id: id,
                bikeId: bikeId,
                partName: partName,
                intervalKm: intervalKm,
                intervalMonths: intervalMonths,
                lastServiceDate: lastServiceDate,
                lastServiceOdo: lastServiceOdo,
                isActive: isActive,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String bikeId,
                required String partName,
                required int intervalKm,
                required int intervalMonths,
                Value<String?> lastServiceDate = const Value.absent(),
                Value<double?> lastServiceOdo = const Value.absent(),
                required bool isActive,
                required DateTime createdAt,
                Value<bool> isSynced = const Value.absent(),
                required DateTime lastModified,
                Value<int> rowid = const Value.absent(),
              }) => MaintenanceSchedulesCompanion.insert(
                id: id,
                bikeId: bikeId,
                partName: partName,
                intervalKm: intervalKm,
                intervalMonths: intervalMonths,
                lastServiceDate: lastServiceDate,
                lastServiceOdo: lastServiceOdo,
                isActive: isActive,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$MaintenanceSchedulesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $MaintenanceSchedulesTable,
      MaintenanceSchedule,
      $$MaintenanceSchedulesTableFilterComposer,
      $$MaintenanceSchedulesTableOrderingComposer,
      $$MaintenanceSchedulesTableAnnotationComposer,
      $$MaintenanceSchedulesTableCreateCompanionBuilder,
      $$MaintenanceSchedulesTableUpdateCompanionBuilder,
      (
        MaintenanceSchedule,
        BaseReferences<
          _$AppDatabase,
          $MaintenanceSchedulesTable,
          MaintenanceSchedule
        >,
      ),
      MaintenanceSchedule,
      PrefetchHooks Function()
    >;
typedef $$ServiceHistoryTableCreateCompanionBuilder =
    ServiceHistoryCompanion Function({
      required String id,
      required String bikeId,
      required String scheduleId,
      required String serviceDate,
      required double serviceOdo,
      Value<double?> cost,
      Value<String?> notes,
      required DateTime createdAt,
      Value<bool> isSynced,
      required DateTime lastModified,
      Value<int> rowid,
    });
typedef $$ServiceHistoryTableUpdateCompanionBuilder =
    ServiceHistoryCompanion Function({
      Value<String> id,
      Value<String> bikeId,
      Value<String> scheduleId,
      Value<String> serviceDate,
      Value<double> serviceOdo,
      Value<double?> cost,
      Value<String?> notes,
      Value<DateTime> createdAt,
      Value<bool> isSynced,
      Value<DateTime> lastModified,
      Value<int> rowid,
    });

class $$ServiceHistoryTableFilterComposer
    extends Composer<_$AppDatabase, $ServiceHistoryTable> {
  $$ServiceHistoryTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get scheduleId => $composableBuilder(
    column: $table.scheduleId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serviceDate => $composableBuilder(
    column: $table.serviceDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get serviceOdo => $composableBuilder(
    column: $table.serviceOdo,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get cost => $composableBuilder(
    column: $table.cost,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ServiceHistoryTableOrderingComposer
    extends Composer<_$AppDatabase, $ServiceHistoryTable> {
  $$ServiceHistoryTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get scheduleId => $composableBuilder(
    column: $table.scheduleId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serviceDate => $composableBuilder(
    column: $table.serviceDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get serviceOdo => $composableBuilder(
    column: $table.serviceOdo,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get cost => $composableBuilder(
    column: $table.cost,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ServiceHistoryTableAnnotationComposer
    extends Composer<_$AppDatabase, $ServiceHistoryTable> {
  $$ServiceHistoryTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get bikeId =>
      $composableBuilder(column: $table.bikeId, builder: (column) => column);

  GeneratedColumn<String> get scheduleId => $composableBuilder(
    column: $table.scheduleId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get serviceDate => $composableBuilder(
    column: $table.serviceDate,
    builder: (column) => column,
  );

  GeneratedColumn<double> get serviceOdo => $composableBuilder(
    column: $table.serviceOdo,
    builder: (column) => column,
  );

  GeneratedColumn<double> get cost =>
      $composableBuilder(column: $table.cost, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => column,
  );
}

class $$ServiceHistoryTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ServiceHistoryTable,
          ServiceHistoryData,
          $$ServiceHistoryTableFilterComposer,
          $$ServiceHistoryTableOrderingComposer,
          $$ServiceHistoryTableAnnotationComposer,
          $$ServiceHistoryTableCreateCompanionBuilder,
          $$ServiceHistoryTableUpdateCompanionBuilder,
          (
            ServiceHistoryData,
            BaseReferences<
              _$AppDatabase,
              $ServiceHistoryTable,
              ServiceHistoryData
            >,
          ),
          ServiceHistoryData,
          PrefetchHooks Function()
        > {
  $$ServiceHistoryTableTableManager(
    _$AppDatabase db,
    $ServiceHistoryTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ServiceHistoryTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ServiceHistoryTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ServiceHistoryTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> bikeId = const Value.absent(),
                Value<String> scheduleId = const Value.absent(),
                Value<String> serviceDate = const Value.absent(),
                Value<double> serviceOdo = const Value.absent(),
                Value<double?> cost = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> lastModified = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ServiceHistoryCompanion(
                id: id,
                bikeId: bikeId,
                scheduleId: scheduleId,
                serviceDate: serviceDate,
                serviceOdo: serviceOdo,
                cost: cost,
                notes: notes,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String bikeId,
                required String scheduleId,
                required String serviceDate,
                required double serviceOdo,
                Value<double?> cost = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                required DateTime createdAt,
                Value<bool> isSynced = const Value.absent(),
                required DateTime lastModified,
                Value<int> rowid = const Value.absent(),
              }) => ServiceHistoryCompanion.insert(
                id: id,
                bikeId: bikeId,
                scheduleId: scheduleId,
                serviceDate: serviceDate,
                serviceOdo: serviceOdo,
                cost: cost,
                notes: notes,
                createdAt: createdAt,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ServiceHistoryTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ServiceHistoryTable,
      ServiceHistoryData,
      $$ServiceHistoryTableFilterComposer,
      $$ServiceHistoryTableOrderingComposer,
      $$ServiceHistoryTableAnnotationComposer,
      $$ServiceHistoryTableCreateCompanionBuilder,
      $$ServiceHistoryTableUpdateCompanionBuilder,
      (
        ServiceHistoryData,
        BaseReferences<_$AppDatabase, $ServiceHistoryTable, ServiceHistoryData>,
      ),
      ServiceHistoryData,
      PrefetchHooks Function()
    >;
typedef $$NotificationsTableCreateCompanionBuilder =
    NotificationsCompanion Function({
      required String id,
      required String userId,
      required String type,
      Value<String?> title,
      required String message,
      Value<DateTime?> readAt,
      Value<DateTime?> dismissedAt,
      required DateTime createdAt,
      Value<String?> bikeId,
      Value<String?> scheduleId,
      Value<String?> source,
      Value<String?> dedupeKey,
      Value<bool> isSynced,
      required DateTime lastModified,
      Value<int> rowid,
    });
typedef $$NotificationsTableUpdateCompanionBuilder =
    NotificationsCompanion Function({
      Value<String> id,
      Value<String> userId,
      Value<String> type,
      Value<String?> title,
      Value<String> message,
      Value<DateTime?> readAt,
      Value<DateTime?> dismissedAt,
      Value<DateTime> createdAt,
      Value<String?> bikeId,
      Value<String?> scheduleId,
      Value<String?> source,
      Value<String?> dedupeKey,
      Value<bool> isSynced,
      Value<DateTime> lastModified,
      Value<int> rowid,
    });

class $$NotificationsTableFilterComposer
    extends Composer<_$AppDatabase, $NotificationsTable> {
  $$NotificationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get readAt => $composableBuilder(
    column: $table.readAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get dismissedAt => $composableBuilder(
    column: $table.dismissedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get scheduleId => $composableBuilder(
    column: $table.scheduleId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get source => $composableBuilder(
    column: $table.source,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dedupeKey => $composableBuilder(
    column: $table.dedupeKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnFilters(column),
  );
}

class $$NotificationsTableOrderingComposer
    extends Composer<_$AppDatabase, $NotificationsTable> {
  $$NotificationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get readAt => $composableBuilder(
    column: $table.readAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get dismissedAt => $composableBuilder(
    column: $table.dismissedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bikeId => $composableBuilder(
    column: $table.bikeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get scheduleId => $composableBuilder(
    column: $table.scheduleId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get source => $composableBuilder(
    column: $table.source,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dedupeKey => $composableBuilder(
    column: $table.dedupeKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$NotificationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $NotificationsTable> {
  $$NotificationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get message =>
      $composableBuilder(column: $table.message, builder: (column) => column);

  GeneratedColumn<DateTime> get readAt =>
      $composableBuilder(column: $table.readAt, builder: (column) => column);

  GeneratedColumn<DateTime> get dismissedAt => $composableBuilder(
    column: $table.dismissedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<String> get bikeId =>
      $composableBuilder(column: $table.bikeId, builder: (column) => column);

  GeneratedColumn<String> get scheduleId => $composableBuilder(
    column: $table.scheduleId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get source =>
      $composableBuilder(column: $table.source, builder: (column) => column);

  GeneratedColumn<String> get dedupeKey =>
      $composableBuilder(column: $table.dedupeKey, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get lastModified => $composableBuilder(
    column: $table.lastModified,
    builder: (column) => column,
  );
}

class $$NotificationsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $NotificationsTable,
          Notification,
          $$NotificationsTableFilterComposer,
          $$NotificationsTableOrderingComposer,
          $$NotificationsTableAnnotationComposer,
          $$NotificationsTableCreateCompanionBuilder,
          $$NotificationsTableUpdateCompanionBuilder,
          (
            Notification,
            BaseReferences<_$AppDatabase, $NotificationsTable, Notification>,
          ),
          Notification,
          PrefetchHooks Function()
        > {
  $$NotificationsTableTableManager(_$AppDatabase db, $NotificationsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$NotificationsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$NotificationsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$NotificationsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> userId = const Value.absent(),
                Value<String> type = const Value.absent(),
                Value<String?> title = const Value.absent(),
                Value<String> message = const Value.absent(),
                Value<DateTime?> readAt = const Value.absent(),
                Value<DateTime?> dismissedAt = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<String?> bikeId = const Value.absent(),
                Value<String?> scheduleId = const Value.absent(),
                Value<String?> source = const Value.absent(),
                Value<String?> dedupeKey = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> lastModified = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => NotificationsCompanion(
                id: id,
                userId: userId,
                type: type,
                title: title,
                message: message,
                readAt: readAt,
                dismissedAt: dismissedAt,
                createdAt: createdAt,
                bikeId: bikeId,
                scheduleId: scheduleId,
                source: source,
                dedupeKey: dedupeKey,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String userId,
                required String type,
                Value<String?> title = const Value.absent(),
                required String message,
                Value<DateTime?> readAt = const Value.absent(),
                Value<DateTime?> dismissedAt = const Value.absent(),
                required DateTime createdAt,
                Value<String?> bikeId = const Value.absent(),
                Value<String?> scheduleId = const Value.absent(),
                Value<String?> source = const Value.absent(),
                Value<String?> dedupeKey = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                required DateTime lastModified,
                Value<int> rowid = const Value.absent(),
              }) => NotificationsCompanion.insert(
                id: id,
                userId: userId,
                type: type,
                title: title,
                message: message,
                readAt: readAt,
                dismissedAt: dismissedAt,
                createdAt: createdAt,
                bikeId: bikeId,
                scheduleId: scheduleId,
                source: source,
                dedupeKey: dedupeKey,
                isSynced: isSynced,
                lastModified: lastModified,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$NotificationsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $NotificationsTable,
      Notification,
      $$NotificationsTableFilterComposer,
      $$NotificationsTableOrderingComposer,
      $$NotificationsTableAnnotationComposer,
      $$NotificationsTableCreateCompanionBuilder,
      $$NotificationsTableUpdateCompanionBuilder,
      (
        Notification,
        BaseReferences<_$AppDatabase, $NotificationsTable, Notification>,
      ),
      Notification,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$BikesTableTableManager get bikes =>
      $$BikesTableTableManager(_db, _db.bikes);
  $$RidesTableTableManager get rides =>
      $$RidesTableTableManager(_db, _db.rides);
  $$FuelLogsTableTableManager get fuelLogs =>
      $$FuelLogsTableTableManager(_db, _db.fuelLogs);
  $$MaintenanceLogsTableTableManager get maintenanceLogs =>
      $$MaintenanceLogsTableTableManager(_db, _db.maintenanceLogs);
  $$MaintenanceSchedulesTableTableManager get maintenanceSchedules =>
      $$MaintenanceSchedulesTableTableManager(_db, _db.maintenanceSchedules);
  $$ServiceHistoryTableTableManager get serviceHistory =>
      $$ServiceHistoryTableTableManager(_db, _db.serviceHistory);
  $$NotificationsTableTableManager get notifications =>
      $$NotificationsTableTableManager(_db, _db.notifications);
}
