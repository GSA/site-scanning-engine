# Scanner Dockerfile
# 
# Note: This Dockerfile is only used for local development. 
# In theory, one should be able to adapt it to run in in the cloud and
# that is 
# But one should note the weirdness involved in getting Chrome running in Docker. 
# See the scanner/README.md for more info.
#
# Another Note:
# This file is using multi-stage builds for performance. 
# See: https://docs.docker.com/develop/develop-images/multistage-build/ 
# 
# the development stage handles building the application and is designed for local development.
FROM node:12.18 AS development

WORKDIR /usr/src/app

# install puppeteer dependencies
RUN apt-get update && \
    apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
      libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
      libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
      libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
      libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget && \
    rm -rf /var/lib/apt/lists/*


# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

COPY package*.json ./

RUN npm install

COPY . . 

RUN npm run build scanner

# Run everything after as non-privileged user.
USER pptruser

# the production stage handles running the application
FROM node:12.18 AS production

WORKDIR /usr/src/app

# install puppeteer dependencies
RUN apt-get update && \
    apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
      libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
      libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
      libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
      libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget && \
    rm -rf /var/lib/apt/lists/*

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

COPY --from=builder /usr/src/app/dist ./dist

# Run everything after as non-privileged user.
USER pptruser

CMD ["node", "dist/apps/scanner/main"]