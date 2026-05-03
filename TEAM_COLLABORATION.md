# 🤝 Team Collaboration Guide - Hairskiin CRM

This document outlines the project structure and division of labor for a **5-member development team** to finalize and maintain the Hairskiin CRM.

---

## 🏗 Project Architecture

The project is split into two main parts:
1.  **Frontend**: React (Vite) + Custom CSS (`/client`)
2.  **Backend**: FastAPI + SQLAlchemy + MySQL/SQLite (`/server`)

---

## 👥 Member Assignments & File Responsibility

To avoid merge conflicts, each member is assigned specific feature modules.

### **Member 1: Core System & Security (Team Lead)**
*   **Focus**: Authentication, JWT, User Roles, and Super Admin Dashboard.
*   **Key Files to Commit**:
    *   **Backend**: `server/auth.py`, `server/routers/users.py`, `server/models.py` (User Table), `server/main.py`
    *   **Frontend**: `client/src/pages/Login.jsx`, `client/src/pages/Users.jsx`, `client/src/pages/SuperAdminDashboard.jsx`, `client/src/context/AuthContext.jsx`

### **Member 2: CRM & Appointments (Front Desk)**
*   **Focus**: Client profiles, search functionality, and appointment scheduling.
*   **Key Files to Commit**:
    *   **Backend**: `server/routers/clients.py`, `server/routers/appointments.py`, `server/routers/search.py`
    *   **Frontend**: `client/src/pages/Clients.jsx`, `client/src/pages/ClientProfile.jsx`, `client/src/pages/Appointments.jsx`

### **Member 3: Billing & Financials (Accounts)**
*   **Focus**: Invoice generation, payment status, and thermal receipt printing.
*   **Key Files to Commit**:
    *   **Backend**: `server/routers/bills.py`, `server/models.py` (Bills & Payments)
    *   **Frontend**: `client/src/pages/Billing.jsx`, `client/src/components/Invoice.jsx`, `client/80MM_RECEIPT_DEMO.html`

### **Member 4: Operations & Inventory (Supply Chain)**
*   **Focus**: Product stock management, treatment services, and clinical procedures.
*   **Key Files to Commit**:
    *   **Backend**: `server/routers/products.py`, `server/routers/treatments.py`
    *   **Frontend**: `client/src/pages/Products.jsx`, `client/src/pages/Treatments.jsx`, `client/src/pages/ProvideTreatment.jsx`

### **Member 5: Infrastructure & Analytics (DevOps)**
*   **Focus**: Dashboards, revenue reports, database backups, branch/dept management.
*   **Key Files to Commit**:
    *   **Backend**: `server/routers/analytics.py`, `server/routers/branches.py`, `server/routers/departments.py`, `server/routers/backup.py`
    *   **Frontend**: `client/src/pages/Analytics.jsx`, `client/src/pages/Branches.jsx`, `client/src/pages/Departments.jsx`, `client/src/pages/BackupRestore.jsx`

---

## 🛠 Shared Files (Handle with Care!)
These files are used by everyone. Communicate before changing!
- `client/src/App.jsx` (Routes)
- `client/src/api.js` (API endpoints)
- `client/src/index.css` (Styles)
- `server/database.py` (DB connection)
- `server/models.py` (Schema)

---

## 🚀 Git Workflow Strategy

### 1. Branching Model
- **`main`**: Production-ready code. Never commit directly here.
- **`develop`**: Integration branch for all features.
- **`feature/[member-name]-[feature]`**: Your personal working branch.

### 2. Daily Workflow
1.  **Pull latest**: `git pull origin develop`
2.  **Create branch**: `git checkout -b feature/john-billing`
3.  **Work & Commit**: 
    ```bash
    git add .
    git commit -m "Add: Thermal receipt printing logic"
    ```
4.  **Push**: `git push origin feature/john-billing`
5.  **Merge**: Open a Pull Request (PR) on GitHub to `develop`.

---

## 📦 How to Commit the Project (Initial Setup)

If you are uploading this project to GitHub for the first time:

1. **Initialize Git**: `git init`
2. **Add Remote**: `git remote add origin [YOUR_GITHUB_URL]`
3. **Add Ignore**: Ensure `.gitignore` includes `node_modules/`, `venv/`, and `.env`.
4. **First Commit**:
   ```bash
   git add .
   git commit -m "Initial Commit: Hairskiin CRM Project Structure"
   git push -u origin main
   ```

---

## 📄 File Structure Overview

```text
Hairskiin-CRM/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # Assigned by feature (see above)
│   │   └── context/        # Auth state
│   └── public/             # Static assets
├── server/                 # Backend (FastAPI)
│   ├── routers/            # API endpoints (Assigned by feature)
│   ├── venv/               # (DO NOT COMMIT)
│   ├── main.py             # Entry point
│   ├── models.py           # DB Models
│   └── database.py         # DB connection
├── TEAM_COLLABORATION.md   # This guide
└── README.md               # User guide
```
