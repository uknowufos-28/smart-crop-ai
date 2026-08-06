# Multi-Stage Production Dockerfile for SmartCropAI Backend REST Service

# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install all dependencies (including devDependencies)
COPY 06_backend/package*.json ./
RUN npm ci

# Copy TypeScript source code and build config
COPY 06_backend/tsconfig.json ./
COPY 06_backend/src ./src

# Compile TypeScript to JavaScript (dist/)
RUN npm run build

# Stage 2: Production Execution Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy production package manifests and install production dependencies only
COPY 06_backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled dist artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Use non-root user for security compliance
USER node

EXPOSE 5000

# Container Healthcheck Querying /health Endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
