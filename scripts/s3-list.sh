#!/usr/bin/env bash
#
# s3-list.sh — Safely fetch scanner-public-storage S3 credentials from a
# Cloud.gov service key and list (or download) the bucket contents.
#
# WHY THIS EXISTS
#   The usual way to read S3 credentials — inspecting a full `cf env` blob,
#   which contains live access keys — forces a human to handle raw credentials
#   by hand. This script removes every step where a human touches a raw
#   credential:
#     - credentials are read straight from the service key into shell vars
#     - they are NEVER printed, echoed, or written to disk
#     - they live only in this process's environment and vanish on exit
#     - the AWS CLI reads them from the environment, not a saved profile
#
# USAGE
#   The service key MUST be specified (via --key or the CF_KEY env var). The
#   script will not guess which credential to use.
#
#   QUICK START — list the bucket contents with a named service key:
#
#       scripts/s3-list.sh --key egardner-scanner-public-storage
#
#   This reads the credentials for that service key, loads them into the
#   process environment (never printing them), and runs `aws s3 ls` against
#   the bucket using the correct GovCloud FIPS endpoint. Example output:
#
#       [s3-list] Reading credentials from service key 'egardner-...'...
#       [s3-list] Credentials loaded (region=us-gov-west-1, bucket=cg-...).
#       2026-07-17 10:22:31       12345 site-scanning-snapshot/latest.csv
#       ...
#
#   MORE EXAMPLES
#     scripts/s3-list.sh --key KEY_NAME                 # list the bucket (default)
#     scripts/s3-list.sh --key KEY_NAME --recursive     # recursive listing + sizes
#     scripts/s3-list.sh --key KEY_NAME --prefix archive/          # list inside a "folder"
#     scripts/s3-list.sh --key KEY_NAME --prefix archive/ --recursive
#     scripts/s3-list.sh --key KEY_NAME --download DIR  # sync whole bucket into DIR
#     scripts/s3-list.sh --key KEY_NAME --prefix archive/ --download DIR  # sync just that prefix
#     scripts/s3-list.sh --service SVC --key KEY        # override service + key
#     CF_KEY=KEY_NAME scripts/s3-list.sh                # supply the key via env var
#
# OPTIONS
#   --key KEY_NAME       service key to read (REQUIRED unless CF_KEY is set)
#   --service SVC        service instance (default: scanner-public-storage)
#   --prefix PATH        limit list/download to a bucket prefix (e.g. archive/)
#   --recursive          recursive listing with human-readable sizes (list mode
#                        only; downloads via --download are always recursive)
#   --download DIR       sync the bucket (or --prefix) into DIR
#
# ENVIRONMENT (used as defaults; flags take precedence)
#   CF_SERVICE   Cloud.gov service instance   (default: scanner-public-storage)
#   CF_KEY       service key name to read      (no default — must be provided)
#
# PREREQUISITES
#   - cf CLI installed and logged in:  cf login -a api.fr.cloud.gov --sso
#   - targeting the right space:       cf target -o gsatts-sitescan -s prod
#   - aws CLI installed
#   - jq installed (to parse the service-key JSON without exposing credentials)
#
set -euo pipefail

CF_SERVICE="${CF_SERVICE:-scanner-public-storage}"
CF_KEY="${CF_KEY:-}"

log()  { printf '[s3-list] %s\n' "$*" >&2; }
fail() { printf '[s3-list] ERROR: %s\n' "$*" >&2; exit 1; }

# --- parse args ------------------------------------------------------------
# MODE selects the action (list | download). RECURSIVE is an independent
# modifier for listing; `aws s3 sync` (download) is always recursive, so the
# flag is only meaningful for the list action.
MODE="list"
RECURSIVE=0
DOWNLOAD_DIR=""
PREFIX=""
while [ $# -gt 0 ]; do
  case "$1" in
    --list)        MODE="list"; shift ;;
    --recursive)   RECURSIVE=1; shift ;;
    --download)
      MODE="download"
      DOWNLOAD_DIR="${2:-}"
      [ -n "$DOWNLOAD_DIR" ] || fail "--download requires a target directory."
      shift 2
      ;;
    --prefix)
      PREFIX="${2:-}"
      [ -n "$PREFIX" ] || fail "--prefix requires a path (e.g. archive/)."
      shift 2
      ;;
    --key)
      CF_KEY="${2:-}"
      [ -n "$CF_KEY" ] || fail "--key requires a service key name."
      shift 2
      ;;
    --service)
      CF_SERVICE="${2:-}"
      [ -n "$CF_SERVICE" ] || fail "--service requires a service instance name."
      shift 2
      ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) fail "Unknown argument: $1 (see --help)" ;;
  esac
done

# The service key must be specified explicitly (via --key or CF_KEY) so we
# never guess which credential to use.
[ -n "$CF_KEY" ] || fail "No service key specified. Use --key KEY_NAME (or set CF_KEY). List keys with: cf service-keys ${CF_SERVICE}"

# --- preflight -------------------------------------------------------------
for bin in cf aws jq; do
  command -v "$bin" >/dev/null 2>&1 || fail "'$bin' is not installed or not on PATH."
done

# Confirm we are logged in and targeted before touching credentials.
cf target >/dev/null 2>&1 || fail "Not logged in / no target set. Run: cf login -a api.fr.cloud.gov --sso && cf target -o gsatts-sitescan -s prod"

# --- fetch credentials into the environment (never to disk, never printed) --
log "Reading credentials from service key '${CF_KEY}' on '${CF_SERVICE}'..."

# `cf service-key` prints a human header line before the JSON; drop everything
# up to the first line that starts with '{' so jq only sees valid JSON. Anchoring
# on '^{' (rather than any line merely containing a brace) avoids capturing a
# header line that happens to include '{'. The raw JSON is piped directly into
# jq and never stored or displayed.
CREDS_JSON="$(cf service-key "$CF_SERVICE" "$CF_KEY" 2>/dev/null | awk '/^{/{f=1} f')"
[ -n "$CREDS_JSON" ] || fail "Could not read service key '${CF_KEY}'. List keys with: cf service-keys ${CF_SERVICE}"

# Export as AWS CLI standard env vars. These stay in-process only.
#
# The credential fields may sit at the top level OR be nested under
# `.credentials` depending on the cf CLI version. `// empty` on each lookup
# lets us fall through to whichever shape is present without exposing values.
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION
jq_field() { printf '%s' "$CREDS_JSON" | jq -r "(.credentials.$1 // .$1) // empty"; }
AWS_ACCESS_KEY_ID="$(jq_field access_key_id)"
AWS_SECRET_ACCESS_KEY="$(jq_field secret_access_key)"
AWS_DEFAULT_REGION="$(jq_field region)"
BUCKET="$(jq_field bucket)"
FIPS_ENDPOINT="$(jq_field fips_endpoint)"

# Drop the JSON (which still holds the credentials) as soon as we've
# extracted the vars we need.
unset CREDS_JSON

# Validate we actually got usable values without echoing them.
[ -n "$AWS_ACCESS_KEY_ID" ]     || fail "No access_key_id found in service key JSON. Inspect the shape with: cf service-key ${CF_SERVICE} ${CF_KEY} | jq 'keys'"
[ -n "$AWS_SECRET_ACCESS_KEY" ] || fail "No secret_access_key found in service key JSON."
[ -n "$BUCKET" ]                || fail "No bucket found in service key JSON."
[ -n "$FIPS_ENDPOINT" ]         || fail "No fips_endpoint found in service key JSON."

ENDPOINT_URL="https://${FIPS_ENDPOINT}"
log "Credentials loaded (region=${AWS_DEFAULT_REGION}, bucket=${BUCKET})."
log "Secret values are NOT printed and are held only in this process."

# S3 path being acted on: bucket root, or a specific prefix if --prefix given.
# Normalize the prefix to end with a trailing slash so it selects the contents
# of a "folder" rather than doing a loose prefix match. Without this, a prefix
# of `archive` would also match siblings like `archive-old/` and `archivefoo`.
if [ -n "$PREFIX" ]; then
  case "$PREFIX" in
    */) ;;                 # already ends with a slash
    *)  PREFIX="${PREFIX}/" ;;
  esac
fi
S3_PATH="s3://${BUCKET}/${PREFIX}"

# --- run the requested action ---------------------------------------------
case "$MODE" in
  list)
    if [ "$RECURSIVE" -eq 1 ]; then
      log "Listing ${S3_PATH} recursively ..."
      aws s3 ls "$S3_PATH" --recursive --human-readable --summarize \
        --endpoint-url "$ENDPOINT_URL"
    else
      log "Listing ${S3_PATH} ..."
      aws s3 ls "$S3_PATH" --endpoint-url "$ENDPOINT_URL"
    fi
    ;;
  download)
    [ "$RECURSIVE" -eq 1 ] && log "Note: --recursive is implied for downloads (aws s3 sync is always recursive)."
    mkdir -p "$DOWNLOAD_DIR"
    log "Syncing ${S3_PATH} -> ${DOWNLOAD_DIR} ..."
    aws s3 sync "$S3_PATH" "$DOWNLOAD_DIR" --endpoint-url "$ENDPOINT_URL"
    log "Download complete: ${DOWNLOAD_DIR}"
    ;;
esac

log "Done. Credentials discarded when this process exits."
