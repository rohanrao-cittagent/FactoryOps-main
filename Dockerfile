# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the built app
RUN npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy package.json for reference
COPY package.json .

# Expose port (default 3000)
EXPOSE 3000

# Set environment variables for API endpoints (can be overridden at runtime)
ENV VITE_DEVICE_SERVICE=http://localhost:8000
ENV VITE_DATA_SERVICE=http://localhost:8081
ENV VITE_RULE_ENGINE_SERVICE=http://localhost:8002
ENV VITE_ANALYTICS_SERVICE=http://localhost:8003
ENV VITE_REPORTING_SERVICE=http://localhost:8085

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
