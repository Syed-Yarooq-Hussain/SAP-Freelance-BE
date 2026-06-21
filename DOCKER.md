# Docker Setup

This project runs with a Nest API container and a PostgreSQL container.

## Start

Make sure Docker Desktop is running, then run:

```bash
docker-compose up --build -d
```

API:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/api
```

## Run Migrations

After the containers are up:

```bash
docker-compose exec api npx sequelize-cli db:migrate
```

If `exec` fails because the API container exited, use:

```bash
docker-compose run --rm api npx sequelize-cli db:migrate
```

## Logs

```bash
docker-compose logs -f api
```

```bash
docker-compose logs -f db
```

## Stop

```bash
docker-compose down
```

To also remove the database volume:

```bash
docker-compose down -v
```

## Environment

Docker Compose uses local `.env` automatically. For a clean Docker env file:

```bash
copy .env.docker.example .env.docker
```

Then run with:

```bash
docker-compose --env-file .env.docker up --build -d
```
