# Troubleshooting "Failed to fetch data" Errors

## Quick Diagnosis

If you're seeing "Failed to fetch data" errors throughout the application, follow these steps:

## ✅ Step 1: Verify Server is Running

**Check if backend server is running:**
```bash
cd server
venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

**Verify server is accessible:**
- Open browser: http://localhost:8000/api/health
- Should return: `{"status":"healthy","app":"Hairskiin CRM","version":"1.0.0"}`

## ✅ Step 2: Verify Frontend is Running

**Start the frontend:**
```bash
cd client
npm install  # If not already done
npm run dev
```

**Verify frontend is accessible:**
- Open browser: http://localhost:5173
- Should show the login page

## ✅ Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for specific error messages:
   - `Network Error` - Server not running or proxy issue
   - `401 Unauthorized` - Not logged in or token expired
   - `CORS error` - Backend CORS configuration issue
   - `ECONNREFUSED` - Server not running on port 8000

## ✅ Step 4: Verify Authentication

**Check if you're logged in:**
1. Open browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Check for:
   - `token` - Should exist if logged in
   - `user` - Should contain user data

**If token is missing:**
- Log out and log back in
- Use credentials: `admin` / `admin123`

## ✅ Step 5: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to fetch data (refresh page)
4. Look for failed requests:
   - **Red requests** = Failed
   - Click on failed request to see details
   - Check **Response** tab for error message

## ✅ Step 6: Verify Proxy Configuration

**Check `client/vite.config.js`:**
```javascript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8000',  // Must match server port
    changeOrigin: true
  }
}
```

**If changed, restart frontend:**
```bash
# Stop frontend (Ctrl+C)
# Restart
npm run dev
```

## ✅ Step 7: Common Issues & Solutions

### Issue 1: Server Not Running
**Symptom:** All API calls fail with "Network Error"
**Solution:** Start the server (see Step 1)

### Issue 2: Wrong Port
**Symptom:** 404 errors or connection refused
**Solution:** 
- Check server is on port 8000
- Check vite.config.js proxy target

### Issue 3: Not Logged In
**Symptom:** 401 Unauthorized errors
**Solution:**
- Log in at http://localhost:5173/login
- Check localStorage has `token`

### Issue 4: CORS Error
**Symptom:** CORS policy error in console
**Solution:** 
- Backend already has CORS enabled
- If still occurs, check server is running

### Issue 5: Database Issues
**Symptom:** 500 errors or empty responses
**Solution:**
```bash
cd server
python migrate_all_tables.py  # Run migration
python seed.py  # Seed users if needed
```

## ✅ Step 8: Test API Directly

**Test endpoints directly in browser or Postman:**

1. **Health Check:**
   - http://localhost:8000/api/health

2. **Login (get token first):**
   - POST http://localhost:8000/api/auth/login
   - Body: `username=admin&password=admin123`
   - Content-Type: `application/x-www-form-urlencoded`

3. **Get Clients (with token):**
   - GET http://localhost:8000/api/clients
   - Headers: `Authorization: Bearer YOUR_TOKEN`

## 🔧 Quick Fix Commands

**If nothing works, try this complete reset:**

```bash
# Terminal 1 - Backend
cd "C:\Programming\Work\Hairskiin CRM\server"
venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend  
cd "C:\Programming\Work\Hairskiin CRM\client"
npm run dev
```

**Then:**
1. Open http://localhost:5173
2. Login with `admin` / `admin123`
3. Check if data loads

## 📞 Still Having Issues?

1. Check server logs in Terminal 1 for errors
2. Check browser console for specific error messages
3. Verify both servers are running on correct ports
4. Try clearing browser cache and localStorage
5. Restart both servers

---

**Last Updated:** Based on comprehensive diagnosis - all backend components are working correctly.
