---
name: troubleshoot
description: Runbook for diagnosing and resolving production issues with the Site Scanning Engine on Cloud.gov.
---

# Troubleshoot Skill

Runbook for diagnosing and resolving production issues in the Site Scanning Engine deployed on Cloud.gov (Cloud Foundry).

## Prerequisites

- Cloud Foundry CLI (`cf`) installed
- Logged in to Cloud.gov: `cf login -a api.fr.cloud.gov --sso`
- Targeting correct space: `cf target -o gsatts-sitescan -s prod`
- Access to user's helper scripts (e.g., `~/bin/download-current-queue.sh`)

## Diagnostic Decision Tree

Use this flowchart to diagnose common issues:

### API Returns Errors (404, 500, timeout)

**Step 1: Check app status**
```bash
cf apps
```

**Outcomes:**
- **App is crashed/stopped** → Restart: `cf restart site-scanner-api`
- **App is running** → Proceed to step 2

**Step 2: Check recent logs**
```bash
cf logs site-scanner-api --recent
```

**Common patterns:**
- **Connection errors to postgres** → Check database service (see Database Health section)
- **Memory errors / OOM** → Scale memory: `cf scale site-scanner-api -m 2G`
- **No obvious errors** → Proceed to step 3

**Step 3: Check database health**

See Database Health section below.

**Outcomes:**
- **Website count is 0 or very low (< 100)** → Ingest failure (see Recovery Procedure)
- **Website count is normal (~31,500)** → Check for specific query issues or data corruption

### Scans Not Completing

**Step 1: Check consumer status**
```bash
cf apps
```

Look for `site-scanner-consumer` — should show 7 instances, all "running".

**Outcomes:**
- **Instances crashed** → Restart: `cf restart site-scanner-consumer`
- **Instances running** → Proceed to step 2

**Step 2: Check Redis queue depth**

See Queue Inspection section below.

**Outcomes:**
- **Queue is empty and results are stale** → Enqueue was never triggered (run manually)
- **Queue is full/growing** → Workers may be stuck (check logs, consider restart)

**Step 3: Check consumer logs**
```bash
cf logs site-scanner-consumer --recent
```

**Common patterns:**
- **Puppeteer timeout errors** → A specific site is causing workers to hang
- **Memory errors** → Workers running out of memory (scale: `cf scale site-scanner-consumer -m 4G`)
- **Redis connection errors** → Redis service may be down (check `cf services`)

### Data is Stale or Missing

**Step 1: Verify ingest ran**
```bash
cf tasks site-scanner-consumer | head -20
```

Look for recent tasks named `github-action-ingest-*` or similar.

**Outcomes:**
- **No recent ingest task** → Workflow didn't run (check GitHub Actions)
- **Task shows FAILED** → Check logs for error
- **Task shows SUCCEEDED** → Proceed to step 2 (may be silent failure)
- **Task shows RUNNING** → Still in progress (wait or check logs for hang)

**Step 2: Check ingest logs**
```bash
cf logs site-scanner-consumer --recent | grep -i "ingest\|total number of websites"
```

**Indicators of success:**
- `total number of websites following ingest: ~31500`

**Indicators of failure:**
- `column header mismatch`
- `Unexpected Error`
- No "total number of websites" log message

**Step 3: Check website count in database**

See Database Health section. If count is low despite SUCCEEDED task status, this is a silent failure (see Common Failure Modes).

## Cloud Foundry Commands

### Check Application Status

```bash
cf apps
```

**Expected output:**
- `site-scanner-api` — started, 1 instance
- `site-scanner-consumer` — started, 7 instances (production)

### Check Recent Task Runs

```bash
cf tasks site-scanner-consumer
```

**Look for:**
- Task names: `github-action-ingest-*`, `github-action-enqueue-scans-*`, `github-action-snapshot-*`
- STATE column: `SUCCEEDED`, `FAILED`, `RUNNING`

**Interpreting task states:**
- `SUCCEEDED` — Task completed (but may have internal errors — check logs!)
- `FAILED` — Task crashed or was killed by Cloud Foundry
- `RUNNING` — Task is currently executing

### View Recent Logs

```bash
cf logs site-scanner-api --recent
cf logs site-scanner-consumer --recent
```

**Useful filters:**
```bash
# Show only errors
cf logs site-scanner-api --recent | grep -i error

# Show ingest activity
cf logs site-scanner-consumer --recent | grep -i ingest

# Show task output
cf logs site-scanner-consumer --recent | grep "APP/TASK"
```

### Stream Live Logs

```bash
cf logs site-scanner-consumer
```

**Use case:** Monitor a task in real-time while it runs.

**Stop streaming:** Press Ctrl+C

### Check Services

```bash
cf services
```

**Expected services:**
- `scanner-postgres-02` (PostgreSQL database)
- `scanner-message-queue` (Redis)
- S3 bucket service

**Service status:**
- All should show "create succeeded" or "update succeeded"
- If "create in progress", wait for completion
- If "create failed", investigate with `cf service <name>`

### Check Environment Variables

```bash
cf env site-scanner-api
```

**Use case:** Verify database credentials, Redis connection string, S3 bucket config.

**Look for:**
- `VCAP_SERVICES` — contains bound service credentials
- `NODE_ENV` — should be `production`

### Restart Application

```bash
cf restart site-scanner-api
cf restart site-scanner-consumer
```

**Use case:** Apply environment variable changes, recover from hung state.

### Restage Application (rebuild)

```bash
cf restage site-scanner-api
```

**Use case:** Apply buildpack updates or service binding changes.

**Warning:** This is slower than restart (rebuilds the app).

## Queue Inspection (Redis)

### Using the Helper Script

```bash
~/bin/download-current-queue.sh
```

**Output format:**
```
wait: 0
active: 7
delayed: 0
failed: 12
```

**Interpreting results:**

| Metric | Normal State | Problem Indicators |
|--------|--------------|-------------------|
| `wait` | 0 or decreasing | High (>1000) and not decreasing = queue backup |
| `active` | 0-7 (one per worker) | Stuck at same number for >1 hour = workers hung |
| `delayed` | 0 | High number = jobs scheduled for future (usually normal) |
| `failed` | Low (<100) | High (>1000) = recurring scan errors |

**Common scenarios:**

- **Normal idle state**: `wait=0, active=0, delayed=0, failed=low`
- **Healthy scanning**: `wait=decreasing, active=7`
- **Queue backup**: `wait=high and not decreasing` → Workers may be stuck or too slow
- **High failed count**: Check consumer logs for recurring errors; may need to clear failed jobs

### Clearing Failed Jobs (if needed)

If failed count is very high and jobs are not retryable:

```bash
cf ssh site-scanner-consumer
```

Then inside the container:
```bash
# Connect to Redis (get credentials from VCAP_SERVICES)
redis-cli -h <host> -p <port> -a <password>

# Clear failed jobs
DEL bull:site-scans:failed
```

**Warning:** This deletes all failed job data. Only do this if you've investigated the failure cause and determined the jobs are not recoverable.

## Database Health

### SSH Tunnel to PostgreSQL

**Step 1: Get database credentials**
```bash
cf env site-scanner-api | grep -A 50 postgres
```

**Look for:** `uri`, `host`, `port`, `username`, `password`, `dbname`

**Step 2: Create SSH tunnel**
```bash
cf ssh site-scanner-api -L 65432:<HOST>:<PORT>
```

Replace `<HOST>` and `<PORT>` with values from credentials.

**Step 3: Connect with psql** (in a new terminal)
```bash
psql -h 127.0.0.1 -p 65432 -U <USERNAME> -d <DBNAME>
```

Enter password when prompted.

### Key Health Queries

**Website count (should be ~31,500)**
```sql
SELECT COUNT(*) FROM website;
```

**Outcomes:**
- `~31,500` — Normal
- `0` — Complete ingest failure (see Recovery Procedure)
- `< 100` — Partial ingest failure or silent failure
- `> 50,000` — Possible duplicate ingestion (investigate)

**Most recent ingest timestamp**
```sql
SELECT MAX(updated) FROM website;
```

**Expected:** Within the last 24 hours (ingest runs daily at 22:15 UTC).

**Core results count and freshness**
```sql
SELECT COUNT(*) FROM core_result;
SELECT MAX(updated) FROM core_result;
```

**Expected:** Similar to website count; updated within the last few days (scans run Mon/Wed/Fri).

**Check for specific site**
```sql
SELECT * FROM website WHERE url = 'cms.gov';
```

**Outcomes:**
- Row returned — Site is in database (check `core_result` for scan data)
- No row — Site not ingested (may be filtered or missing from upstream CSV)

**Check recent ingest activity**
```sql
SELECT
  DATE(updated) as date,
  COUNT(*) as count
FROM website
GROUP BY DATE(updated)
ORDER BY date DESC
LIMIT 7;
```

**Use case:** Identify when ingest last ran successfully by checking which dates have bulk updates.

## Verifying Ingest Success

### Method 1: Check Task Status

```bash
cf tasks site-scanner-consumer | grep ingest | head -5
```

**Look for:**
- Recent task (within 24 hours)
- STATE = `SUCCEEDED`

**Warning:** `SUCCEEDED` only means the task completed, not that it processed data successfully (see silent failure below).

### Method 2: Check Logs for Success Indicators

```bash
cf logs site-scanner-consumer --recent | grep -i "total number of websites"
```

**Expected output:**
```
total number of websites following ingest: 31522
```

**If missing:** Ingest failed before reaching the completion log (parsing error or crash).

### Method 3: Check for Failure Indicators

```bash
cf logs site-scanner-consumer --recent | grep -iE "error|column.*mismatch|parsing"
```

**Common error patterns:**
- `column header mismatch expected: N columns got: M` — CSV schema changed upstream
- `Unexpected Error:` — Generic parsing failure
- `ECONNREFUSED` — Cannot reach upstream CSV URL
- `404` — Upstream CSV moved or deleted

## Manual Recovery Procedure

Use this procedure when ingest has failed and the database is empty or corrupted.

### Step 1: Deploy Latest Code

**Why:** Ensure deployed code matches current upstream CSV schema.

```bash
gh workflow run deploy.yml
```

**Verify deployment:**
```bash
gh run list --workflow=deploy.yml --limit 1
```

Wait for status: ✓ (completed).

**Alternative: Trigger from GitHub Actions UI**
1. Go to https://github.com/GSA/site-scanning/actions/workflows/deploy.yml
2. Click "Run workflow" → "Run workflow"

### Step 2: Run Ingest

**Option A: Via GitHub Actions**
```bash
gh workflow run ingest.yml
```

**Option B: Directly via cf run-task**
```bash
cf run-task site-scanner-consumer \
  --command "node dist/apps/cli/main.js ingest" \
  -k 2G -m 2G \
  --name manual-ingest-$(date +%Y%m%d-%H%M%S)
```

**Monitor task:**
```bash
# Check task status
cf tasks site-scanner-consumer | head -5

# Stream logs
cf logs site-scanner-consumer
```

### Step 3: Verify Ingest

**Check logs for success message:**
```bash
cf logs site-scanner-consumer --recent | grep "total number of websites"
```

**Expected:** `total number of websites following ingest: ~31500`

**Verify in database:**
```bash
# Using SSH tunnel (see Database Health section)
psql -h 127.0.0.1 -p 65432 -U <USERNAME> -d <DBNAME> -c "SELECT COUNT(*) FROM website;"
```

**Expected:** ~31,500

**If count is wrong:**
- Check logs for parsing errors
- Verify upstream CSV is accessible: `curl -I https://raw.githubusercontent.com/GSA/federal-website-index/main/data/site-scanning-target-url-list.csv`
- Check column count in CSV vs. code

### Step 4: Enqueue Scans

**Option A: Via GitHub Actions**
```bash
gh workflow run enqueue-scans.yml
```

**Option B: Directly via cf run-task**
```bash
cf run-task site-scanner-consumer \
  --command "node dist/apps/cli/main.js enqueue-scans" \
  -k 2G -m 2G \
  --name manual-enqueue-$(date +%Y%m%d-%H%M%S)
```

**Monitor queue:**
```bash
~/bin/download-current-queue.sh
```

**Expected:** `wait` count increases to ~31,500, then decreases as workers process jobs.

### Step 5: Wait for Scans to Complete

**Check queue periodically:**
```bash
watch -n 60 ~/bin/download-current-queue.sh
```

**Expected timeline:** ~6-12 hours for 31,500 sites with 7 workers (depends on scan complexity and site responsiveness).

**Indicators of completion:**
- `wait: 0`
- `active: 0`
- `failed: < 100` (some failures are normal — unreachable sites, timeouts)

### Step 6: Generate Snapshots

**Once scans complete:**
```bash
gh workflow run create-daily-snapshots.yml
```

**Verify snapshot generation:**
1. Check S3 bucket (or Minio locally) for new files
2. Download and inspect CSV: `curl https://api.gsa.gov/technology/site-scanning/data/site-scanning-latest.csv | wc -l`
   - Expected: ~31,500 lines (plus header)

### Step 7: Verify Downstream Consumers

**Check federal-website-index repository:**

1. Go to https://github.com/GSA/federal-website-index
2. Check recent commits to `data/` directory
3. Verify source lists have been rebuilt:
   - `data/hyperlink_domains.csv`
   - `data/final_url_websites.csv`

**If not rebuilt:** Trigger manual rebuild in federal-website-index repo (check their Actions workflows).

## Common Failure Modes

### 1. Column Mismatch (Ingest)

**Signature:**
- `cf logs` shows: `"column header mismatch expected: N columns got: M"`
- Website count in database is 0 or very low
- Task status is `SUCCEEDED` despite failure (silent failure)

**Cause:**
- Upstream CSV (federal-website-index) added/removed a column
- Deployed code has outdated `headers` array in `libs/ingest/src/ingest.service.ts`

**Fix:**
1. Identify the mismatch:
   ```bash
   # Download current CSV header
   curl -s https://raw.githubusercontent.com/GSA/federal-website-index/main/data/site-scanning-target-url-list.csv | head -1

   # Count columns
   curl -s https://raw.githubusercontent.com/GSA/federal-website-index/main/data/site-scanning-target-url-list.csv | head -1 | awk -F',' '{print NF}'
   ```

2. Check deployed code:
   ```bash
   git log --oneline -10  # Find latest deployed commit
   git show <commit>:libs/ingest/src/ingest.service.ts | grep -A 20 "headers:"
   ```

3. If main branch has the fix, deploy:
   ```bash
   gh workflow run deploy.yml
   ```

4. If main branch doesn't have the fix, update the code, merge, then deploy

5. Re-run ingest (see Recovery Procedure)

### 2. Silent Ingest Failure

**Signature:**
- `cf tasks` shows task `SUCCEEDED`
- Website count is low or unchanged
- Logs show parsing errors or exceptions
- No "total number of websites" log message

**Cause:**
- Ingest CLI does not exit with non-zero status on errors
- `cf run-task` is fire-and-forget (reports submission success, not task result)

**Fix:**
1. Check logs for actual error:
   ```bash
   cf logs site-scanner-consumer --recent | grep -i error
   ```

2. Address the root cause (usually column mismatch or unreachable CSV)

3. Re-run ingest

**Prevention:**
- exit non-zero on errors, verify task completion, add extra monitoring, and checks for failure modes.

### 3. Queue Backup

**Signature:**
- `~/bin/download-current-queue.sh` shows high `wait` count that's not decreasing
- `active` count stuck at same number for >1 hour

**Cause:**
- Consumer workers are stuck on a problematic site
- Workers crashed but container still running
- Rate limiting from external sites causing slow processing

**Fix:**
1. Check consumer logs for stuck workers:
   ```bash
   cf logs site-scanner-consumer --recent | grep -i timeout
   ```

2. Restart consumers:
   ```bash
   cf restart site-scanner-consumer
   ```

3. If a specific site is causing issues, consider adding it to a skip list (if pattern exists in code)

4. If queue backup persists, scale workers temporarily:
   ```bash
   cf scale site-scanner-consumer -i 10
   ```
   (Note: This will be reset on next deploy; update `vars-prod.yml` for permanent change)

### 4. Snapshot Issues

**Signature:**
- S3 bucket has stale or missing snapshot files
- Downstream repos (federal-website-index) report errors or have empty/corrupted data

**Cause:**
- Snapshot task failed
- Database was empty when snapshot ran (due to ingest failure)
- S3 credentials expired or service is down

**Fix:**
1. Verify database has data (see Database Health)

2. If database is empty, fix ingest first (see Recovery Procedure)

3. If database has data, re-run snapshot:
   ```bash
   gh workflow run create-daily-snapshots.yml
   ```

4. Check snapshot task status:
   ```bash
   cf tasks site-scanner-consumer | grep snapshot
   ```

5. If task failed, check logs:
   ```bash
   cf logs site-scanner-consumer --recent | grep -i snapshot
   ```

6. Verify S3 credentials:
   ```bash
   cf env site-scanner-consumer | grep -i s3
   ```

### 5. Memory / OOM Errors

**Signature:**
- Logs show "out of memory" or "JavaScript heap out of memory"
- Apps crash frequently
- `cf apps` shows instances in "crashed" state

**Cause:**
- Large dataset processing exceeds allocated memory
- Memory leak in application code
- Insufficient memory allocation in `vars-prod.yml`

**Fix (temporary):**
```bash
cf scale site-scanner-api -m 2G
cf scale site-scanner-consumer -m 4G
```

**Fix (permanent):**
1. Edit `vars-prod.yml` or `vars-dev.yml`
2. Update memory values
3. Deploy: `gh workflow run deploy.yml`

**Investigation:**
- Check memory usage patterns in Cloud Foundry dashboard
- Profile application locally with large datasets
- Review recent code changes for memory leaks

## Tips and Best Practices

1. **Always check logs first**: Most issues leave clear indicators in `cf logs --recent`

2. **Verify task completion**: `SUCCEEDED` task status doesn't mean the task succeeded internally — always check logs for error patterns

3. **Monitor the queue**: `~/bin/download-current-queue.sh` is the fastest way to check scan progress

4. **Use database queries to verify**: Trust the database count, not just task status

5. **Coordinate with federal-website-index**: Most ingest issues stem from upstream schema changes

6. **Deploy after code changes**: Never let updated code sit undeployed if it affects ingest

7. **Scale carefully**: Ad-hoc `cf scale` commands are reverted on next deploy — update `vars-*.yml` for permanent changes

8. **Check schedules**: Ingest runs daily at 22:15 UTC; scans run Mon/Wed/Fri at 00:00 UTC; snapshots run daily at 15:00 UTC

9. **Keep this skill updated**: Add new failure modes as they're discovered

## Additional Resources

- Cloud Foundry CLI docs: https://docs.cloudfoundry.org/cf-cli/
- Cloud.gov docs: https://cloud.gov/docs/
- Site Scanning GitHub: https://github.com/GSA/site-scanning
- Federal Website Index: https://github.com/GSA/federal-website-index
