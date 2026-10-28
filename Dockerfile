# Multi-stage Dockerfile optimized for Dokploy, VPS, and Cloud deployment
# Node.js 22 LTS Alpine
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package manifests first for Docker layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies required for Vite & esbuild)
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Build Vite frontend bundle and esbuild server.js
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled server and client distribution
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/database_postgres.sql ./database_postgres.sql
COPY --from=builder /app/prisma ./prisma

# 4. Persistent Photo Upload Storage (Docker Named Volume rfa_gym_uploads)
ENV UPLOAD_DIR=/app/uploads

RUN mkdir -p /app/uploads/members \
             /app/uploads/trainers \
             /app/uploads/employees \
             /app/uploads/products \
             /app/uploads/equipment \
             /app/uploads/member-cards \
             /app/uploads/expenses && \
    chmod -R 755 /app/uploads

VOLUME ["/app/uploads"]

# Expose standard application port
EXPOSE 3000

# Docker / Dokploy Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start production application
CMD ["node", "server.js"]
