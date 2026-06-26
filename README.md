# DevBoard

DevBoard is a project and task management dashboard. Its real purpose is to serve as a hands-on playground for Docker and Docker Compose. The application is functional, but the infrastructure is the point.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend API | FastAPI, SQLAlchemy (async), PostgreSQL, Redis |
| Metrics Service | NestJS, TypeORM, PostgreSQL |
| Reverse Proxy | Nginx |

## Architecture

All traffic enters through Nginx, which routes by path to the appropriate service. Two isolated bridge networks enforce boundaries: `backend_net` connects the backends, PostgreSQL, Redis, and Nginx; `frontend_net` connects Nginx and the frontend. The frontend container has no direct route to the database.

```
Browser → Nginx :8084
  ├── /api/*      → backend-api :8000  (FastAPI → PostgreSQL, Redis)
  ├── /metrics/*  → backend-metrics :3001  (NestJS → PostgreSQL)
  └── /*          → frontend :84  (React)
```

## Docker Concepts Covered

- **Multi-stage builds** — every service has a builder stage and a minimal production stage; compilers and dev tools never reach the final image
- **Named volumes** — persistent storage for PostgreSQL, Redis, and Nginx logs
- **Bind mounts** — source code mounted at runtime in development for hot-reload
- **tmpfs** — in-memory scratch space on the API container, wiped on stop
- **Anonymous volumes** — protect compiled `node_modules` from being overwritten by host bind mounts
- **Custom bridge networks** — two networks with Nginx as the only shared member
- **Health checks** — every service declares a `HEALTHCHECK`; `depends_on` uses `condition: service_healthy`
- **Three-file Compose strategy** — base config, auto-loaded dev override, explicit prod override
- **Docker Secrets** — passwords mounted as files in production instead of plain environment variables
- **Resource limits** — CPU and memory limits and reservations on every production service
- **Build arguments and OCI labels** — version and build date baked into every image
- **Restart policies** — `unless-stopped` on all production services

## Running

**Development** — loads `docker-compose.yml` + `docker-compose.override.yml` automatically:

```bash
cp .env.example .env
docker compose up --build
```

**Production** — loads base + prod file explicitly:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Ports (Development)

| Service | Port |
|---|---|
| Nginx | 8084 |
| FastAPI | 8000 |
| NestJS | 3001 |
| Vite | 5173 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| pgAdmin | 5050 |

If any container crashes at 3am, that is a Docker problem, not a you problem. Probably.
