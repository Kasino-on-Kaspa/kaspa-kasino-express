# Use Node.js v20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run db:generate

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "run", "dev"] 