# Stage 1: Build Vite assets
FROM node:24-alpine AS builder
WORKDIR /app

# Inject API URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --network-timeout 600000
COPY . .
RUN yarn build

# Stage 2: Serve static files with lightweight Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist .
RUN echo 'server { \
    listen 5173; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]