# API Dockerfile
#
# Note: This Dockerfile is only used for local development. 
# In theory, one should be able to adapt it to run in in the cloud. 
# 
# Another Note:
# This file is using multi-stage builds for build performance. 
# See: https://docs.docker.com/develop/develop-images/multistage-build/ 
# 
# the `development` stage handles building the application
FROM node:12.20.1 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . . 

RUN npm run build api

# the production stage handles running the application
FROM node:12.20.1 AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# npm ci response the NODE_ENV=production flag so it should 
# not install devDependencies.
RUN npm ci

COPY --from=development /usr/src/app/dist ./dist

RUN ["node", "dist/apps/api/main"]


