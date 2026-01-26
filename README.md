# Hairskiin CRM

**Complete Client, Appointment & Billing Management System for Hair & Skin Clinics**

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🌟 Features

- **Client Management** - Add, search, and track customer history
- **Appointment Booking** - Schedule with auto-price fill and availability check
- **Billing System** - Generate invoices with treatments & products
- **Product Inventory** - Stock tracking with low-stock alerts
- **Treatment Services** - Manage pricing and categories
- **Analytics Dashboard** - Revenue, trends, and business insights
- **Role-Based Access** - Admin, Manager, Receptionist roles
- **Global Search** - Quickly find clients, treatments, or products

## 🚀 Quick Start

### Easy Setup (Windows)

**Backend:**
1. Go to `server` folder
2. **Double-click `setup.bat`** (installs everything automatically)
3. **Double-click `start_server.bat`** to run the server

**Frontend:**
```bash
cd client
npm install
npm run dev
```

### Access the App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/docs (Swagger UI)

## 🔑 Login Credentials

Default accounts are created automatically:

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Manager** | `manager` | `manager123` |
| **Receptionist** | `reception` | `reception123` |

> **Note**: Change these passwords after first login!

## 👤 First Login

1. Navigate to http://localhost:5173/login
2. Click "Create one" to register the first admin account
3. Enter username, password, and full name
4. Login with your credentials

## 📁 Project Structure

```
Hairskiin CRM/
├── server/                 # FastAPI Backend
│   ├── main.py             # App entry point
│   ├── database.py         # SQLAlchemy config
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # JWT authentication
│   └── routers/            # API endpoints
│       ├── users.py
│       ├── clients.py
│       ├── treatments.py
│       ├── products.py
│       ├── appointments.py
│       ├── bills.py
│       ├── analytics.py
│       └── search.py
│
└── client/                 # React Frontend
    ├── src/
    │   ├── App.jsx         # Main app with routing
    │   ├── api.js          # API client
    │   ├── index.css       # Design system
    │   ├── context/        # Auth context
    │   ├── components/     # UI components
    │   └── pages/          # Page components
    └── package.json
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access - users, settings, all data |
| **Manager** | Treatments, products, analytics, reports |
| **Receptionist** | Clients, appointments, billing |

## 💡 Key Workflows

### 1. Client Lookup
Enter phone number → Auto-display client profile with history

### 2. Book Appointment
Select client → Choose treatment (price auto-fills) → Pick date/time → Save

### 3. Generate Bill
Select client → Add treatments/products → Apply discount → Generate invoice

## 🛠 Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, JWT Auth
- **Frontend**: React 18, Vite, Chart.js, Lucide Icons
- **Styling**: Custom CSS with dark theme

## 📊 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login |
| `GET /api/clients` | List clients |
| `GET /api/clients/lookup/{phone}` | Find by phone |
| `GET /api/appointments/today` | Today's schedule |
| `POST /api/bills` | Create invoice |
| `GET /api/analytics/dashboard` | Business metrics |
| `GET /api/search?q=...` | Global search |

Full API docs at `/api/docs`

## 🎨 Design

- Premium dark theme with purple/rose gradients
- Glassmorphism effects
- Smooth animations
- Fully responsive for all devices
- Global search bar for quick navigation

---

**Built with ❤️ for Hair & Skin Clinics**
