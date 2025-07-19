# Lightweight CRM System

A modern, lightweight Customer Relationship Management system built with vanilla JavaScript, Node.js, and Supabase.

## 🏗️ Architecture

- **Frontend**: Vanilla HTML, CSS (Flexbox/Grid), ES6+ JavaScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth + JWT validation
- **Deployment**: Netlify (Frontend) + Supabase (Backend)

## 🚀 Features

- ✅ Secure authentication with JWT cookies
- ✅ Lead management (CRUD operations)
- ✅ User dashboard with pagination
- ✅ Admin panel with user management
- ✅ Responsive design with dark/light theme
- ✅ Rate limiting and security headers
- ✅ Real-time updates (Supabase Realtime)
- ✅ CSV export functionality

## 📁 Project Structure

```
my-app/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── pages/
│   ├── assets/
│   ├── js/
│   └── index.html
├── database/
│   └── schema.sql
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL (via Supabase)
- Git

### 1. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `database/schema.sql`
3. Copy your project URL and anon key from Settings > API

**Note:** The schema file no longer includes sample data to prevent foreign key constraint errors. If you want to add sample data after creating users, see `database/sample_data.sql` for instructions.

**📚 New to APIs?** Check out our beginner-friendly guides:
- [Complete Setup Guide](SUPABASE_SETUP_GUIDE.md) - Step-by-step instructions for setting up environment variables
- [Visual Guide](ENV_SETUP_VISUAL.md) - With examples and screenshots

### 2. Backend Setup

#### Option A: Automated Setup (Recommended)

**Windows:**
```cmd
cd backend
setup.bat
```

**PowerShell:**
```powershell
cd backend
.\setup.ps1
```

#### Option B: Manual Setup

**Windows Command Prompt:**
```cmd
cd backend
npm install
copy env.example .env
```

**PowerShell:**
```powershell
cd backend
npm install
Copy-Item env.example .env
```

**Unix/Linux/macOS:**
```bash
cd backend
npm install
cp env.example .env
```

Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup

The frontend is static HTML/CSS/JS. Open `frontend/index.html` in your browser or serve with a local server:

```bash
cd frontend
npx http-server -p 8080
```

### 4. Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (.env):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_secret_key
PORT=3000
NODE_ENV=development
```

**Frontend (.env):**
```env
API_BASE_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

## 🔐 Security Features

- JWT token validation on all protected routes
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Security headers (helmet.js)
- Input validation and sanitization

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - Get user's leads (paginated)
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `GET /api/leads/export` - Export leads to CSV

### Admin
- `GET /api/admin/users` - Get all users with lead counts
- `GET /api/admin/stats` - Get system statistics

## 🚀 Deployment

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Set build command: `cd frontend && npx http-server -p 8080`
3. Set publish directory: `frontend`
4. Add environment variables in Netlify dashboard

### Backend (Railway/Render)

1. Connect your repository to Railway or Render
2. Set environment variables
3. Deploy with Node.js buildpack

## 🧪 Testing

Run backend tests:
```bash
cd backend
npm test
```

## 🔧 Troubleshooting

### Foreign Key Constraint Error
If you encounter this error when setting up the database:
```
ERROR: 23503: insert or update on table "leads" violates foreign key constraint "leads_user_id_fkey"
```

**Solution:** The schema file has been updated to remove sample data that could cause this error. Sample data should only be inserted after creating actual users through the application.

### Adding Sample Data
To add sample data after creating users:
1. Register a user through the CRM application
2. Go to Supabase Dashboard > SQL Editor
3. Run: `SELECT id, email FROM auth.users;`
4. Copy the user ID (UUID format)
5. Use the instructions in `database/sample_data.sql` to add sample leads

### Windows Command Issues
If you encounter `'cp' is not recognized` or similar errors:

**Solution:** Use Windows-specific commands:
- **Command Prompt:** `copy env.example .env`
- **PowerShell:** `Copy-Item env.example .env`
- **Or use the automated setup scripts:** `setup.bat` or `setup.ps1`

## 📊 Database Schema

The system uses two main tables:

**users** (managed by Supabase Auth):
- id (UUID, primary key)
- email (unique)
- created_at
- updated_at

**leads**:
- id (UUID, primary key)
- user_id (foreign key to users.id)
- name (text)
- contact (text)
- source (text)
- status (enum: 'new', 'contacted', 'qualified', 'converted')
- created_at (timestamp)
- updated_at (timestamp)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 