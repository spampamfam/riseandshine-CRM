# 📸 Visual Guide: Setting Up Your .env File

## 🎯 Step 1: Get Your Supabase Keys

### 1. Go to Supabase Dashboard
- Visit [supabase.com](https://supabase.com)
- Sign in to your account
- Click on your project

### 2. Find the Settings
- Look for the gear icon (⚙️) in the left sidebar
- Click on it to open Settings

### 3. Go to API Section
- In Settings, click on "API" in the left menu
- You'll see a page that looks like this:

```
Project API keys
┌─────────────────────────────────────────────────────────────┐
│ Project URL                                                 │
│ https://abcdefghijklmnop.supabase.co                       │
│                                                             │
│ anon (public)                                               │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh... │
│                                                             │
│ service_role (secret)                                       │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh... │
└─────────────────────────────────────────────────────────────┘
```

### 4. Copy These Three Values:
- **Project URL** (the long URL starting with https://)
- **anon (public)** key (the long string starting with eyJ...)
- **service_role (secret)** key (the other long string starting with eyJ...)

## 🎯 Step 2: Create Your .env File

### Option A: Use the Setup Script
```cmd
cd backend
setup.bat
```

### Option B: Manual Setup
1. Open Command Prompt or PowerShell
2. Navigate to your project:
   ```cmd
   cd my-app
   cd backend
   ```
3. Copy the example file:
   ```cmd
   copy env.example .env
   ```

## 🎯 Step 3: Edit Your .env File

1. **Open the .env file** in any text editor (Notepad, VS Code, etc.)

2. **Replace the placeholder values** with your actual Supabase information:

```env
# BEFORE (placeholder values):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AFTER (your actual values):
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0NzIwMCwiZXhwIjoxOTUyMTIzMjAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM2NTQ3MjAwLCJleHAiOjE5NTIxMjMyMDB9.example
```

## 🎯 Step 4: Complete Your .env File

Your complete `.env` file should look like this:

```env
# Supabase Configuration
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0NzIwMCwiZXhwIjoxOTUyMTIzMjAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM2NTQ3MjAwLCJleHAiOjE5NTIxMjMyMDB9.example

# JWT Configuration
JWT_SECRET=my-super-secret-jwt-key-123
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔑 Important Notes:

### ✅ What You Need to Change:
- `SUPABASE_URL` - Your actual project URL
- `SUPABASE_ANON_KEY` - Your actual anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your actual service role key
- `JWT_SECRET` - Any random string you want (like a password)

### ✅ What You Can Leave as Default:
- `JWT_EXPIRES_IN=7d` - Login sessions last 7 days
- `PORT=3000` - Backend runs on port 3000
- `NODE_ENV=development` - Development mode
- `CORS_ORIGIN=http://localhost:8080` - Frontend URL
- `RATE_LIMIT_WINDOW_MS=900000` - Rate limiting settings
- `RATE_LIMIT_MAX_REQUESTS=100` - Rate limiting settings

## 🎯 Step 5: Test Your Setup

1. **Save the .env file**

2. **Start the backend:**
   ```cmd
   npm run dev
   ```

3. **You should see:**
   ```
   🚀 CRM Backend server running on port 3000
   📊 Environment: development
   🔗 Health check: http://localhost:3000/health
   ```

4. **Test in browser:**
   - Go to: `http://localhost:3000/health`
   - You should see: `{"status":"OK","timestamp":"...","environment":"development"}`

## 🚨 Common Mistakes to Avoid:

### ❌ Don't:
- Add quotes around the values
- Add extra spaces
- Use the example keys (they won't work)
- Share your service role key publicly

### ✅ Do:
- Copy the entire key (it should be very long)
- Make sure there are no extra spaces
- Keep your service role key secret
- Test the connection after setup

## 🆘 If Something Goes Wrong:

1. **Check your keys are correct**
2. **Make sure you saved the .env file**
3. **Restart the backend server**
4. **Check the error message for clues**

## 🎉 Success!

If you see the health check working, congratulations! Your environment variables are set up correctly and you can now use your CRM system! 