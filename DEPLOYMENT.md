# Deployment Guide

This guide covers deploying MedScribe to various cloud platforms.

## Prerequisites

- Git repository (GitHub, GitLab, etc.)
- Cloud platform account
- Domain name (optional but recommended)
- SSL certificate (usually provided by platform)

## Vercel Deployment (Recommended)

Vercel is the easiest platform for Next.js applications.

### Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**
   In Vercel dashboard, add:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_URL` - Your Vercel deployment URL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `GEMINI_API_KEY` - Your Gemini API key
   - `NODE_ENV` - Set to `production`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

5. **Set up Database**
   - Use Vercel Postgres or external provider (Railway, Supabase, etc.)
   - Run migrations:
     ```bash
     npx prisma migrate deploy
     ```

## Railway Deployment

Railway provides PostgreSQL and easy deployment.

### Steps

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide `DATABASE_URL`

4. **Configure Environment Variables**
   Add to Railway:
   - `DATABASE_URL` (auto-provided)
   - `NEXTAUTH_URL` - Your Railway URL
   - `NEXTAUTH_SECRET` - Generate secret
   - `GEMINI_API_KEY` - Your Gemini API key
   - `NODE_ENV` - `production`

5. **Deploy**
   - Railway auto-deploys on git push
   - Check logs for any errors

6. **Run Migrations**
   ```bash
   railway run npx prisma migrate deploy
   ```

## Render Deployment

Render is another good option for Next.js apps.

### Steps

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select branch (main/master)

3. **Configure Build Settings**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

4. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Note the connection string

5. **Set Environment Variables**
   - `DATABASE_URL` - From PostgreSQL service
   - `NEXTAUTH_URL` - Your Render URL
   - `NEXTAUTH_SECRET` - Generate secret
   - `GEMINI_API_KEY` - Your Gemini API key
   - `NODE_ENV` - `production`

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment

7. **Run Migrations**
   Use Render shell or SSH:
   ```bash
   npx prisma migrate deploy
   ```

## AWS Deployment

For enterprise deployments on AWS.

### Option 1: AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect GitHub repository
   - Select branch

2. **Configure Build**
   - Build settings auto-detected
   - Add environment variables

3. **Add RDS PostgreSQL**
   - Create RDS PostgreSQL instance
   - Update `DATABASE_URL`

4. **Deploy**
   - Amplify handles deployment automatically

### Option 2: EC2 + Docker

1. **Create EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm postgresql-client
   ```

3. **Clone Repository**
   ```bash
   git clone <your-repo>
   cd medscribe
   npm install
   ```

4. **Set Environment Variables**
   ```bash
   nano .env
   # Add all required variables
   ```

5. **Set up RDS PostgreSQL**
   - Create RDS instance
   - Update security groups
   - Update `DATABASE_URL`

6. **Run Migrations**
   ```bash
   npm run db:push
   ```

7. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

8. **Set up Nginx**
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
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Database Setup

### Using External PostgreSQL

**Supabase:**
1. Create project at supabase.com
2. Get connection string from Settings → Database
3. Use as `DATABASE_URL`

**Neon:**
1. Create project at neon.tech
2. Copy connection string
3. Use as `DATABASE_URL`

**AWS RDS:**
1. Create PostgreSQL instance
2. Configure security groups
3. Get endpoint from RDS console
4. Format: `postgresql://user:password@endpoint:5432/dbname`

### Running Migrations

After deployment, run:
```bash
npx prisma migrate deploy
```

Or use Prisma Studio:
```bash
npx prisma studio
```

## Environment Variables Checklist

Ensure these are set in production:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your production URL
- [ ] `NEXTAUTH_SECRET` - Random secret (32+ characters)
- [ ] `GEMINI_API_KEY` - Valid Gemini API key
- [ ] `NODE_ENV` - Set to `production`

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] SSL certificate active (HTTPS)
- [ ] Test user registration
- [ ] Test voice transcription (requires HTTPS)
- [ ] Test document generation
- [ ] Test PDF download
- [ ] Monitor error logs
- [ ] Set up monitoring (optional)
- [ ] Configure backups (database)

## Monitoring & Maintenance

### Logs
- Check platform logs regularly
- Monitor for errors
- Watch API usage (OpenAI)

### Backups
- Set up automated database backups
- Test restore procedures
- Keep backups for 30+ days

### Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in staging first

## Troubleshooting

### Build Failures
- Check Node.js version (18+)
- Verify all dependencies install
- Check build logs

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check firewall rules
- Test connection from server

### API Errors
- Verify Gemini API key
- Check API rate limits
- Monitor usage dashboard

### Performance Issues
- Enable caching
- Optimize database queries
- Use CDN for static assets
- Consider upgrading instance size

## Security Best Practices

1. **Never commit `.env` files**
2. **Use strong `NEXTAUTH_SECRET`**
3. **Enable HTTPS only**
4. **Regular security updates**
5. **Database access restrictions**
6. **API key rotation**
7. **Monitor for suspicious activity**

## Cost Estimation

**Vercel:**
- Free tier: Good for testing
- Pro: $20/month (recommended)

**Railway:**
- $5/month base + usage
- PostgreSQL included

**Render:**
- Free tier available
- Paid: $7/month + database

**AWS:**
- EC2: ~$15-50/month
- RDS: ~$15-100/month
- Varies by usage

## Support

For deployment issues:
1. Check platform documentation
2. Review error logs
3. Test locally first
4. Check environment variables

---

**Ready to deploy? Choose your platform and follow the steps above!**
