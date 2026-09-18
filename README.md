# MediStock - Medical Inventory Management Platform

Full-stack app: **Spring Boot (Java 17)** backend + **React 18 (Vite, Tailwind)** frontend.

---

## 1. Project structure

```text
medistock/
├── backend/                         # Spring Boot API
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/medistock/
│       ├── MediStockApplication.java
│       ├── config/       SecurityConfig, DataSeeder
│       ├── security/     JwtUtil, JwtAuthenticationFilter, OAuth2SuccessHandler, CustomUserDetailsService
│       ├── entity/       User, Role, Medicine, Category, Supplier, StockMovement, Purchase, Notification
│       ├── repository/   Spring Data JPA repositories
│       ├── service/      UserService, MedicineService, SupplierService, PurchaseService,
│       │                 DashboardService, NotificationService, ReportService, AlertScheduler
│       ├── controller/   Auth, User, Medicine, Supplier, Category, Purchase, Dashboard,
│       │                 Notification, Report controllers
│       ├── dto/          Request/response objects
│       └── exception/    GlobalExceptionHandler
│   └── src/main/resources/application.properties (+ application-prod.properties)
│   └── src/test/java/com/medistock/  JUnit + Mockito tests
├── frontend/                        # React app
│   └── src/
│       ├── api/          axios.js (JWT interceptor), services.js (all API calls)
│       ├── context/      AuthContext.jsx (Context API)
│       ├── components/   Layout, ProtectedRoute, StatCard, StockBadge
│       └── pages/        Login, ForgotPassword, ResetPassword, OAuth2Redirect,
│                         Dashboard, Inventory, Suppliers, ExpiryTracking,
│                         Reports, Notifications, Users, Profile
├── database/
│   ├── schema_mysql.sql       # schema + seed data + report queries
│   └── schema_postgres.sql    # production schema
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## 2. Database setup (SQL)

MySQL (development):

```bash
mysql -u root -p < database/schema_mysql.sql
```

PostgreSQL (production):

```bash
psql -U postgres -f database/schema_postgres.sql
```

`database/schema_mysql.sql` also contains ready-made report queries (low stock,
expired, inventory value, supplier performance, stock movements).

> The backend can also create the tables itself (`spring.jpa.hibernate.ddl-auto=update`)
> and seeds the demo users automatically on first start.

---

## 3. Run the backend (IntelliJ IDEA)

1. `File > Open` -> select the `backend` folder (it is a Maven project).
2. Wait for Maven to download the dependencies.
3. Edit `src/main/resources/application.properties` -> set your MySQL username/password.
4. Right-click `MediStockApplication.java` -> **Run**.
5. API runs on http://localhost:8080

Terminal alternative:

```bash
cd backend
mvn clean spring-boot:run         # run JUnit + Mockito tests
```

---

## 4. Run the frontend (VS Code)

1. Open the `medistock` folder in VS Code.
2. Recommended extensions: *Extension Pack for Java*, *Spring Boot Extension Pack*,
   *Tailwind CSS IntelliSense*, *ESLint*.
3. In the VS Code terminal:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm test           # React Testing Library tests
```

To run the backend from VS Code instead of IntelliJ: open `MediStockApplication.java`
and click **Run** above the `main` method (Java extension pack required).

---

## 5. Demo logins

| Role       | Email                      | Password    |
|------------|----------------------------|-------------|
| Admin      | admin@medistock.com        | Admin@123   |
| Pharmacist | pharmacist@medistock.com   | Pharma@123  |
| Staff      | staff@medistock.com        | Staff@123   |

**Role hierarchy:** Admin creates Pharmacists + Staff, Pharmacist creates Staff only,
nobody can create an Admin (enforced in `UserService.createUser`).

---

## 6. Main API endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | public |
| POST | `/api/auth/forgot-password` / `/reset-password` | public |
| GET  | `/oauth2/authorization/google` | public (Google login) |
| GET/PUT | `/api/users/me`, `/api/users/me/password` | any logged-in user |
| GET/POST | `/api/users` | Admin, Pharmacist |
| GET | `/api/medicines?keyword=&categoryId=&supplierId=&stockStatus=` | all |
| POST/PUT | `/api/medicines`, `/api/medicines/{id}` | Admin, Pharmacist |
| PATCH | `/api/medicines/{id}/add-stock` / `remove-stock` | all |
| GET | `/api/medicines/low-stock`, `/near-expiry`, `/expired`, `/{id}/history` | all |
| CRUD | `/api/suppliers`, `/api/categories`, `/api/purchases` | Admin/Pharmacist write |
| GET | `/api/dashboard/stats` | all |
| GET | `/api/notifications` | all |
| GET | `/api/reports/excel?type=inventory`, `/api/reports/pdf?type=expired` | Admin, Pharmacist |

---

## 7. Optional integrations

Everything below is **disabled by default** so the app runs without extra accounts.
Enable in `application.properties`:

- Email: `medistock.mail.enabled=true` + Gmail app password
- Twilio SMS: `medistock.twilio.enabled=true` + SID / token / numbers
- Firebase push: `medistock.fcm.enabled=true` + service-account JSON
- Google OAuth2: set `client-id` / `client-secret`, redirect URI
  `http://localhost:8080/login/oauth2/code/google`

---

## 8. Deployment

```bash
docker compose up --build      # db + backend + frontend
```

Production uses PostgreSQL: run with `--spring.profiles.active=prod` and set
`DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`.
GitHub Actions (`.github/workflows/ci.yml`) builds and tests both apps on every push.
