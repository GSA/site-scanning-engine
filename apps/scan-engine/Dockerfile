# Scanner Dockerfile
#
# Note: This Dockerfile is only used for local development.
# In theory, one should be able to adapt it to run in in the cloud and
# that is
# But one should note the weirdness involved in getting Chrome running in Docker.
# See the scan-engine/README.md for more info.
#
# Another Note:
# This file is using multi-stage builds for performance.
# See: https://docs.docker.com/develop/develop-images/multistage-build/
#
# the development stage handles building the application and is designed for local development.
FROM node:12.20.1 AS development

WORKDIR /usr/src/app

# install puppeteer dependencies
RUN apt-get update && \
  apt-get -y --no-install-recommends install \
  xvfb=2:1.19.2-1+deb9u9 \
  gconf-service=3.2.6-4+b1 \
  libasound2=1.1.3-5 \
  libcups2=2.2.1-8+deb9u7 \
  libexpat1=2.2.0-2+deb9u4 \
  libgbm1=13.0.6-1+b2 \
  libgconf-2-4=3.2.6-4+b1 \
  libglib2.0-0=2.50.3-2+deb9u2 \
  libgtk-3-0=3.22.11-1 \
  libnspr4=2:4.12-6 \
  libx11-6=2:1.6.4-3+deb9u4 \
  ca-certificates=20200601~deb9u2 \
  fonts-liberation=1:1.07.4-2 \
  libappindicator1=0.4.92-4 \
  libnss3=2:3.26.2-1.1+deb9u5 \
  lsb-release=9.20161125 \
  xdg-utils=1.1.1-1+deb9u2 \
  && rm -rf /var/lib/apt/lists/*


# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build:all

# Run everything after as non-privileged user.
USER pptruser

# the production stage handles running the application
FROM node:12.20.1 AS production

WORKDIR /usr/src/app

# install puppeteer dependencies
RUN apt-get update && \
  apt-get -y --no-install-recommends install \
  xvfb=2:1.19.2-1+deb9u9 \
  gconf-service=3.2.6-4+b1 \
  libasound2=1.1.3-5 \
  libcups2=2.2.1-8+deb9u7 \
  libexpat1=2.2.0-2+deb9u4 \
  libgbm1=13.0.6-1+b2 \
  libgconf-2-4=3.2.6-4+b1 \
  libglib2.0-0=2.50.3-2+deb9u2 \
  libgtk-3-0=3.22.11-1 \
  libnspr4=2:4.12-6 \
  libx11-6=2:1.6.4-3+deb9u4 \
  ca-certificates=20200601~deb9u2 \
  fonts-liberation=1:1.07.4-2 \
  libappindicator1=0.4.92-4 \
  libnss3=2:3.26.2-1.1+deb9u5 \
  lsb-release=9.20161125 \
  xdg-utils=1.1.1-1+deb9u2 \
  && rm -rf /var/lib/apt/lists/*

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser

COPY package*.json ./

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# when the NODE_ENV argument is set to production
# this should skip installing the devDependencies.
RUN npm ci

COPY --from=development /usr/src/app/dist ./dist

# Run everything after as non-privileged user.
USER pptruser

CMD ["node", "dist/apps/scan-engine/main"]
