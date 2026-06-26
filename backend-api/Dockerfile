FROM python:3.12-slim AS builder

WORKDIR /build

# gcc and libpq-dev are needed to compile asyncpg and greenlet; they stay in this stage only
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# --prefix deposits packages into /install so we can COPY just that folder into the final stage
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


FROM python:3.12-slim AS production

ARG APP_VERSION=1.0.0
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="DevBoard API" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.description="FastAPI · SQLAlchemy · PostgreSQL · Redis"

WORKDIR /app

COPY --from=builder /install /usr/local

RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --no-create-home appuser

COPY --chown=appuser:appgroup ./app ./app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
