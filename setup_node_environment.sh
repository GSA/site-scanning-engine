#!/bin/sh

# acquire nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# download, install and configure the version of node referenced
# in .nvmrc and then install the requesites found in package.json
nvm install &&
	nvm use &&
	npm install
