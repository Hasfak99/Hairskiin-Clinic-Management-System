# Hairskiin CRM - Quick Setup Guide

## 🚀 Easy Setup (Windows)

### Backend Setup
1. Open `server` folder
2. **Double-click `setup.bat`**
3. Wait for installation to complete
4. Note the login credentials shown

### Start Backend Server
- **Double-click `start_server.bat`** in the `server` folder
- Server will run on http://localhost:8000

### Frontend Setup
```bash
cd client
npm install
npm run dev
```
Frontend will run on http://localhost:5173

---

## 📋 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Manager** | `manager` | `manager123` |
| **Receptionist** | `reception` | `reception123` |

---

## 🔧 Manual Setup (if batch files don't work)

### Backend
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd client
npm install
npm run dev
```

---

## ✅ Verify Installation

1. Go to http://localhost:5173
2. Login with **admin** / **admin123**
3. You should see the dashboard

---

## 📱 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Database**: `server/hairskiin.db` (SQLite)

---

## 🎯 Next Steps

1. **Add Clients**: Go to Clients → Add Client
2. **Book Appointments**: Appointments → Book Appointment
3. **Create Bills**: Billing → Create Bill
4. **View Analytics**: Analytics → See business insights

---

## ⚠️ Troubleshooting

**If pip install fails:**
- Make sure Python 3.8+ is installed
- Try: `pip install --upgrade pip`
- Run setup.bat as Administrator

**If npm install fails:**
- Make sure Node.js 18+ is installed
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**If servers won't start:**
- Check if ports 8000 and 5173 are available
- Close any other apps using these ports
