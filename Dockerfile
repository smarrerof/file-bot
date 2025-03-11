FROM node:alpine3.21

ARG VERSION=main

# Install git and clone the repository
RUN apk add --no-cache git
RUN git clone --branch $VERSION --depth 1 https://github.com/smarrerof/file-bot /app

WORKDIR /app

RUN npm install

VOLUME /downloads

CMD ["npm", "start"]