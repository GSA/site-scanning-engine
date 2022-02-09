# Environment Provisioning

## Overview

Deploying to an environment (space) requires that the space exist --
be provisionied -- before code can be deployed to it.  The steps to
provision an environment include:

1. Create the space on Cloud Foundry
1. Create vars file for the environment
1. Target the space on Cloud Foundry
1. Create an API key for use with the environment
1. Run the deployment script
1. Test the new environment
1. Verify that the service accounts can deploy to the environment

## Detailed Instructions

### 1. Create the space on Cloud Foundry

First, verify that the environment you wish to create doesn't yet
exist by using the `cf spaces command`  (note: you must be logged
in first).

Assuming the space does not yet exist, use the `cf create-space`
command to create the space:

```sh
cf create-space NAME_OF_SPACE -o NAME_OF_ORG
```

Note: `NAME_OF_ORG` is the name of the organization in Cloud
Foundry and `NAME_OF_SPACE` is the name of the space (environment)
to be used.

### 2. Create vars file for the environment

Cloud Foundry uses `manifest.yml` files to describe the applications
to be deployed to a space.  The `manifest.yml` file for this project
uses [variable substitution](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest-attributes.html#variable-substitution)
to specify environment-specific variables (e.g., memory quota,
number of instances, etc.).  The values for these variables are found
in the `env-NAME_OF_SPACE.yml` files.  So, for example, the vars
file for the `dev` environment is `vars-dev.yml` (case-sensitive).

So, to create a vars file for a new environment, copy an existing
vars file and supply the appropriate values.  Be sure to add the
file to the repository (`git add`), commit it (`git commit`) and
push it (`git push origin NAME_OF_BRANCH`) so that the deployment
script is able to deploy changes to said environment.

### 3. Target the space on Cloud Foundry

The deployment script -- used to provision the environment -- uses
the name of the space in order to select which vars file will be
used with the environment.  Therefore, it's important to target
the space by using the `cf target` command:

```sh
cf target -o NAME_OF_ORG -s NAME_OF_SPACE
```

### 4. Create an API key for use with the environment

The deployment script requests the `API_KEY` to use with
the deployed environment.  This `API_KEY` is passed along with
API calls to authenticate the request.

The API key is stored as a user-provided service, so its value
is accessible via `cf env`.  Moreover, the only time that the key
is needed is when connecting the API to an external service (e.g.,
API Umbrella) or when querying the API directly (e.g., via `curl`).

As a result, the value generally doesn't matter, particularly as
an authorized agent may query Cloud Foundry to retrieve the value.

That is, it could literally be a face-plant on the keyboard.

### 5. Run the deployment script

There is a deployment script that is used to provision the environment
(space) called `cloudgov-deploy.sh`.  This script will not only
push code to Cloud Foundry, but it will also wire up the required
services (e.g., RDS Postgres, Redis, the API key, etc.).

When the script is run, if there is no value for the `API_KEY`
user-provided service, it will prompt the operator for a value.
Provide the value previously discussed (or slap the keyboard a few
times).

Note: the process of creating and binding all of the services to the
(new) applications takes a while -- don't be surprised if it takes
upwards of 15..20 minutes to complete.  This is normal.

### 6. Verify that the service accounts can deploy to the environment

Once the application is provisioned, you, dear operator, should
probably add the service accounts used to deploy other environments
to this application.  One way to accomplish this is by listing the
users who have access to other, existing spaces:

```sh
cf space-users NAME_OF_ORG NAME_OF_SPACE
```

To add a user to the new space:

```sh
cf set-space-role NAME_OF_USER NAME_OF_ORG NAME_OF_SPACE NAME_OF_ROLE
```

Here, `NAME_OF_USER` is the user's name and `NAME_OF_ROLE` is the
name of the role to apply (e.g., `SpaceDeveloper`)

Note: usernames for service accounts are typically strings of 36
characters consisting of numbers, letters, and dashes.

### 7. Test the new environment

A running deployment may be tested from the command line with the
`curl` command provided the API key (described previously) is
passed in the `X-Secret-Api-Access-Token` HTTP header.

In the following example, the following variables are used:

* **key**: the API key (available from `cf env`)
* **route**: the route (hostname, available from `cf app`)
* **endpoint**: the endpoint to query (e.g., `/websites/`)

```sh
curl -H "X-Secret-Api-Access-Token: $key" "https://${route}${endpoint}"
```

Alternatively, one may use the provided `site_scanner_endpoint_test.bash`
script to automate the fetching of the application's route, API key, etc.
