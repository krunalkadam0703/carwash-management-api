FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

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

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN mkdir -p /app/uploads

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
