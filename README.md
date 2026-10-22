# MediStock Medical Inventory

React is built into the Spring Boot application. The application serves both the API and frontend from port `8080`.

## Requirements

- Java 21
- MySQL 8
- Node.js 22 (Maven installs the pinned version during the build)

## Configuration

Copy `.env.example` values into your shell or deployment secret manager. Do not commit a real `.env` file.

```text
DB_URL=jdbc:mysql://mysql-3c3756e4-medical-mannagement.c.aivencloud.com:12923/defaultdb?sslMode=REQUIRED&allowPublicKeyRetrieval=true
DB_USERNAME=avnadmin
DB_PASSWORD=<your_aiven_password>
ADMIN_BOOTSTRAP_TOKEN=a-long-random-one-time-token
CORS_ALLOWED_ORIGINS=*
SESSION_COOKIE_SECURE=false
DDL_AUTO=update
```

`ADMIN_BOOTSTRAP_TOKEN` only authorizes first-administrator registration. Leave it unset after an administrator account exists. `DDL_AUTO=update` preserves existing tables and data; this project does not run destructive schema commands.

## Run locally

```powershell
$env:DB_URL = 'jdbc:mysql://mysql-3c3756e4-medical-mannagement.c.aivencloud.com:12923/defaultdb?sslMode=REQUIRED&allowPublicKeyRetrieval=true'
$env:DB_USERNAME = 'avnadmin'
$env:DB_PASSWORD = '<your_aiven_password>'
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

## Deploy on Render

This project contains a multi-stage `Dockerfile` and a `render.yaml` Blueprint ready for deployment on [Render](https://render.com).

### Live Aiven Cloud Database Configuration
The application is pre-configured to connect to your live Aiven MySQL cloud instance:
- **Host:** `mysql-3c3756e4-medical-mannagement.c.aivencloud.com`
- **Port:** `12923`
- **Database:** `defaultdb`
- **User:** `avnadmin`
- **Password:** Set in Render environment variables
- **JDBC URL:** `jdbc:mysql://mysql-3c3756e4-medical-mannagement.c.aivencloud.com:12923/defaultdb?sslMode=REQUIRED&allowPublicKeyRetrieval=true`

*(The backend also includes an automatic URI parser: you can provide either `jdbc:mysql://...` or standard URI `mysql://avnadmin:<password>@mysql-3c3756e4-medical-mannagement.c.aivencloud.com:12923/defaultdb?ssl-mode=REQUIRED`)*

### Step-by-step:
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service** (or **Blueprint**).
3. Connect your GitHub repository: `ajaysapkale136/Medical-Inventary-management-system`.
4. Choose **Docker** as the Runtime (Render automatically detects `./Dockerfile`).
5. Configure Environment Variables in the Render settings:
   - `PORT`: `8080`
   - `SERVER_ADDRESS`: `0.0.0.0`
   - `DB_URL`: `jdbc:mysql://mysql-3c3756e4-medical-mannagement.c.aivencloud.com:12923/defaultdb?sslMode=REQUIRED&allowPublicKeyRetrieval=true`
   - `DB_USERNAME`: `avnadmin`
   - `DB_PASSWORD`: `<your_aiven_password>`
   - `DDL_AUTO`: `update`
   - `CORS_ALLOWED_ORIGINS`: `*`
6. Click **Create Web Service**. Render builds the React frontend, packages the Spring Boot JAR, connects to Aiven, seeds default users, and serves the live application.

## Dashboard Login Credentials

| Role | Dashboard URL | Email / Username | Password |
|---|---|---|---|
| **Admin** | `/admin` | `admin@medistock.com` | `Admin@1234` |
| **Pharmacist** | `/pharmacy` | `pharmacist@medistock.com` | `Pharma@1234` |
| **Staff** | `/staff` | `staff@medistock.com` | `Staff@1234` |

Additional accounts:
- Pharmacist: `sneha.nair@medistock.com` / `Staff@1234`
- Staff: `amit.patel@medistock.com` / `Staff@1234`

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
