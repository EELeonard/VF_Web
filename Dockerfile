# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime
LABEL fly_launch_runtime="Node.js"
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
  && test -x node_modules/.bin/vinext

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/server.mjs ./server.mjs
COPY --from=build /app/node-runtime ./node-runtime
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server.mjs"]
