# DevBoard

DevBoard is a project and task management dashboard. Its real purpose is to serve as a hands-on playground for Docker and Docker Compose. The application is functional, but the infrastructure is the point.

## Stack

| Layer           | Technology                                     |
| --------------- | ---------------------------------------------- |
| Frontend        | React 18, TypeScript, Vite, Tailwind CSS       |
| Backend API     | FastAPI, SQLAlchemy (async), PostgreSQL, Redis |
| Metrics Service | NestJS, TypeORM, PostgreSQL                    |
| Reverse Proxy   | Nginx                                          |

## Architecture

All traffic enters through Nginx, which routes by path to the appropriate service. Two isolated bridge networks enforce boundaries: `backend_net` connects the backends, PostgreSQL, Redis, and Nginx; `frontend_net` connects Nginx and the frontend. The frontend container has no direct route to the database.

```
Browser → Nginx :8084
  ├── /api/*      → backend-api :8000  (FastAPI → PostgreSQL, Redis)
  ├── /metrics/*  → backend-metrics :3001  (NestJS → PostgreSQL)
  └── /*          → frontend :84  (React)
```

## Docker

### Multi-Stage Builds

Every service uses a multi-stage Dockerfile. The core idea is that building software and running it have different requirements — compilers, type checkers, and package managers are needed at build time but are dead weight in production. Multi-stage builds solve this by using separate stages: a builder stage that has everything needed to compile the code, and a production stage that receives only the output.

The FastAPI image uses a builder stage with `gcc` and `libpq-dev` to compile `asyncpg` and `greenlet`. Those compiled packages are deposited into a custom prefix directory and then copied into a clean `python:3.12-slim` image. The final image has no C compiler.

The NestJS image uses a builder stage with all `devDependencies` to compile TypeScript into `dist/`. The production stage installs only runtime dependencies with `npm ci --omit=dev` and copies `dist/` from the builder. The TypeScript compiler is never in the final image.

The frontend image goes further: the builder stage is Node, the production stage is `nginx:alpine`. The final image has no JavaScript runtime at all — just static files and a web server.

### Volumes

Docker has three types of volumes and this project uses all of them.

**Named volumes** are managed by Docker and persist independently of any container. `postgres_data` and `redis_data` ensure that data survives container restarts, re-creations, and image updates. `nginx_logs` keeps access and error logs across restarts. Named volumes are the right choice for any data that must outlive the container that writes it.

**Bind mounts** link a directory on the host machine directly into a container's filesystem. In development, the source code directories are bind-mounted into each service container. A file change on the host is immediately visible inside the container, which is what enables hot-reload. Bind mounts are not used in production — the code is baked into the image.

**tmpfs** mounts an in-memory filesystem into a container, visible only to that container and wiped the moment it stops. The API container gets a tmpfs at `/tmp/api_scratch`. There is no disk I/O, no persistence, and no data leaking to the host. It is the right choice for scratch space that should never survive a restart.

There is a fourth pattern worth knowing: **anonymous volumes**. When a directory is declared as a volume without a name or host path (e.g., `- /build/node_modules`), Docker creates an unnamed volume and owns it entirely. This is used on the `node_modules` directories of the Node services to prevent the host bind mount from overwriting container-compiled binaries with binaries built for a different operating system.

### Networks

The project defines two custom bridge networks rather than using the default single network that Compose would otherwise create.

`backend_net` connects the two backend services, PostgreSQL, Redis, and Nginx. `frontend_net` connects Nginx and the frontend. Nginx belongs to both networks and is the only service that does. This means the frontend container has no network path to PostgreSQL or Redis — it is physically incapable of reaching them, not merely discouraged from doing so.

Within a network, containers reach each other by service name. The FastAPI service connects to `postgres:5432` and `redis:6379`. Docker's internal DNS resolves those names to the correct container IP addresses automatically.

### Health Checks and Startup Order

Every service declares a `HEALTHCHECK` in its Dockerfile. Docker runs the check on an interval and transitions the container between `starting`, `healthy`, and `unhealthy` states based on the result.

`depends_on` with `condition: service_healthy` makes a service wait for its dependencies to be genuinely ready, not just started. Without this, FastAPI would attempt to connect to PostgreSQL the moment the Postgres container process starts — before Postgres has finished initializing and before the `init.sql` script has run. With `service_healthy`, the startup order is enforced by actual readiness.

### Three-File Compose Strategy

The project splits configuration across three Compose files that Docker Compose merges at runtime.

`docker-compose.yml` is the base. It defines services, networks, named volumes, build contexts, environment variables, health checks, and dependency conditions. It has no environment-specific configuration and is never used alone.

`docker-compose.override.yml` is the development layer. Compose loads this file automatically when no `-f` flag is provided, so running `docker compose up` in development requires no extra flags. It adds bind mounts, switches startup commands to hot-reload variants, exposes internal ports to the host, swaps in the development Nginx config, and adds pgAdmin as a dev-only service.

`docker-compose.prod.yml` is the production layer. It is loaded explicitly. It removes bind mounts, switches to Docker Secrets for credentials, applies resource limits on every service, adds restart policies, and exposes only the Nginx port.

### Docker Secrets

Plain environment variables are convenient but problematic for credentials — they appear in `docker inspect` output, in shell history, and in any tooling that reads container metadata. Docker Secrets solve this by mounting credential files directly into a container's filesystem at `/run/secrets/<name>`, accessible only to that container, stored in memory rather than on disk.

In production, `./secrets/db_password.txt` is declared as a secret at the top level of `docker-compose.prod.yml` and referenced by each service that needs it. PostgreSQL's official image supports `POSTGRES_PASSWORD_FILE` natively and reads the value from the mounted path. For the application services, the file is available at `/run/secrets/db_password` — a production entrypoint script would read it to construct the database connection string before starting the process.

Secret files are excluded from version control via `.gitignore`.

### Resource Limits

Every service in `docker-compose.prod.yml` declares `deploy.resources` with `limits` and `reservations`. The limit is a hard ceiling enforced by the kernel — a container that exceeds its memory limit is killed. The reservation guarantees a minimum allocation. Together they prevent any one service from consuming all available host resources and taking down the rest of the stack.

### Build Arguments and OCI Labels

All three Dockerfiles accept `APP_VERSION` and `BUILD_DATE` as build arguments passed through `build.args` in the Compose files. These are baked into OCI-standard image labels. Running `docker inspect <image>` on any container in the stack will show exactly which version it is and when it was built.

## Running

### Prerequisites

- Docker and Docker Compose installed

### Setup

```bash
cp .env.example .env
```

The default values work out of the box for local development. Adjust any port that conflicts with a service already running on your machine.

### Development

```bash
docker compose up --build
```

Compose automatically merges `docker-compose.yml` and `docker-compose.override.yml`. All services start with hot-reload enabled. The first build takes a few minutes; subsequent builds are faster thanks to layer caching.

```bash
docker compose logs -f
```

```bash
docker compose ps
```

### Production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Only port 8084 is exposed. No pgAdmin, no direct database access, passwords loaded from secret files.

## Ports (Development)

| Service | Port | URL |
|---|---|---|
| Nginx | 8084 | http://localhost:8084 |
| FastAPI | 8000 | http://localhost:8000/docs |
| NestJS | 3001 | http://localhost:3001/health |
| Vite | 5173 | http://localhost:5173 |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| pgAdmin | 5050 | http://localhost:5050 (credentials in `.env`) |

To connect pgAdmin to the database, go to **Add New Server** and use:

| Field | Value |
|---|---|
| Host | `postgres` |
| Port | `5432` |
| Database | `devboard` |
| Username | `POSTGRES_USER` from `.env` |
| Password | `POSTGRES_PASSWORD` from `.env` |

The host must be `postgres` (the Docker service name), not `localhost`.

If any container crashes at 3am, that is a Docker problem, not a you problem. Probably.
