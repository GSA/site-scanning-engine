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
FROM node:24.13.0-bookworm-slim AS development

WORKDIR /usr/src/app

# install headless Chrome dependencies, per https://pptr.dev/troubleshooting
RUN apt-get update && \
  apt-get -y --no-install-recommends install \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libexpat1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  lsb-release \
  wget \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*


# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser

# Puppeteer's postinstall downloads Chrome under the installing user's home
# (root, at this point in the build). Point it at pptruser's home instead so
# the binary is where the pptruser runtime user will actually look for it.
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer

COPY package*.json ./

RUN npm install && chown -R pptruser:pptruser /home/pptruser/.cache

COPY . .

RUN npm run build:all

# Run everything after as non-privileged user.
USER pptruser

# the production stage handles running the application
FROM node:24.13.0-bookworm-slim AS production

WORKDIR /usr/src/app

# install headless Chrome dependencies, per https://pptr.dev/troubleshooting
RUN apt-get update && \
  apt-get -y --no-install-recommends install \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libexpat1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  lsb-release \
  wget \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser

# Puppeteer's postinstall downloads Chrome under the installing user's home
# (root, at this point in the build). Point it at pptruser's home instead so
# the binary is where the pptruser runtime user will actually look for it.
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer

COPY package*.json ./

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# when the NODE_ENV argument is set to production
# this should skip installing the devDependencies.
RUN npm ci && chown -R pptruser:pptruser /home/pptruser/.cache

COPY --from=development /usr/src/app/dist ./dist

# Run everything after as non-privileged user.
USER pptruser

CMD ["node", "dist/apps/scan-engine/main"]
