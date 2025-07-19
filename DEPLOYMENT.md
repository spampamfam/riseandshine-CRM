# CRM Deployment Guide

This guide covers deploying the CRM system to production environments.

## Prerequisites

- Node.js 18+ installed
- Git repository access
- Supabase account and project
- Domain name (optional)

## 1. Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys

### Database Setup
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `database/schema.sql`
3. Execute the SQL to create tables and functions

### Environment Configuration
1. Go to Settings > API in Supabase
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role key (keep this secret!)

## 2. Backend Deployment

### Option A: Railway (Recommended)

1. **Connect Repository**
   ```bash
   # Fork/clone the repository
   git clone <your-repo-url>
   cd my-app
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` folder as the source
   - Set the following environment variables:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Deploy**
   - Railway will automatically detect Node.js and deploy
   - Note the generated URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account

2. **Create Web Service**
   - New > Web Service
   - Connect your repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables (same as Railway)

3. **Deploy**
   - Render will build and deploy automatically
   - Note the generated URL

### Option C: VPS/Server

1. **Server Setup**
   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd my-app/backend
   
   # Install dependencies
   npm install --production
   
   # Create environment file
   cp env.example .env
   # Edit .env with your values
   
   # Start with PM2
   pm2 start src/server.js --name "crm-backend"
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 3. Frontend Deployment

### Option A: Netlify (Recommended)

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository

2. **Build Settings**
   - Build command: `echo "No build required"`
   - Publish directory: `frontend`
   - Base directory: (leave empty)

3. **Environment Variables**
   ```env
   API_BASE_URL=https://your-backend-url.com
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Deploy**
   - Netlify will deploy automatically
   - Custom domain can be added in settings

### Option B: Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configuration**
   - Framework preset: Other
   - Root directory: `frontend`
   - Build command: `echo "No build required"`
   - Output directory: `.`

3. **Environment Variables**
   - Add the same variables as Netlify

### Option C: GitHub Pages

1. **Repository Setup**
   ```bash
   # Create gh-pages branch
   git checkout -b gh-pages
   git push origin gh-pages
   ```

2. **GitHub Settings**
   - Go to repository Settings > Pages
   - Source: Deploy from a branch
   - Branch: gh-pages
   - Folder: / (root)

3. **Update Frontend URLs**
   - Update API URLs in JavaScript files
   - Commit and push changes

## 4. Domain Configuration

### Custom Domain Setup

1. **DNS Configuration**
   ```
   # For Netlify/Vercel
   CNAME your-domain.com -> your-app.netlify.app
   
   # For VPS
   A your-domain.com -> your-server-ip
   ```

2. **SSL Certificate**
   - Netlify/Vercel: Automatic SSL
   - VPS: Use Let's Encrypt
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Environment Updates

After setting up custom domains, update:

1. **Backend CORS**
   ```env
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

2. **Frontend API URL**
   ```env
   API_BASE_URL=https://your-backend-domain.com
   ```

## 5. Security Configuration

### Environment Variables
- Use strong, unique JWT secrets
- Keep service role keys secure
- Use environment-specific configurations

### Database Security
- Enable Row Level Security (RLS) in Supabase
- Review and test RLS policies
- Regular database backups

### API Security
- Rate limiting enabled
- CORS properly configured
- Security headers via Helmet.js

## 6. Monitoring & Maintenance

### Health Checks
```bash
# Backend health check
curl https://your-backend-url.com/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Logs
- Railway/Render: Built-in logging
- VPS: `pm2 logs crm-backend`
- Netlify/Vercel: Built-in logging

### Updates
```bash
# Backend updates
git pull origin main
npm install
pm2 restart crm-backend

# Frontend updates
# Automatic with Netlify/Vercel
# Manual for VPS: copy files and restart nginx
```

## 7. Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN in backend
   - Verify frontend API URL

2. **Database Connection**
   - Verify Supabase credentials
   - Check network connectivity

3. **Authentication Issues**
   - Verify JWT_SECRET
   - Check cookie settings

4. **Build Failures**
   - Check Node.js version
   - Verify package.json dependencies

### Debug Mode
```env
NODE_ENV=development
DEBUG=*
```

## 8. Performance Optimization

### Backend
- Enable compression
- Use CDN for static assets
- Database query optimization
- Caching strategies

### Frontend
- Minify CSS/JS
- Optimize images
- Use CDN for assets
- Implement lazy loading

## 9. Backup Strategy

### Database
- Supabase: Automatic backups
- Manual exports: Use Supabase dashboard

### Application
- Git repository backup
- Environment variables backup
- Configuration files backup

## 10. Scaling Considerations

### Horizontal Scaling
- Load balancer setup
- Multiple backend instances
- Database read replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layers

---

## Quick Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema imported
- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] Custom domain configured (optional)
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented 