# 🚀 Beginner's Guide: Setting Up Your CRM Environment Variables

Don't worry if you're new to APIs! This guide will walk you through everything step by step.

## 📋 What You Need to Do

You need to get some "keys" (like passwords) from Supabase and put them in a file called `.env`. Think of it like setting up the keys to your house - you need the right keys to access your data.

## 🎯 Step 1: Create a Supabase Account

1. **Go to Supabase:** Visit [supabase.com](https://supabase.com)
2. **Sign Up:** Click "Start your project" and create a free account
3. **Create Project:** Click "New Project" and give it a name like "My CRM"

## 🎯 Step 2: Get Your Project Keys

1. **Go to Settings:** In your Supabase dashboard, click the gear icon (⚙️) on the left sidebar
2. **Click "API":** You'll see a page with your project information
3. **Copy These Values:**
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...` - keep this secret!)

## 🎯 Step 3: Set Up Your Database

1. **Go to SQL Editor:** Click "SQL Editor" in the left sidebar
2. **Create New Query:** Click "New query"
3. **Copy and Paste:** Copy everything from the `database/schema.sql` file in your project
4. **Run the Query:** Click the "Run" button (▶️)

## 🎯 Step 4: Create Your .env File

### Option A: Use the Setup Script (Easiest)
```cmd
cd backend
setup.bat
```

### Option B: Manual Setup
1. **Navigate to backend folder:**
   ```cmd
   cd backend
   ```

2. **Copy the example file:**
   ```cmd
   copy env.example .env
   ```

3. **Open the .env file** in any text editor (Notepad, VS Code, etc.)

## 🎯 Step 5: Fill in Your .env File

Your `.env` file should look like this. Replace the placeholder values with your actual Supabase information:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
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

### 🔑 What Each Line Means:

| Line | What to Put | Example |
|------|-------------|---------|
| `SUPABASE_URL` | Your project URL from Supabase | `https://abcdefghijklmnop.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon key from Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key from Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | Any random string (like a password) | `my-super-secret-key-123` |
| `JWT_EXPIRES_IN` | How long login sessions last | `7d` (7 days) |
| `PORT` | Which port to run on | `3000` |
| `NODE_ENV` | Environment type | `development` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:8080` |

## 🎯 Step 6: Test Your Setup

1. **Start the backend:**
   ```cmd
   npm run dev
   ```

2. **You should see:**
   ```
   🚀 CRM Backend server running on port 3000
   📊 Environment: development
   🔗 Health check: http://localhost:3000/health
   ```

3. **Test the connection:**
   - Open your browser
   - Go to: `http://localhost:3000/health`
   - You should see: `{"status":"OK","timestamp":"...","environment":"development"}`

## 🎯 Step 7: Start the Frontend

1. **Open a new terminal/command prompt**
2. **Navigate to frontend folder:**
   ```cmd
   cd frontend
   ```

3. **Start a local server:**
   ```cmd
   npx http-server -p 8080
   ```

4. **Open your browser and go to:**
   ```
   http://localhost:8080
   ```

## 🎯 Step 8: Create Your First User

1. **Click "Sign Up"** on the homepage
2. **Enter your email and password**
3. **Check your email** for a confirmation link
4. **Click the confirmation link**
5. **Log in** to your new CRM!

## 🔧 Troubleshooting

### "Connection Error" or "Cannot connect to database"
- ✅ Check your `SUPABASE_URL` is correct
- ✅ Check your `SUPABASE_ANON_KEY` is correct
- ✅ Make sure you ran the database schema

### "Invalid API key" error
- ✅ Copy the entire key (it should be very long)
- ✅ Make sure there are no extra spaces
- ✅ Check you're using the right key (anon vs service role)

### "Port already in use" error
- ✅ Change the PORT in .env to 3001 or another number
- ✅ Or stop other applications using port 3000

## 📞 Need Help?

If you get stuck:
1. **Check the error message** - it usually tells you what's wrong
2. **Verify your Supabase keys** - make sure they're copied correctly
3. **Check the README.md** - it has more detailed instructions
4. **Ask for help** - share the error message and we can help!

## 🎉 You're Done!

Once everything is working:
- ✅ Your backend is running on `http://localhost:3000`
- ✅ Your frontend is running on `http://localhost:8080`
- ✅ You can register and log in
- ✅ You can add and manage leads

Congratulations! You've successfully set up your CRM system! 🎊 