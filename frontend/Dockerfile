FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:1.27-alpine AS production

ARG APP_VERSION=1.0.0
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="DevBoard Frontend" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.description="React · Vite · TypeScript · Tailwind"

# Replace the default Nginx virtual host with our SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite's production build output
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 84

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:84 || exit 1
