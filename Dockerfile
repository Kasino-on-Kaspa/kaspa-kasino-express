FROM --platform=$BUILDPLATFORM debian:bookworm AS builder

WORKDIR /app

# Install Node.js and build dependencies
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs build-essential && \
    npm install -g pnpm && \
    rm -rf /var/lib/apt/lists/*

RUN pnpm config set store-dir /app/.pnpm-store

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

# Generate database artifacts
RUN pnpm run db:generate

FROM debian:bookworm

WORKDIR /app

# Install Node.js and runtime dependencies
RUN apt-get update && \
    apt-get install -y curl gnupg2 netcat-traditional lsb-release && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/postgresql.list && \
    apt-get update && \
    apt-get install -y nodejs postgresql-client-16 && \
    npm install -g pnpm && \
    rm -rf /var/lib/apt/lists/*

RUN pnpm config set store-dir /app/.pnpm-store

# Copy only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

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