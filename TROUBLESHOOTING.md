# 🔧 Troubleshooting Guide

## 🚨 "Unexpected end of JSON input" Error

This error usually means the frontend can't properly communicate with the backend. Let's fix this step by step.

### Step 1: Check if Backend is Running

1. **Open a new terminal/command prompt**
2. **Navigate to backend folder:**
   ```cmd
   cd backend
   ```
3. **Start the backend:**
   ```cmd
   npm run dev
   ```
4. **You should see:**
   ```
   🚀 CRM Backend server running on port 3000
   📊 Environment: development
   🔗 Health check: http://localhost:3000/health
   ```

### Step 2: Test Backend Connection

1. **Open your browser**
2. **Go to:** `http://localhost:3000/health`
3. **You should see:**
   ```json
   {"status":"OK","timestamp":"...","environment":"development"}
   ```

**If this doesn't work:**
- ✅ Check if backend is running on port 3000
- ✅ Check if another app is using port 3000
- ✅ Try changing PORT in .env to 3001

### Step 3: Check Frontend API URL

1. **Open frontend/js/main.js**
2. **Look for this line:**
   ```javascript
   this.apiBaseUrl = 'http://localhost:3000/api';
   ```
3. **Make sure it matches your backend port**

### Step 4: Check Browser Console

1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Try to sign up again**
4. **Look for error messages**

### Step 5: Check Network Tab

1. **In developer tools, go to Network tab**
2. **Try to sign up**
3. **Look for failed requests (red ones)**
4. **Click on failed requests to see details**

## 🔍 Common Issues and Solutions

### Issue 1: Backend Not Running
**Symptoms:** "Failed to fetch" or "Network error"

**Solution:**
```cmd
cd backend
npm run dev
```

### Issue 2: Wrong Port
**Symptoms:** Can't connect to backend

**Solution:**
1. Check what port backend is running on
2. Update frontend API URL in `frontend/js/main.js`
3. Update CORS_ORIGIN in backend `.env`

### Issue 3: CORS Error
**Symptoms:** "CORS policy" error in console

**Solution:**
1. Check `.env` file in backend:
   ```env
   CORS_ORIGIN=http://localhost:8080
   ```
2. Make sure frontend is running on port 8080

### Issue 4: Supabase Connection Error
**Symptoms:** "Invalid API key" or database errors

**Solution:**
1. Check your `.env` file has correct Supabase keys
2. Make sure you ran the database schema
3. Test Supabase connection

### Issue 5: Environment Variables Not Loaded
**Symptoms:** "Missing Supabase environment variables"

**Solution:**
1. Make sure `.env` file exists in backend folder
2. Check file has correct format (no spaces around =)
3. Restart backend server

## 🛠️ Debug Mode

### Enable Debug Logging

1. **In backend/.env, add:**
   ```env
   DEBUG=*
   ```

2. **Restart backend:**
   ```cmd
   npm run dev
   ```

3. **Check console for detailed error messages**

### Test API Endpoints Manually

1. **Test registration endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

## 📋 Checklist

Before trying to sign up, make sure:

- [ ] Backend is running on port 3000
- [ ] Frontend is running on port 8080
- [ ] Health check works: `http://localhost:3000/health`
- [ ] `.env` file has correct Supabase keys
- [ ] Database schema was run in Supabase
- [ ] No CORS errors in browser console
- [ ] Network requests are reaching the backend

## 🆘 Still Having Issues?

1. **Check the error message** - it usually tells you what's wrong
2. **Look at browser console** - shows JavaScript errors
3. **Check network tab** - shows failed API requests
4. **Check backend console** - shows server errors
5. **Share the exact error message** - we can help debug it

## 🎯 Quick Fix Steps

1. **Stop both frontend and backend** (Ctrl+C)
2. **Start backend first:**
   ```cmd
   cd backend
   npm run dev
   ```
3. **Start frontend in new terminal:**
   ```cmd
   cd frontend
   npx http-server -p 8080
   ```
4. **Test health check:** `http://localhost:3000/health`
5. **Try signing up again**

## 📞 Need More Help?

If you're still stuck:
1. **Copy the exact error message**
2. **Check what's in browser console**
3. **Check what's in backend console**
4. **Share these details** and we can help debug further! 