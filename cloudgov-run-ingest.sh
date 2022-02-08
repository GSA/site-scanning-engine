#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

#/ Usage: ./run-ingest-cloud-gov.sh
#/ Description: Runs the ingest task on Cloud.gov
#/   --help: Display this help message
usage() {
	grep '^#/' "$0" | cut -c4-
	exit 0
}
expr "$*" : ".*--help" >/dev/null && usage

echoerr() { printf "%s\n" "$*" >&2; }
info() { echoerr "[INFO]    $*"; }
warning() { echoerr "[WARNING] $*"; }
error() { echoerr "[ERROR]   $*"; }
fatal() {
	echoerr "[FATAL]   $*"
	exit 1
}

cleanup() {
	# Remove temporary files
	# Restart services
	info "... cleaned up"
}

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
	trap cleanup EXIT
	# Script goes here
	info "starting script ..."
	cf run-task site-scanner-consumer -c "node dist/apps/cli/main.js ingest" -k 2G -m 4G
fi
