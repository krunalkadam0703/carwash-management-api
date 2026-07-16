FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev \
  && npm install --no-save prisma@7.8.0 \
  && npm cache clean --force

FROM node:22-alpine AS build

WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/carwash_db?schema=public"

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
  PORT=5000

RUN apk add --no-cache su-exec

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/src/generated ./src/generated
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/public/uploads \
  && chown -R node:node /app/public \
  && chmod +x /app/docker-entrypoint.sh

USER root

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
