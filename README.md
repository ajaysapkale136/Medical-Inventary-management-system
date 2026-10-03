# MediStock Medical Inventory

React is built into the Spring Boot application. The application serves both the API and frontend from port `8080`.

## Requirements

- Java 21
- MySQL 8
- Node.js 22 (Maven installs the pinned version during the build)

## Configuration

Copy `.env.example` values into your shell or deployment secret manager. Do not commit a real `.env` file.

```text
DB_URL=jdbc:mysql://localhost:3306/medical_inventory
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
ADMIN_BOOTSTRAP_TOKEN=a-long-random-one-time-token
CORS_ALLOWED_ORIGINS=https://your-frontend-domain
SESSION_COOKIE_SECURE=true
DDL_AUTO=update
```

`ADMIN_BOOTSTRAP_TOKEN` only authorizes first-administrator registration. Leave it unset after an administrator account exists. `DDL_AUTO=update` preserves existing tables and data; this project does not run destructive schema commands.

## Run locally

```powershell
$env:DB_URL = 'jdbc:mysql://localhost:3306/medical_inventory'
$env:DB_USERNAME = 'your_mysql_user'
$env:DB_PASSWORD = 'your_mysql_password'
$env:ADMIN_BOOTSTRAP_TOKEN = 'a-long-random-token'
.\mvnw.cmd spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080). The Vite server is optional:

```powershell
cd frontend
npm install
npm run dev
```

It proxies `/api` to `http://localhost:8080`.

## Build and test

```powershell
cd frontend
npm run lint
npm run build
cd ..
.\mvnw.cmd test
.\mvnw.cmd package
```

The Maven package build also builds the frontend and packages it into the Spring Boot JAR.

## Docker

Set `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`, and `ADMIN_BOOTSTRAP_TOKEN` in the shell, then run:

```powershell
docker compose up --build
```

Compose uses a named MySQL volume. Do not run `docker compose down -v` against a database with data you need to retain.

## Authentication and roles

Authentication uses an HTTP-only server session cookie. Login routes users to their dashboard:

- `ADMIN` -> `/admin`
- `PHARMACIST` -> `/pharmacy`
- `STAFF` -> `/staff`

The backend enforces API permissions; frontend route guards only control navigation.

## Saved settings

- Profile changes use `/api/auth/profile`.
- Personal dashboard settings use `/api/preferences`.
- Organization settings use `/api/system-settings` and are administrator-only.
