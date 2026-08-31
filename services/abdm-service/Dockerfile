FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /usr/src/app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

EXPOSE 5005
CMD ["npm", "start"]
