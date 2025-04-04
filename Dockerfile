FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm
RUN pnpm config set store-dir /app/.pnpm-store

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

# Generate database artifacts
RUN pnpm run db:generate

FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm
RUN pnpm config set store-dir /app/.pnpm-store
RUN apk add --no-cache ws

# Copy only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
RUN pnpm add ws

# Copy source files
COPY --from=builder /app/index.ts ./
COPY --from=builder /app/schema ./schema
COPY --from=builder /app/services ./services
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/typings.ts ./
COPY --from=builder /app/database.ts ./
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/migration ./migration
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD ["pnpm", "tsx", "index.ts"] 