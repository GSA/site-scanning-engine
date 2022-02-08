#!/usr/bin/env bash

## @file site_scanner_endpoint_test.bash
## @brief perform a quick test of the Site Scanner API
## @details
## The Site Scanner exposes a RESTful API that may be queried via
## HTTP requests using tools such as `curl`.  This tool will wrap
## a `curl` request with the required headers and such in order to
## test the API.  In most situations, the tool will be able to
## fetch the required variables (API key, route, etc.) from
## Cloud Foundry automatically.
## @author Wes Dean <wesley.dean@gsa.gov>

# if anything breaks, abort
set -e

## @fn show_help()
## @brief display a help message then exit the program
## @details
## The first sed script takes line starting with the first Doxygen-
## style 'file' parameter up to and including the first line with
## the 'author' parameter; this becomes the first part of the help
## message.
##
## So, to use this, the first part of the Bash script needs to
## be Doxygen-style markup starting with the 'file' parameter
## and should end with the 'author' parameter's line (that is,
## we use the entire line that the 'author' parameter uses).
##
## Next, we use another sed script that looks for options to
## getopts that have comments starting with ##- and extracts
## the option followed by the comment.
## @retval 0 (True) if sed was happy
## @retval 1 (False) if sed was NOT happy
## @par Example
## @code
## show_help ; exit 0
## @endcode
show_help() {
	sed --zero-terminated \
		--regexp-extended \
		--expression='s/.*@[Ff]ile *(.*)@[Aa]uthor *([^\n]*).*/Usage: \1Author: \2\n\n/' \
		--regexp-extended \
		--expression='s/\B@[a-z]* *//g' \
		--expression 's/## *//g' \
		"$0"

	echo "Usage:"

	sed \
		--quiet \
		--regexp-extended \
		--expression='s/^ *([A-Z]) * \).*#{2}- */    -\1 : /ip' \
		"$0" |
		sort --ignore-case

	echo
	echo "Defaults:"
	echo "    app = '$DEFAULT_APP'"
	echo "    endpoint = '$DEFAULT_ENDPOINT'"
	echo "    key = (retrieved from Cloud Foundry)"
	echo "    org = (retrieved from Cloud Foundry)"
	echo "    protocol = '$DEFAULT_PROTOCOL'"
	echo "    route = (retried from Cloud Foundry)"
	echo "    space = (retried from Cloud Foundry)"
	echo
}

## @var DEFAULT_APP default Cloud Foundry app to query
DEFAULT_APP="site-scanner-api"

## @var DEFAULT_ENDPOINT default API endpoint to query
DEFAULT_ENDPOINT="/websites/"

## @var DEFAULT_KEY default key to use (retrieved)
DEFAULT_KEY=""

## @var DEFAULT_ORG default CF org to use (retrieved)
DEFAULT_ORG=""

## @var DEFAULT_PROTOCOL default protocol to use
DEFAULT_PROTOCOL="https://"

## @var DEFAULT_ROUTE default route to use (retrieved)
DEFAULT_ROUTE=""

## @var DEFAULT_SPACE default CF space to use (retrieved)
DEFAULT_SPACE=""

app="$DEFAULT_APP"
endpoint="$DEFAULT_ENDPOINT"
key="$DEFAULT_KEY"
org="$DEFAULT_ORG"
protocol="$DEFAULT_PROTOCOL"
route="$DEFAULT_ROUTE"
space="$DEFAULT_SPACE"

while getopts "a:e:hk:o:p:r:s:" option; do
	case "$option" in
	a) app="$OPTARG" ;;      ##- specify the app to query
	e) endpoint="$OPTARG" ;; ##- specify the API endpoint to query
	h)
		show_help
		exit 0
		;;                      ##- show help text
	k) key="$OPTARG" ;;      ##- specify the key to use with the API
	o) org="$OPTARG" ;;      ##- specify the Cloud Foundry organization
	p) protocol="$OPTARG" ;; ##- the protocol to use to query the API
	r) route="$OPTARG" ;;    ##- specify the route to query
	s) space="$OPTARG" ;;    ##- specify the Cloud Foundry space
	*)
		echo "Invalid option '$option'" 1>&2
		show_help 1>&2
		exit 1
		;;
	esac
done

shift $((OPTIND - 1))

org="${org:-$(cf target | sed -nE -e 's/^[[:space:]]*org[[:space:]]*:[[:space:]]*(.*)/\1/p')}"
space="${space:-$(cf target | sed -nE -e 's/^[[:space:]]*space[[:space:]]*:[[:space:]]*(.*)/\1/p')}"

echo "org: '$org'" 1>&2
echo "space: '$space'" 1>&2
echo "app: '$app'" 1>&2

key="${key:-$(cf env "$app" | sed -nE -e "s/^[[:space:]]*(['\"])*API_KEY\\1*[[:space:]]*:[[:space:]]*(['\"])*([^'\"]*)\\2*[[:space:]]*$/\\3/p")}"

scheme="${scheme:-https://}"
route="${route:-$(cf app "$app" | sed -nE -e 's/^routes[[:space:]]*:[[:space:]]*(.*)$/\1/p')}"
url="${protocol}${url:-$(echo "${route}${endpoint}" | sed -Ee 's|//+|/|g')}"

echo "Fetching '$url'" 1>&2
curl -sH "X-Secret-Api-Access-Token: $key" "$url"
