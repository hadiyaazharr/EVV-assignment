# EVV Assignment Server

A professional Node.js + TypeScript backend for Electronic Visit Verification (EVV), featuring a clean, layered architecture, robust authentication, and role-based access control.

---

## ⚡ Prerequisites

- **Node.js v20** (required)
- npm v9 or higher

> **Note:** This project is tested and supported on Node.js 20. Please ensure you are using the correct version to avoid compatibility issues.

---

## 📋 Project Overview

This server powers the EVV system, enabling home care agencies to manage clients, users, shifts, and visits. It supports two roles: **Admin** and **Caregiver**.

---

## 👤 User Roles & Permissions

### Admin
- **Full access** to all system features.
- Manage users (admins and caregivers).
- Manage clients and their shifts.
- View all shifts and visits in the system.

### Caregiver
- **Limited access** focused on their own work.
- View only their assigned shifts.
- Log visit start/end for their assigned shifts.
- View their own visit history.

---

## 🗄️ Database Schema

- **Role**: Admin, Caregiver
- **User**: Linked to a role, can be assigned as a caregiver
- **Client**: Represents a client receiving care
- **Shift**: Assigned to a caregiver and a client
- **Visit**: Start/end logs for a shift

See [`prisma/schema.prisma`](prisma/schema.prisma) for full details.

---

## 🚀 Getting Started

### 1. Install dependencies

Make sure you are using Node.js 20:

```sh
node -v
# Should output: v20.x.x
```

Then install dependencies:

```sh
npm install
```

### 2. Configure environment

Create a `.env` file in the `server` directory:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=file:./prisma/dev.db
```

### 3. Initialize and migrate the database

```sh
npx prisma migrate dev --name init
```

### 4. Seed the database (creates default roles, admin, caregiver, clients, and shifts)

```sh
npm run prisma:seed
```

- This will create:
  - `ADMIN` and `CAREGIVER` roles
  - Default admin user (`admin@example.com` / `admin123`)
  - Default caregiver user (`caregiver@example.com` / `caregiver123`)
  - Sample clients and shifts

### 5. Start the development server

```sh
npm run dev
```

The server will run at [http://localhost:3000](http://localhost:3000).

---

## 📑 API Documentation (Swagger)

Interactive API documentation is available via **Swagger UI**.

- **Access it at:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Features:**
  - Browse all endpoints, request/response schemas, and authentication requirements.
  - Try out API requests directly from the browser.
  - All routes are documented with OpenAPI 3.0 and JWT security schemes.

**Example endpoints:**
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive a JWT
- `GET /api/users` — List users (admin only)
- `GET /api/clients` — List clients (admin only)
- `GET /api/shifts` — List shifts (admin/caregiver)
- ...and more

> **Tip:** Use the "Authorize" button in Swagger UI to enter your JWT token for authenticated requests.

---

## 🧪 Running Tests

- Run all tests:
  ```sh
  npm run test
  ```

---

## 🛡️ Authentication & Security

- JWT-based authentication
- Role-based access control (middleware)
- Passwords are securely hashed with bcrypt

---

## 🛠️ Technology Stack

- Node.js, Express.js
- TypeScript
- Prisma ORM (with SQLite by default)
- JWT for authentication
- Zod for validation
- Jest & Supertest for testing
- Swagger/OpenAPI for API docs

---

## 📂 Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── db/             # Database helpers
├── middleware/     # Express middleware (auth, error, logging)
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── tests/          # Automated tests
prisma/
├── schema.prisma   # Database schema
├── seed.ts         # Database seeding script
```

---

## ℹ️ Notes

- The server is designed to work with the EVV frontend.
- You can use [Prisma Studio](https://www.prisma.io/studio) to inspect your database:
  ```sh
  npx prisma studio
  ```
- For production, switch to a production-grade database (e.g., PostgreSQL) and update `DATABASE_URL`.

---

## 📞 Support

For questions or issues, please open an issue in this repository.

---  
