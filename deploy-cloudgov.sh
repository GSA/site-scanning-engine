#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

#/ Usage: bash deploy-cloudgov.sh
#/ Description: This script creates the services (if necessary) to deploy to cloud.gov.
#/ Then it runs any deploy scripts.
#/ Examples:    
#/ Options:     
#/   --help: Display this help message
usage() { grep '^#/' "$0" | cut -c4- ; exit 0 ; }
expr "$*" : ".*--help" > /dev/null && usage

echoerr() { printf "%s\n" "$*" >&2 ; }
info()    { echoerr "[INFO]    $*" ; }
warning() { echoerr "[WARNING] $*" ; }
error()   { echoerr "[ERROR]   $*" ; }
fatal()   { echoerr "[FATAL]   $*" ; exit 1 ; }

cleanup() {
  # Remove temporary files
  # Restart services
  info "... cleaned up"
}

# function to check if a service exists
service_exists()
{
  info "checking if ${1} exists..."
  cf service "$1" > /dev/null 2>&1
}

service_status()
{
  cf service "$1" | awk '/status:/ {print $2, $3}'
}

already_exists()
{
  info "${1} already exists..."
}

wait_until_created()
{
  info "waiting until ${1} is created..."

  CREATED_STATUS=$(service_status "$1")
  while [ "$CREATED_STATUS" != "create succeeded" ]
  do
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


if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
  trap cleanup EXIT
  # Script goes here
  info "starting deploy-cloudgov.sh script ..."

  info "creating services if necessary..."

  if service_exists "$SCANNER_POSTGRES_NAME" ; then
    already_exists "$SCANNER_POSTGRES_NAME"
  else 
    cf create-service aws-rds $SCANNER_POSTGRES_PLAN $SCANNER_POSTGRES_NAME
    wait_until_created $SCANNER_POSTGRES_NAME
  fi

  if service_exists "$SCANNER_MESSAGE_QUEUE_NAME" ; then
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

  # next, build the cli
  npm run build cli

  # deploy to cloud.gov
  cf push
fi