FROM node:lts-alpine

ARG VERSION=main

# Upgrade system packages to get security patches
RUN apk upgrade --no-cache

# Install git and clone the repository
RUN apk add --no-cache git
RUN git clone --branch $VERSION --depth 1 https://github.com/smarrerof/file-bot /app

WORKDIR /app

RUN npm install && npm audit fix

VOLUME /downloads

CMD ["npm", "start"]