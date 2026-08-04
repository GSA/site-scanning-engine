---
name: add-field
description: Guide for adding new fields/columns to scan results, including entity decorators, snapshot integration, and API exposure.
---

# Add Field Skill

Guide for adding new fields/columns to scan results.

## Overview

When prototyping new fields for scan results, follow this workflow to test locally before exposing in production API.

## Core Concepts

### Two-Gate Model

A field reaches CSV/JSON snapshots only if it passes **both gates**:

1. **Serialization gate** (a): Survives `classToPlain` in `Website.serialized()` (`entities/website.entity.ts:75`). Controlled by `@Exclude()` / `@Expose()` decorators.
2. **Column order gate** (b): Appears in `CoreResult.snapshotColumnOrder` (`entities/core-result.entity.ts:591`).

For the API path, only gate (a) applies (via `apps/api/src/website/website-serializer.interceptor.ts`).

**Failure modes:**
- Missing from (b) → column absent from snapshots entirely
- In (b) but excluded by (a) → column present in snapshots but always empty
- In (a) but missing from (b) → appears in API but not snapshots

### Decorator Reference

- **`@Column({ type: 'text', nullable: true })`** — Database column definition (TypeORM)
- **`@Expose({ name: 'snake_case_name' })`** — **Mandatory.** Maps TS property to public name
- **`@Exclude()`** — Hides field from API responses and snapshots (use during development)
- **`@Exclude({ toPlainOnly: true })`** — Hides field on output only, accepts on input
- **`@Transform(({ value }) => ...)`** — Converts value during serialization (e.g., split on comma for arrays)

**Common column types:**
- `text` — Variable length string
- `boolean` — True/false
- `integer` — Whole numbers
- `jsonb` — JSON data
- `timestamp` — Date/time

## Steps

### 1. Add Property to Entity

Edit the appropriate entity (typically `entities/core-result.entity.ts`):

```typescript
import { Exclude, Expose, Transform } from 'class-transformer';

export class CoreResult {
  // ... existing fields

  @Column({ type: 'text', nullable: true })
  @Expose({ name: 'my_new_field' })  // MANDATORY - public snake_case name
  @Exclude()  // Hide from API/snapshots during development
  myNewField: string;
}
```

For **comma-joined list fields** that should emit as arrays:

```typescript
@Column({ nullable: true })
@Expose({ name: 'my_field_list' })
@Exclude()
@Transform(({ value }: { value: string }) => {
  if (value) {
    return value.split(',');
  } else {
    return null;
  }
})
myFieldList?: string;
```

### 2. Wire Through Scan Data (if scan-sourced)

If the field comes from a scan (not just metadata), wire it through the scan pipeline:

1. **Add to type** in `entities/scan-data.entity.ts`:
   ```typescript
   export type UswdsScan = {
     // ... existing fields
     myNewField: string;
   };
   ```

2. **Populate in scan** under `libs/core-scanner/src/scans/`:
   ```typescript
   return {
     // ... existing fields
     myNewField: pageResults.myData,
   };
   ```

3. **Assign in service** (`libs/database/src/core-results/core-result.service.ts`):
   ```typescript
   coreResult.myNewField = result.myScan.myNewField;
   ```
   Include `null` fallback branches (search for existing field assignments to find all three locations).

### 3. Add to Snapshot Column Order

Edit `static snapshotColumnOrder` in `entities/core-result.entity.ts` (line ~591):

```typescript
static snapshotColumnOrder = [
  // ... existing columns
  'my_new_field',  // Add snake_case @Expose name in desired CSV position
];
```

**Important:** Use the **snake_case `@Expose` name**, not the TS property name.

### 4. Preview Locally

Generate a preview CSV to verify the column and data:

```bash
POSTGRES_USER=... POSTGRES_PASSWORD=... DATABASE_SSL=false \
  npx ts-node scripts/export-snapshot.ts --output /tmp/preview.csv
```

Check:
- Column appears in CSV header
- Data populates correctly from scan
- CSV formatting is correct (arrays JSON-stringified)

**Note:** `npm run snapshot` runs the real `SnapshotService` which uploads to S3/Minio. Minio is not configured for local dev, so use `scripts/export-snapshot.ts` for preview instead.

**Preview a still-`@Exclude()`-ed field:** See `scripts/export-snapshot.ts:27-41` for the recipe to manually insert a column without exposing it publicly.

### 5. Update Tests

#### a. Entity transform test (for comma-joined/array fields)

Add a case to `entities/core-result.entity.spec.ts`:

```typescript
it('should return an array for my_field_list', () => {
  const plainCoreResult = { my_field_list: 'foo,bar' };
  const classedCoreResult = plainToClass(CoreResult, plainCoreResult);
  expect(classedCoreResult.myFieldList).toEqual(['foo', 'bar']);
});
```

#### b. JSON serializer golden string

`libs/snapshot/src/serializers/json-serializer.spec.ts:14` has a hardcoded expected JSON string. Run the test to get the updated output, then copy it:

```bash
npx jest --testNamePattern="serializes an array" \
  libs/snapshot/src/serializers/json-serializer.spec.ts
```

Update the `expectedResult` string with the actual output (the new field will appear as `"my_new_field":null`).

Run all tests:
```bash
npm run test:unit
```

### 6. Document in Swagger DTO

When the field is ready for production, add it to `apps/api/src/website/website-api-result.dto.ts`:

```typescript
/**
 * `my_new_field` is a description of what this field represents.
 *
 * @example "example value"
 */
my_new_field: string;
```

**Important:** This file is **documentation only** (used by `@ApiOkResponse` for `/api-json` Swagger docs). It does **not** control runtime serialization — that comes from the entity decorators. But `nest-cli.json:23` enables `introspectComments`, so this JSDoc is what appears in Swagger. Omitting it leaves the field undocumented.

For array-typed fields, use `string[]` or `number[]`:
```typescript
my_field_list: string[];
```

Place it near related fields for logical grouping.

### 7. Expose in API (When Ready)

When the field is ready for production:

1. **Remove** the `@Exclude()` decorator from the entity property
2. Field will now appear in API responses at `/api/websites/*` endpoints
3. Swagger docs will show the field at `/api-json` (from the DTO JSDoc)
4. CSV/JSON snapshots will include the column (from `snapshotColumnOrder`)

## Migration Notes

- **Local dev**: TypeORM automatically handles schema changes via `synchronize: true` in `libs/database/src/database.module.ts:22` when the API starts
- **Production**: Database schema changes require careful coordination with deployment

## Testing Checklist

- [ ] Column appears in database (check via `psql` or API startup logs)
- [ ] Data populates correctly from scan (inspect via API endpoint)
- [ ] Preview CSV exports with new column (`scripts/export-snapshot.ts`)
- [ ] Column order is correct in CSV
- [ ] Entity transform test added (if array field)
- [ ] JSON serializer golden string updated
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Swagger DTO entry added with JSDoc
- [ ] API endpoint returns field (after removing `@Exclude()`)
- [ ] Swagger docs show new field at `/api-json`

## Example: Adding Boolean Field

```typescript
@Column({ type: 'boolean', nullable: true, default: false })
@Expose({ name: 'has_my_feature' })
@Exclude()  // Remove when ready for production
hasMyFeature: boolean;
```

## Example: Adding Array Field (comma-joined in DB)

```typescript
@Column({ nullable: true })
@Expose({ name: 'my_items_list' })
@Exclude()
@Transform(({ value }: { value: string }) => {
  if (value) {
    return value.split(',');
  } else {
    return null;
  }
})
myItems?: string;
```

Swagger DTO entry:
```typescript
/**
 * `my_items_list` is the list of items detected.
 *
 * @example ["item-a", "item-b", "item-c"]
 */
my_items_list: string[];
```

## Example: Adding JSON Field

```typescript
@Column({ type: 'jsonb', nullable: true })
@Expose({ name: 'my_complex_data' })
@Exclude()
myComplexData: Record<string, any>;
```

## Important Notes

- Never commit fields with sensitive data (secrets, PII)
- Keep `nullable: true` during development to avoid breaking existing data
- Document what the field represents in code comments
- Consider API consumers when changing field names or types
- The `@Expose` name becomes the public API/CSV field name — choose carefully
- Use bare `@Exclude()` (not `{ toPlainOnly: true }`) for fields held back during development
