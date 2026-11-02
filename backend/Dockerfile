# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS base

WORKDIR /app

FROM base AS dependencies

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    g++ \
    make \
    openssl \
    python3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

FROM dependencies AS build

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public" \
  npx prisma generate --config prisma7.config.ts

RUN npm run build

FROM build AS migrate

CMD ["npx", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"]

FROM node:26-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3000

CMD ["npm", "start"]
