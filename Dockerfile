# Stage 1: Build NestJS
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
COPY prisma ./prisma/ 
RUN yarn install --network-timeout 600000
COPY . .
RUN npx prisma generate
RUN yarn build

# Stage 2: Production Runtime
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --production --network-timeout 600000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma/ 
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/ 

EXPOSE 3001
CMD ["node", "dist/src/main.js"]