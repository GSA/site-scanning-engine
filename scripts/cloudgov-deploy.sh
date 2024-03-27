#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

#/ Usage: bash deploy-cloudgov.sh
#/ Description: This script creates the services (if necessary) to deploy to cloud.gov.
#/ Then it runs any deploy scripts.
#/ Examples:
#/ Options:
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

# function to check if a service exists
service_exists() {
	info "checking if ${1} exists..."
	cf service "$1" >/dev/null 2>&1
}

service_status() {
	cf service "$1" | awk '/status:/ {print $2, $3}'
}

already_exists() {
	info "${1} already exists..."
}

wait_until_created() {
	info "waiting until ${1} is created..."

	CREATED_STATUS=$(service_status "$1")
	while [ "$CREATED_STATUS" != "create succeeded" ]; do
		sleep 15
		info "waiting for ${1} to be created..."
		CREATED_STATUS=$(service_status "$1")
	done
}

# Service Names
SCANNER_POSTGRES_NAME="scanner-postgres"
SCANNER_POSTGRES_PLAN="micro-psql"
SCANNER_MESSAGE_QUEUE_NAME="scanner-message-queue"
SCANNER_MESSAGE_QUEUE_PLAN="redis-3node"
SCANNER_PUBLIC_STORAGE_NAME="scanner-public-storage"
SCANNER_PUBLIC_STORAGE_PLAN="basic-public"
SCANNER_USER_PROVIDED_API_KEY="user-provided-api-key" # pragma: allowlist secret

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
	trap cleanup EXIT
	# Script goes here
	info "starting deploy-cloudgov.sh script ..."

	info "creating services if necessary..."

	if service_exists "$SCANNER_USER_PROVIDED_API_KEY"; then
		already_exists "$SCANNER_USER_PROVIDED_API_KEY"
	else
		info "Create an API_KEY for use with API Umbrella."
		cf cups $SCANNER_USER_PROVIDED_API_KEY -p "API_KEY"
	fi

	if service_exists "$SCANNER_POSTGRES_NAME"; then
		already_exists "$SCANNER_POSTGRES_NAME"
	else
		cf create-service aws-rds $SCANNER_POSTGRES_PLAN $SCANNER_POSTGRES_NAME
		wait_until_created $SCANNER_POSTGRES_NAME
	fi

	if service_exists "$SCANNER_MESSAGE_QUEUE_NAME"; then
		already_exists "$SCANNER_MESSAGE_QUEUE_NAME"
	else
		cf create-service aws-elasticache-redis $SCANNER_MESSAGE_QUEUE_PLAN $SCANNER_MESSAGE_QUEUE_NAME
		wait_until_created $SCANNER_MESSAGE_QUEUE_NAME
	fi

	if service_exists "$SCANNER_PUBLIC_STORAGE_NAME"; then
		already_exists "$SCANNER_PUBLIC_STORAGE_NAME"
	else
		cf create-service s3 $SCANNER_PUBLIC_STORAGE_PLAN $SCANNER_PUBLIC_STORAGE_NAME
		wait_until_created $SCANNER_PUBLIC_STORAGE_NAME
	fi

	# next, compile the typescript for all of the apps
	npm run build:all

	# capture the manifest's filename from ARGV
	manifest_filename="${1:-manifest.yml}"

	# if there's no manifest file, quit
	if [ ! -e "${manifest_filename}" ]; then
		logger -s "  manifest file '${manifest_filename}' is missing."
		exit 1
	fi

	# grab the space (environment) from `cf target`; this assumes that
	# there are only alphanumeric characters in the space's name; so
	# 'prod2' and 'dev' work file, but 'staging-testing' will not.
	cf_space="$(cf target site-scanner-api |
		sed -nEe 's/^[[:space:]]*space[[:space:]]*:[[:space:]]*([[:alnum:]])/\1/p')"

	# if we can't determine the space, quit
	if [ -z "${cf_space}" ]; then
		logger -s "Could not determine the target space from 'cf target'"
		exit 1
	fi

	# take the manifest filename and mangle it to create a vars
	# filename in the same location as the manifest filename
	vars_filename="$(echo "${manifest_filename}" |
		sed -Ee "s/manifest[^.]*/vars-${cf_space}/g")"

	# if there is no vars file, quit
	if [ ! -e "${vars_filename}" ]; then
		logger -s "  vars file '${vars_filename}' is missing."
		exit 1
	fi

	# use the environment / space-specific vars file
	cf push -f "${manifest_filename}" --vars-file "${vars_filename}"
fi
