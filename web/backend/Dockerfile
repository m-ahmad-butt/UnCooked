FROM node:25-alpine AS deps
WORKDIR /app
# hadolint ignore=DL3018
RUN apk upgrade --no-cache
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:25-alpine
WORKDIR /app
# hadolint ignore=DL3018
RUN apk upgrade --no-cache \
  && addgroup -S app && adduser -S app -G app \
  # Runtime only needs `node`. Bundled npm brings HIGH CVEs (brace-expansion, pacote, …).
  && rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/corepack
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
USER app
EXPOSE 3001
CMD ["node", "src/server.js"]
