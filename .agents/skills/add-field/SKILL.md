# Add Field Skill

Guide for adding new fields/columns to scan results.

## Overview

When prototyping new fields for scan results, follow this workflow to test locally before exposing in production API.

## Steps

### 1. Add Property to Entity

Edit the appropriate entity (typically `entities/core-result.entity.ts`):

```typescript
import { Exclude } from 'class-transformer';

export class CoreResult {
  // ... existing fields

  @Column({ type: 'text', nullable: true })
  @Exclude()  // Hide from API during development
  myNewField: string;
}
```

**TypeORM Decorators:**
- `@Column({ type: 'text', nullable: true })` - Database column definition
- `@Exclude()` - Hides field from API responses (remove when ready for production)

**Common column types:**
- `text` - Variable length string
- `boolean` - True/false
- `integer` - Whole numbers
- `jsonb` - JSON data
- `timestamp` - Date/time

### 2. Test Locally with Snapshot

Generate a snapshot with the CLI to see your new column in CSV output:

```bash
npm run snapshot
```

The new column will appear in the exported CSV file, allowing you to verify:
- Column is created correctly
- Data is being populated as expected
- CSV formatting is correct

**Note:** Snapshot testing is the primary way to validate new fields locally, since Minio is not fully configured for local dev.

### 3. Add to Snapshot Column Order

Edit the `static snapshot column order` in the core-result entity:

```typescript
static snapshotColumns = [
  'id',
  'url',
  // ... existing columns
  'myNewField',  // Add your new field in desired position
];
```

This controls the column order in exported CSV snapshots.

### 4. Update Snapshot Tests

If you changed column order or structure, update tests in:
- `libs/snapshot/src/snapshot.service.spec.ts`

Run tests:
```bash
npm run test:unit
```

### 5. Expose in API (When Ready)

When the field is ready for production:

1. **Remove** the `@Exclude()` decorator from the entity property
2. Field will now appear in API responses at `/api` endpoints
3. Swagger docs will automatically update at `/api-json`

## Migration Notes

- **Local dev**: TypeORM automatically handles migrations via entity decorators when starting the API
- **Production**: Database schema changes require careful coordination with deployment

## Testing Checklist

- [ ] Column appears in database
- [ ] Data populates correctly from scan
- [ ] Snapshot exports with new column
- [ ] Column order is correct in CSV
- [ ] Unit tests pass
- [ ] API endpoint returns field (after removing @Exclude)
- [ ] Swagger docs show new field

## Example: Adding Boolean Field

```typescript
@Column({ type: 'boolean', nullable: true, default: false })
@Exclude()
hasMyFeature: boolean;
```

## Example: Adding JSON Field

```typescript
@Column({ type: 'jsonb', nullable: true })
@Exclude()
myComplexData: Record<string, any>;
```

## Important Notes

- Never commit fields with sensitive data (secrets, PII)
- Keep nullable: true during development to avoid breaking existing data
- Document what the field represents in comments
- Consider API consumers when changing field names or types
