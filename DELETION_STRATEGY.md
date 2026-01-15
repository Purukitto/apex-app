# Apex Data Deletion Strategy

## Overview

This document outlines the strategy for handling data deletions across the Apex application, ensuring data integrity, user experience, and graceful handling of cascading relationships.

## Entity Relationships

### Entity Hierarchy

```
auth.users (Supabase Auth)
  └── bikes (user_id FK)
       ├── rides (bike_id FK, user_id FK)
       ├── maintenance_logs (bike_id FK)
       └── fuel_logs (bike_id FK)
```

### Entity Details

| Entity | Parent | Children | user_id Column | Critical Data |
|--------|--------|----------|----------------|---------------|
| `bikes` | `auth.users` | `rides`, `maintenance_logs`, `fuel_logs` | ✅ Yes | Odometer, specs, image |
| `rides` | `bikes` | None | ✅ Yes | GPS paths, telemetry, distance |
| `maintenance_logs` | `bikes` | None | ❌ No (RLS via bikes) | Service history, receipts |
| `fuel_logs` | `bikes` | None | ❌ No (RLS via bikes) | Fuel economy data |

## Deletion Strategies

### Strategy Types

1. **RESTRICT** - Prevent deletion if children exist (user must delete children first)
2. **CASCADE** - Automatically delete all children when parent is deleted
3. **SET NULL** - Set foreign key to NULL (not applicable - FKs are required)
4. **SOFT DELETE** - Mark as deleted but keep data (requires schema changes)

### Recommended Strategy by Entity

#### 1. Bikes (Parent Entity)

**Strategy: RESTRICT with User Warning**

**Rationale:**
- Bikes are the central entity - deleting one affects all related data
- Users should be explicitly aware of data loss
- Provides opportunity to export/backup data before deletion

**Implementation:**
- **Check for related data** before allowing deletion:
  - Count of rides
  - Count of maintenance logs
  - Count of fuel logs
- **Show detailed warning modal** with:
  - Summary of related data (e.g., "This bike has 15 rides, 3 maintenance logs, and 8 fuel logs")
  - Option to export data before deletion
  - Clear confirmation required
- **Block deletion** if any rides exist (critical data)
- **Allow deletion** if only maintenance_logs or fuel_logs exist (less critical, but warn user)

**User Experience:**
```
Warning Modal:
┌─────────────────────────────────────────┐
│ Delete Bike: "My Ninja 650"?            │
├─────────────────────────────────────────┤
│ This will permanently delete:           │
│ • 15 rides (including GPS paths)       │
│ • 3 maintenance logs                    │
│ • 8 fuel logs                           │
│                                         │
│ This action cannot be undone.           │
│                                         │
│ [Export Data] [Cancel] [Delete Anyway]  │
└─────────────────────────────────────────┘
```

**Code Pattern:**
```typescript
// Check all related data
const [ridesCount, maintenanceCount, fuelCount] = await Promise.all([
  countRides(bikeId),
  countMaintenanceLogs(bikeId),
  countFuelLogs(bikeId)
]);

if (ridesCount > 0) {
  throw new Error(
    `Cannot delete bike: It has ${ridesCount} ride(s). ` +
    `Please delete rides first or use the bulk delete option.`
  );
}

// Warn about maintenance/fuel logs but allow deletion
if (maintenanceCount > 0 || fuelCount > 0) {
  // Show warning but proceed if user confirms
}
```

#### 2. Rides (Child Entity)

**Strategy: CASCADE (when bike deleted) / SIMPLE DELETE (standalone)**

**Rationale:**
- Rides are dependent on bikes - if bike is deleted, rides should be deleted
- Standalone ride deletion is straightforward (no children)
- GPS paths and telemetry are valuable but tied to bike

**Implementation:**
- **Standalone deletion**: Simple delete (current implementation is correct)
- **Cascade from bike**: When bike is deleted, all rides are deleted automatically
- **Database constraint**: Use `ON DELETE CASCADE` on `bike_id` FK in `rides` table

**User Experience:**
- Simple confirmation for standalone deletion
- No special handling needed (no children)

#### 3. Maintenance Logs (Child Entity)

**Strategy: CASCADE (when bike deleted) / SIMPLE DELETE (standalone)**

**Rationale:**
- Maintenance logs are historical records tied to a specific bike
- If bike is deleted, maintenance history loses context
- Standalone deletion is straightforward

**Implementation:**
- **Standalone deletion**: Simple delete (current implementation is correct)
- **Cascade from bike**: When bike is deleted, all maintenance logs are deleted
- **Database constraint**: Use `ON DELETE CASCADE` on `bike_id` FK in `maintenance_logs` table

**User Experience:**
- Simple confirmation for standalone deletion
- No special handling needed (no children)

#### 4. Fuel Logs (Child Entity)

**Strategy: CASCADE (when bike deleted) / SIMPLE DELETE (standalone)**

**Rationale:**
- Fuel logs are tied to a specific bike for mileage calculations
- If bike is deleted, fuel logs lose context
- Standalone deletion is straightforward (recalculate bike stats after)

**Implementation:**
- **Standalone deletion**: Simple delete + recalculate bike stats (current implementation is correct)
- **Cascade from bike**: When bike is deleted, all fuel logs are deleted
- **Database constraint**: Use `ON DELETE CASCADE` on `bike_id` FK in `fuel_logs` table
- **After deletion**: Recalculate `avg_mileage` and `last_fuel_price` on bike (already implemented)

**User Experience:**
- Simple confirmation for standalone deletion
- No special handling needed (no children)

## Implementation Plan

### Phase 1: Database Constraints (Recommended)

**Add CASCADE constraints to foreign keys:**

```sql
-- Update rides table
ALTER TABLE rides
DROP CONSTRAINT IF EXISTS rides_bike_id_fkey,
ADD CONSTRAINT rides_bike_id_fkey
  FOREIGN KEY (bike_id)
  REFERENCES bikes(id)
  ON DELETE CASCADE;

-- Update maintenance_logs table
ALTER TABLE maintenance_logs
DROP CONSTRAINT IF EXISTS maintenance_logs_bike_id_fkey,
ADD CONSTRAINT maintenance_logs_bike_id_fkey
  FOREIGN KEY (bike_id)
  REFERENCES bikes(id)
  ON DELETE CASCADE;

-- Update fuel_logs table
ALTER TABLE fuel_logs
DROP CONSTRAINT IF EXISTS fuel_logs_bike_id_fkey,
ADD CONSTRAINT fuel_logs_bike_id_fkey
  FOREIGN KEY (bike_id)
  REFERENCES bikes(id)
  ON DELETE CASCADE;
```

**Benefits:**
- Database-level integrity enforcement
- Automatic cleanup when bike is deleted
- Prevents orphaned records
- More efficient than application-level cascading

**Considerations:**
- Requires database migration
- Test thoroughly before deploying
- Consider backup/export options before implementing

### Phase 2: Application-Level Improvements

#### 2.1 Enhanced Bike Deletion

**Current Issues:**
- Only checks for rides, not maintenance_logs or fuel_logs
- Inconsistent error messages
- No data export option

**Improvements:**

1. **Comprehensive Data Check:**
```typescript
// Get all related data counts
const [ridesResult, maintenanceResult, fuelResult] = await Promise.all([
  supabase.from('rides').select('id', { count: 'exact', head: true }).eq('bike_id', id),
  supabase.from('maintenance_logs').select('id', { count: 'exact', head: true }).eq('bike_id', id),
  supabase.from('fuel_logs').select('id', { count: 'exact', head: true }).eq('bike_id', id),
]);

const ridesCount = ridesResult.count || 0;
const maintenanceCount = maintenanceResult.count || 0;
const fuelCount = fuelResult.count || 0;
```

2. **Enhanced Warning Modal:**
   - Show counts for all related data
   - Provide export option (future feature)
   - Clear messaging about data loss

3. **Deletion Rules:**
   - **Block** if `ridesCount > 0` (critical data)
   - **Warn but allow** if only `maintenanceCount > 0` or `fuelCount > 0`
   - **Allow** if no related data

#### 2.2 Data Export (Future Enhancement)

**Feature: Export Bike Data Before Deletion**

```typescript
async function exportBikeData(bikeId: string) {
  const [bike, rides, maintenanceLogs, fuelLogs] = await Promise.all([
    fetchBike(bikeId),
    fetchRides(bikeId),
    fetchMaintenanceLogs(bikeId),
    fetchFuelLogs(bikeId),
  ]);

  return {
    bike,
    rides,
    maintenanceLogs,
    fuelLogs,
    exportedAt: new Date().toISOString(),
  };
}
```

**Export Formats:**
- JSON (for backup/restore)
- CSV (for spreadsheet analysis)
- GPX (for ride routes)

### Phase 3: User Experience Enhancements

#### 3.1 Confirmation Modals

**Bike Deletion Modal:**
```typescript
<ConfirmModal
  variant="danger"
  title="Delete Bike"
  message={
    <>
      Are you sure you want to delete <strong>{bike.nick_name || `${bike.make} ${bike.model}`}</strong>?
      {relatedDataCounts.rides > 0 && (
        <div className="mt-4 p-3 bg-apex-red/10 border border-apex-red/20 rounded">
          <p className="text-apex-red font-semibold">
            ⚠️ This bike has {relatedDataCounts.rides} ride(s) that will be permanently deleted.
          </p>
        </div>
      )}
      {(relatedDataCounts.maintenance > 0 || relatedDataCounts.fuel > 0) && (
        <div className="mt-2 text-sm text-apex-white/60">
          Also includes {relatedDataCounts.maintenance} maintenance log(s) and {relatedDataCounts.fuel} fuel log(s).
        </div>
      )}
      <p className="mt-4 text-apex-white/80">This action cannot be undone.</p>
    </>
  }
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>
```

#### 3.2 Bulk Operations (Future)

**Bulk Delete Rides:**
- Allow users to delete multiple rides at once
- Useful when cleaning up test data or old records
- Show progress indicator for large deletions

**Bulk Delete with Bike:**
- Option to delete bike and all related data in one operation
- Show comprehensive summary before confirmation

## Error Handling

### Error Scenarios

1. **Foreign Key Constraint Violation (23503)**
   - **Cause**: Attempting to delete parent with children (if CASCADE not set)
   - **Handling**: Show user-friendly message with counts of related data
   - **Message**: "Cannot delete bike: It has X ride(s). Please delete rides first."

2. **Permission Denied (PGRST301)**
   - **Cause**: RLS policy blocking deletion
   - **Handling**: Log error, show generic permission message
   - **Message**: "Permission denied. Please try again or contact support."

3. **Network/Timeout Errors**
   - **Cause**: Connection issues during deletion
   - **Handling**: Retry mechanism with exponential backoff
   - **Message**: "Connection error. Please check your internet and try again."

4. **Partial Deletion Failure**
   - **Cause**: Some related records fail to delete (if manual cascade)
   - **Handling**: Rollback entire operation, show error
   - **Message**: "Deletion failed. No data was deleted. Please try again."

### Error Recovery

- **Transaction Support**: Use database transactions for atomic operations
- **Rollback**: If any step fails, rollback all changes
- **User Feedback**: Clear error messages with actionable steps

## Testing Strategy

### Test Cases

1. **Bike Deletion:**
   - ✅ Delete bike with no related data
   - ✅ Delete bike with only maintenance logs
   - ✅ Delete bike with only fuel logs
   - ✅ Delete bike with only rides (should block)
   - ✅ Delete bike with all related data (should cascade)
   - ✅ Delete bike with permission error (should handle gracefully)

2. **Ride Deletion:**
   - ✅ Delete ride standalone
   - ✅ Verify bike still exists after ride deletion

3. **Maintenance Log Deletion:**
   - ✅ Delete maintenance log standalone
   - ✅ Verify bike still exists after deletion

4. **Fuel Log Deletion:**
   - ✅ Delete fuel log standalone
   - ✅ Verify bike stats recalculated correctly
   - ✅ Verify bike still exists after deletion

5. **Cascade Behavior:**
   - ✅ Delete bike with rides (verify rides deleted)
   - ✅ Delete bike with maintenance logs (verify logs deleted)
   - ✅ Delete bike with fuel logs (verify logs deleted)
   - ✅ Delete bike with all related data (verify all deleted)

## Migration Path

### Step 1: Update Application Logic (No DB Changes)

1. Enhance `useBikes.deleteBike` to check all related data
2. Update confirmation modal to show all related data counts
3. Improve error messages
4. Add comprehensive logging

### Step 2: Add Database Constraints (Requires Migration)

1. Create migration file
2. Add CASCADE constraints to foreign keys
3. Test in development environment
4. Deploy to production with backup plan

### Step 3: Simplify Application Logic (After DB Constraints)

1. Remove manual cascade logic (database handles it)
2. Simplify deletion checks (only need to warn user, not prevent)
3. Update error handling for new constraint behavior

## Best Practices

### Do's ✅

- **Always check for related data** before deletion
- **Show clear warnings** about data loss
- **Use database constraints** for data integrity
- **Log all deletion operations** for audit trail
- **Provide export options** for critical data
- **Use transactions** for multi-step deletions
- **Handle errors gracefully** with user-friendly messages

### Don'ts ❌

- **Don't silently delete** related data without warning
- **Don't bypass RLS** policies
- **Don't delete without confirmation** for critical entities
- **Don't expose technical errors** to users
- **Don't allow orphaned records** (use CASCADE or RESTRICT)
- **Don't skip permission checks** before deletion
- **Don't delete without logging** the operation

## Future Considerations

### Soft Delete

**Option**: Add `deleted_at` column to all tables

**Benefits:**
- Ability to restore deleted data
- Audit trail of deletions
- Safer for production data

**Implementation:**
- Add `deleted_at TIMESTAMPTZ NULL` to all tables
- Update queries to filter `WHERE deleted_at IS NULL`
- Create "Trash" view for deleted items
- Add restore functionality

### Data Retention Policies

**Option**: Automatically delete old data after X days

**Use Cases:**
- Delete test rides after 30 days
- Archive old maintenance logs after 2 years
- Clean up incomplete rides after 7 days

### Export/Backup Features

**Option**: Allow users to export data before deletion

**Formats:**
- JSON (full backup)
- CSV (spreadsheet analysis)
- GPX (ride routes for other apps)

## Summary

### Current State
- ✅ Basic deletion logic exists
- ⚠️ Inconsistent handling (blocks rides but not maintenance/fuel logs)
- ⚠️ No comprehensive data checking
- ⚠️ Limited user warnings

### Recommended State
- ✅ Database-level CASCADE constraints
- ✅ Comprehensive data checking before deletion
- ✅ Enhanced warning modals with data counts
- ✅ Clear error handling and user feedback
- ✅ Export options for critical data
- ✅ Comprehensive logging and audit trail

### Priority Actions
1. **High**: Enhance bike deletion to check all related data
2. **High**: Improve warning modals with data counts
3. **Medium**: Add database CASCADE constraints
4. **Medium**: Add comprehensive error handling
5. **Low**: Add data export functionality
6. **Low**: Consider soft delete implementation
