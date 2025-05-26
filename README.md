# EVV Assignment

A modern Electronic Visit Verification (EVV) web application for home care agencies, featuring a professional Node.js + TypeScript backend and a React + TypeScript frontend. The system provides secure, role-based access for Admins and Caregivers to manage and track client visits and shifts efficiently.

---

## 📁 Directory Structure

```
.
├── frontend/   # React + Vite + Tailwind CSS frontend
├── server/     # Node.js + Express + Prisma backend
```

---

## ⚡ Prerequisites

- **Node.js v20** (required for both frontend and backend)
- **npm v9 or higher**

> **Note:** This project is tested and supported on Node.js 20. Please ensure you are using the correct version to avoid compatibility issues.

---

## 🚀 Quick Start

### 1. Clone the repository
```sh
git clone <repo-url>
cd <repo-root>
```

### 2. Setup the Backend (server)
```sh
cd server
npm install
# Configure environment variables in .env (see server/README.md)
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
- The backend will run at [http://localhost:3000](http://localhost:3000)
- Swagger API docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 3. Setup the Frontend (frontend)
```sh
cd ../frontend
npm install
npm run dev
```
- The frontend will be available at [http://localhost:5173](http://localhost:5173)

---

## 👤 Demo User Accounts

| **Role**      | **Email**                | **Password**   | **Access**                                      |
|---------------|--------------------------|----------------|-------------------------------------------------|
| **Admin**     | admin@example.com        | admin123       | Full administrative access to all features       |
| **Caregiver** | caregiver@example.com    | caregiver123   | Limited to assigned shifts and visit logging     |

> Use these demo accounts to log in and explore the app as an Admin or Caregiver.

---

## 🖥️ Main Features

- **Admin**
  - Manage users (admins and caregivers)
  - Manage clients and their shifts
  - View all shifts and visits
- **Caregiver**
  - View only their assigned shifts
  - Log visit start/end for their assigned shifts
  - View their own visit history
- **Authentication**
  - JWT-based authentication
  - Role-based access control
  - Secure password hashing
- **API Documentation**
  - Swagger UI at `/api-docs` (backend)

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, React Query, React Hook Form, Zod, Axios, Heroicons
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM (SQLite by default), JWT, Zod, Jest, Supertest, Swagger/OpenAPI

---

## 📑 More Information

- [frontend/README.md](./frontend/README.md) — Full details on the frontend setup, features, and usage
- [server/README.md](./server/README.md) — Full details on the backend setup, API, and database

---

## ℹ️ Notes

- Ensure the backend server is running and accessible at the configured API URL for full frontend functionality.
- For database inspection, use Prisma Studio:
  ```sh
  cd server
  npx prisma studio
  ```
- For production, switch to a production-grade database and update `DATABASE_URL` in the backend.

---
