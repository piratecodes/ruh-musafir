# Stage 1: Build Next.js
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --network-timeout 600000
COPY . .
RUN yarn build

# Stage 2: Production Runtime
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --production --network-timeout 600000
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.cjs ./server.cjs
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["node", "server.cjs"]