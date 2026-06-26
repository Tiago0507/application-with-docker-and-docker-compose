FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./

# Install all deps including devDependencies needed to compile TypeScript
RUN npm ci

COPY . .

RUN npm run build


FROM node:20-alpine AS production

ARG APP_VERSION=1.0.0
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="DevBoard Metrics" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.description="NestJS · TypeORM · PostgreSQL"

WORKDIR /app

COPY package*.json ./

# --omit=dev installs only production dependencies; devDependencies stay out of the final image
RUN npm ci --omit=dev

COPY --from=builder /build/dist ./dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/main"]
