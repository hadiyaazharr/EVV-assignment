# EVV Frontend

> **ℹ️ Demo User Accounts for Quick Login**
>
> | **Role**      | **Email**                | **Password**   | **Access**                                      |
> |---------------|--------------------------|----------------|-------------------------------------------------|
> | **Admin**     | admin@example.com        | admin123       | Full administrative access to all features       |
> | **Caregiver** | caregiver@example.com    | caregiver123   | Limited to assigned shifts and visit logging     |
>
> **Use these demo accounts to log in and explore the app as an Admin or Caregiver.**

---

## ⚡ Prerequisites

- **Node.js v20** (required)
- npm v9 or higher

> **Note:** This project is tested and supported on Node.js 20. Please ensure you are using the correct version to avoid compatibility issues.

---

## 🎥 Demo Video

Watch a walkthrough of the EVV app here:  
[https://www.awesomescreenshot.com/video/40244448?key=0e3027fad09f868d8a082f4c5e8ed806](https://www.awesomescreenshot.com/video/40244448?key=0e3027fad09f868d8a082f4c5e8ed806)

---

A modern Electronic Visit Verification (EVV) web application frontend built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. This application provides secure, role-based access for Admins and Caregivers to manage and track client visits and shifts efficiently.

---

## 📋 Project Overview

This frontend is part of the EVV system, designed to:
- Streamline client and user management for home care agencies
- Enable caregivers to log and track visits
- Provide admins with full oversight of users, clients, and shifts

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Installation
1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the development server:**
   ```sh
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).
3. **Run tests:**
   ```sh
   npm run test
   ```

---

## 👤 User Roles & Permissions

### Admin
Admins have comprehensive access and can:
- View all shifts in the system via the Admin Dashboard
- Manage clients: add, edit, search, and view clients and their associated shifts
- Manage users: add new users (admins or caregivers), search, and view all users
- Access all scheduled shifts for all clients and caregivers

### Caregiver
Caregivers have focused access and can:
- View only their assigned shifts via the Caregiver Dashboard
- Log visits: start and end visits for their assigned shifts
- View their own visit history

---

## 🔐 Authentication & Access
- **Registration:** New users can register by providing their name, email, password, and selecting a role (Admin or Caregiver)
- **Login:** Existing users authenticate with email and password
- **Role-based Routing:** Users are automatically redirected to the appropriate dashboard after login

### Demo Users
The application comes with two pre-configured demo users for testing:

#### Admin User
- **Email:** admin@example.com
- **Password:** admin123
- **Access:** Full administrative access to all features

#### Caregiver User
- **Email:** caregiver@example.com
- **Password:** caregiver123
- **Access:** Limited to assigned shifts and visit logging

---

## 🖥️ Main Application Screens
- **Login:** `/login`
- **Register:** `/register`
- **Admin Dashboard:** `/` (for admins)
- **Caregiver Dashboard:** `/` (for caregivers)
- **Client Management:** `/clients` (admin only)
- **User Management:** `/users` (admin only)

---

## 🛠️ Technology Stack
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (utility-first styling)
- **React Router** (routing)
- **React Query** (data fetching & caching)
- **React Hook Form** + **Zod** (form management & validation)
- **Axios** (HTTP client)
- **Heroicons** (icons)

---

## 🧪 Testing
- [Vitest](https://vitest.dev/)
- [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)
- [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)

To run all tests:
```sh
npm run test
```

---

## 📸 Screenshots
Screenshots of the application (login, dashboards, management pages, etc.) can be added here. Please provide images if you would like them included.

---

## 📁 Project Structure
- `src/pages/` — Main application pages (Login, Register, Dashboards, Management)
- `src/components/` — Reusable UI components
- `src/contexts/` — Context providers (e.g., authentication)
- `src/lib/` — API clients and utility functions
- `src/types/` — TypeScript type definitions
- `src/hooks/` — Custom React hooks

---

## ℹ️ Additional Notes
- This frontend is designed to work with a compatible backend API (see `server/README.md` for backend setup).
- Ensure the backend server is running and accessible at the configured API URL for full functionality.

---
