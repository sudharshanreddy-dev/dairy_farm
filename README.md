# DairyFarm Pro v2.0 Technical Documentation

Welcome to the comprehensive technical documentation for **DairyFarm Pro**, a professional-grade farm management and financial analytics system.

---

## 🏗️ System Architecture

DairyFarm Pro is built using a modern decoupled architecture:

*   **Backend**: Node.js Express server with Prisma ORM and PostgreSQL.
*   **Frontend**: React Native mobile application built with Expo and Expo Router.
*   **Security**: JWT-based authentication with Bcrypt password hashing.
*   **Real-time Logic**: Automatic inventory management and financial KPI calculation.

---

## 🛡️ Backend Documentation (`/backend`)

### 📊 Database Schema (Prisma)
The database is structured to support both operational logging and business intelligence.

#### Core Models:
- **User**: Stores farm profile, credentials, and settings.
- **Cattle**: Central animal registry with family tree (Sire/Dam) relations.
- **FeedingLog [v2.0]**: Tracks bulk feed rations for groups; linked to Inventory.
- **MilkProduction**: Detailed yield tracking per animal.
- **Inventory**: Stock management for Feed, Medicine, and Equipment.
- **InventoryTransaction**: Automatic audit trail for stock additions/deductions.
- **Alert**: System-generated notifications (Low Stock, Vaccination Due).

### 🚀 API Reference
All routes are prefixed with `/api`. Most routes require a `Bearer <token>` header.

#### 🔐 Authentication (`/auth`)
- `POST /register`: Create a new farmer account.
- `POST /login`: Generate session JWT.
- `POST /change-password`: Secure user credential update.

#### 🐄 Cattle Registry (`/cattle`)
- `GET /`: List all cattle for the logged-in user.
- `POST /`: Register a new animal (auto-generates unique Tag IDs).
- `GET /:id`: Full animal details including health/production history.
- `PUT /:id`: Update animal status or details.
- `DELETE /:id`: Remove animal record.

#### 🚜 Farm Operations (`/farm`)
- `GET /dashboard`: High-level summary stats for the home screen.
- **Feeding**:
  - `GET /feeding`: History of bulk feeding sessions.
  - `POST /feeding`: Log new ration; **automatically deducts stock** from Inventory.
- **Analytics [v2.0]**:
  - `GET /analytics`: Advanced financial metrics including **Cost per Liter (CPL)**, **Feed Efficiency**, and **Expense Breakdown** donut data.

#### 📄 Reports (`/reports`)
- `GET /financials`: Export full history as a CSV file.

---

## 📱 Frontend Documentation (`/frontend`)

### 🧭 Navigation Map
The app uses **Expo Router** for nested, file-based navigation.

*   `app/(app)/dashboard.tsx`: Main overview with interactive KPI cards.
*   `app/(app)/records.tsx`: Central menu for logging Milk, Feeding, Health, etc.
*   `app/(app)/analytics.tsx`: Professional dashboard with Donut charts and efficiency metrics.
*   `app/records/bulk-feeding.tsx`: Specialized form for group-based feed logging.
*   `app/(app)/cattle/[id].tsx`: Detail view featuring the **Vertical History Timeline**.

### 🎨 Design System
*   **Theme**: Support for both Light and Dark modes via `ThemeContext`.
*   **Visual Philosophy**: Modern, high-contrast UI with glassmorphism effects and micro-animations.
*   **Typography**: Uses standard system fonts with weighted hierarchy for readability.

### 🧪 State & Data Flow
*   **Context API**: `AuthContext` handles global login state and API tokens.
*   **Axios**: Centralized client in `src/api/axios.ts` with interceptors for automatic JWT injection.

---

## ⚙️ Setup & Development

### Backend Setup:
1.  Navigate to `backend/`.
2.  Install: `npm install`.
3.  Config: Create `.env` with `DATABASE_URL` and `JWT_SECRET`.
4.  Database: `npx prisma db push`.
5.  Seed: `npm run seed`.
6.  Start: `npm run dev`.

### Frontend Setup:
1.  Navigate to `frontend/`.
2.  Install: `npm install`.
3.  Config: Update `API_URL` in `src/api/axios.ts` to match your server IP.
4.  Start: `npx expo start`.

---

## 🧪 Testing Environment
The project includes a robust **Jest** test suite in `backend/tests/`.
- Run tests: `npm test`.
- Coverage includes Auth logic, Bulk Feeding, Advanced Analytics calculations, and Authorization checks.

---

Developed as a Professional Farm Intelligence Platform. Build v2.0.
