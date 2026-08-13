---
name: add-field
description: Guide for adding new fields/columns to scan results, including entity decorators, snapshot integration, and API exposure.
---

# Add Field Skill

Guide for adding new fields/columns to scan results.

## Overview

When prototyping new fields for scan results, follow this workflow to test locally before exposing in production API.

## CRITICAL: Two-Phase Release Sequencing

**Do NOT define a field and expose it publicly in the same change.** Fields must
be published to the public API/snapshots only *after* a real production scan has
collected data for them and that data has been verified. Publishing early ships
empty columns to public consumers.

The correct sequence spans **two separate PRs / deployments**:

| Phase | What you do | What ships | Gate before next phase |
|-------|-------------|------------|------------------------|
| **Phase 1 — Define & Collect** | Add entity property + `@Column` + `@Expose`, keep bare `@Exclude()`. Wire through scan pipeline. Update DB schema. | Column exists in DB and is populated by scans, but is **hidden** from API and snapshots. | A production scan cycle runs and populates the column. **Verify the data is non-empty and correct** in the deployed environment. |
| **Phase 2 — Publish** | Remove `@Exclude()`, add to `snapshotColumnOrder`, add Swagger DTO entry. | Column becomes visible in API + CSV/JSON snapshots. | — |

**Never merge Phase 2 until Phase 1 data is verified in the deployed
environment.** Removing `@Exclude()` or adding the column to `snapshotColumnOrder`
before a scan has populated it publishes empty columns to public data
consumers — the exact failure this skill exists to prevent.

> This maps to the project pattern: **define fields + update DB schema → let
> scan run to collect information → verify before making them public → publish
> fields.**

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

> **Phase 1 (Define & Collect) = Steps 1–2, 4–5.** Keep `@Exclude()` on the
> field, do NOT add it to `snapshotColumnOrder`, and do NOT add the Swagger DTO
> entry yet. Deploy, let a scan run, and verify the data.
>
> **Phase 2 (Publish) = Steps 3, 6, 7 — only after Phase 1 data is verified in
> the deployed environment.**

### 1. Add Property to Entity *(Phase 1)*

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

### 2. Wire Through Scan Data (if scan-sourced) *(Phase 1)*

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

### 3. Add to Snapshot Column Order *(Phase 2 — publish only)*

> **Do this only in Phase 2**, after a production scan has populated the column
> and you have verified the data. Adding a field to `snapshotColumnOrder` while
> it is still empty publishes an empty column to public snapshots.

Edit `static snapshotColumnOrder` in `entities/core-result.entity.ts` (line ~591):

```typescript
static snapshotColumnOrder = [
  // ... existing columns
  'my_new_field',  // Add snake_case @Expose name in desired CSV position
];
```

**Important:** Use the **snake_case `@Expose` name**, not the TS property name.

### 4. Preview Locally *(Phase 1)*

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

### 5. Update Tests *(Phase 1)*

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

---

### GATE: Deploy Phase 1, Collect, and Verify

**Stop here for Phase 1.** Before doing any of the remaining steps:

1. Merge and deploy the Phase 1 change (field defined + wired, still `@Exclude()`-ed).
2. Let a production scan cycle run so the new column is populated.
3. **Verify the collected data** in the deployed environment — confirm the column
   is non-empty and the values are correct (query the DB directly, or preview a
   snapshot). Do **not** rely on local mocks.

Only once the data is verified do you proceed to Phase 2 (Steps 3, 6, 7) in a
**separate PR**. Skipping this gate publishes empty columns to public consumers.

---

### 6. Document in Swagger DTO *(Phase 2 — publish only)*

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

### 7. Expose in API (When Ready) *(Phase 2 — publish only)*

Only after Phase 1 data is verified in the deployed environment:

1. **Remove** the `@Exclude()` decorator from the entity property
2. Ensure the field is in `snapshotColumnOrder` (Step 3)
3. Field will now appear in API responses at `/api/websites/*` endpoints
4. Swagger docs will show the field at `/api-json` (from the DTO JSDoc)
5. CSV/JSON snapshots will include the column (from `snapshotColumnOrder`)

## Migration Notes

- **Local dev**: TypeORM automatically handles schema changes via `synchronize: true` in `libs/database/src/database.module.ts:22` when the API starts
- **Production**: Database schema changes require careful coordination with deployment

## Testing Checklist

**Phase 1 — Define & Collect (keep `@Exclude()`, not in `snapshotColumnOrder`, no DTO entry):**
- [ ] Column appears in database (check via `psql` or API startup logs)
- [ ] Entity transform test added (if array field)
- [ ] JSON serializer golden string updated
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Deployed; a production scan has run
- [ ] **Data verified non-empty and correct in deployed environment**

**Phase 2 — Publish (separate PR, only after Phase 1 data verified):**
- [ ] `@Exclude()` removed from entity property
- [ ] Field added to `snapshotColumnOrder` in correct position
- [ ] Preview CSV exports with new column and correct order (`scripts/export-snapshot.ts`)
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

- **Never publish a field in the same change that defines it.** Define + collect
  (Phase 1) and publish (Phase 2) are separate PRs, with a verified production
  scan in between. Publishing early ships empty columns to public consumers.
- Never commit fields with sensitive data (secrets, PII)
- Keep `nullable: true` during development to avoid breaking existing data
- Document what the field represents in code comments
- Consider API consumers when changing field names or types
- The `@Expose` name becomes the public API/CSV field name — choose carefully
- Use bare `@Exclude()` (not `{ toPlainOnly: true }`) for fields held back during development
