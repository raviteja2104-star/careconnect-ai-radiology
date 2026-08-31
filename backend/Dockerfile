# Stage 1: Build & deps
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production runtime
FROM node:18-alpine
WORKDIR /usr/src/app

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Graceful shutdown is typically handled in server.js
CMD ["npm", "start"]
