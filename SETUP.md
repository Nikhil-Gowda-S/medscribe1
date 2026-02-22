# Setup Guide

Complete step-by-step guide to set up MedScribe locally.

## Step 1: Prerequisites

Ensure you have installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

Verify installations:
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
psql --version  # Should be 12.x or higher
```

## Step 2: Clone/Download Project

If using Git:
```bash
git clone <repository-url>
cd P1
```

Or extract the project folder to your desired location.

## Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages. Wait for completion (may take 2-5 minutes).

## Step 4: Set Up PostgreSQL Database

### Create Database

1. **Open PostgreSQL command line** or pgAdmin
2. **Create database:**
   ```sql
   CREATE DATABASE medscribe;
   ```
3. **Note your connection details:**
   - Username (usually `postgres`)
   - Password
   - Host (usually `localhost`)
   - Port (usually `5432`)

### Alternative: Using psql

```bash
psql -U postgres
CREATE DATABASE medscribe;
\q
```

## Step 5: Configure Environment Variables

1. **Copy example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your favorite editor:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/medscribe?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   GEMINI_API_KEY="your-gemini-api-key"
   NODE_ENV="development"
   ```

3. **Generate NEXTAUTH_SECRET:**
   ```bash
   # On Windows (PowerShell):
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))
   
   # On Mac/Linux:
   openssl rand -base64 32
   ```

4. **Get Gemini API Key:**
   - Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy and paste into `.env`

## Step 6: Set Up Database Schema

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Push schema to database:**
   ```bash
   npm run db:push
   ```

   This creates all tables in your database.

3. **Verify (optional):**
   ```bash
   npm run db:studio
   ```
   This opens Prisma Studio in your browser to view the database.

## Step 7: Seed Database (Optional)

Add sample data for testing:
```bash
npm run db:seed
```

This creates:
- Test doctor account: `doctor@medscribe.com` / `password123`
- Sample patients
- Sample consultation

## Step 8: Start Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

## Step 9: Access Application

1. **Open browser:** [http://localhost:3000](http://localhost:3000)
2. **Register account** or use seeded account:
   - Email: `doctor@medscribe.com`
   - Password: `password123`

## Step 10: Test the Application

### Basic Flow Test

1. **Login** with your account
2. **Add Patient:**
   - Go to Patients page
   - Click "Add Patient"
   - Fill in details
   - Save

3. **Start Consultation:**
   - Go to Consultations
   - Click "New Consultation"
   - Select patient
   - Click "Start Recording"
   - Speak for 10-20 seconds
   - Click "Stop Recording"
   - Review transcript
   - Save consultation

4. **Generate Document:**
   - Open consultation
   - Select document type (Discharge Summary)
   - Choose template (optional)
   - Click "Generate"
   - Wait 5-10 seconds
   - Review document
   - Download PDF

## Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows:
   services.msc  # Check PostgreSQL service
   
   # Mac:
   brew services list
   
   # Linux:
   sudo systemctl status postgresql
   ```

2. Check connection string format:
   ```
   postgresql://username:password@host:port/database
   ```

3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Prisma Errors

**Error:** `PrismaClient is not configured`

**Solution:**
```bash
npm run db:generate
```

**Error:** `Migration failed`

**Solution:**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or push schema directly
npm run db:push
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
1. Find process using port:
   ```bash
   # Windows:
   netstat -ano | findstr :3000
   
   # Mac/Linux:
   lsof -i :3000
   ```

2. Kill process or use different port:
   ```bash
   PORT=3001 npm run dev
   ```

### Gemini API Errors

**Error:** `Invalid API key`

**Solutions:**
1. Verify API key in `.env`
2. Check API key is valid at [makersuite.google.com](https://makersuite.google.com/app/apikey)
3. Verify key is not expired
4. Check rate limits

**Error:** `Rate limit exceeded`

**Solution:**
- Wait a few minutes
- Check Gemini API usage dashboard
- Consider upgrading plan if needed

### Voice Transcription Not Working

**Issue:** Microphone not detected

**Solutions:**
1. Use Chrome, Edge, or Safari (best support)
2. Allow microphone permissions in browser
3. Check system microphone settings
4. Try different browser

**Issue:** No speech detected

**Solutions:**
1. Speak clearly and louder
2. Check microphone is working
3. Try different microphone
4. Check browser console for errors

### Build Errors

**Error:** TypeScript errors

**Solution:**
```bash
npm run type-check
# Fix any errors shown
```

**Error:** Module not found

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Hot Reload
- Changes to code auto-reload
- Database changes require restart
- Environment variable changes require restart

### Database Management
- Use Prisma Studio: `npm run db:studio`
- View/edit data visually
- Useful for debugging

### API Testing
- Use browser DevTools Network tab
- Check API responses
- Monitor for errors

### Logs
- Check terminal for server logs
- Browser console for client logs
- Database logs in PostgreSQL

## Next Steps

After successful setup:

1. **Read README.md** for feature overview
2. **Read DEPLOYMENT.md** for production deployment
3. **Explore the codebase** to understand structure
4. **Customize** for your needs
5. **Deploy** when ready

## Getting Help

If you encounter issues:

1. Check this guide first
2. Review error messages carefully
3. Check browser console
4. Verify all prerequisites installed
5. Ensure environment variables correct
6. Test database connection separately

## Common Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to DB
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed sample data

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
```

---

**Setup complete? Start building amazing medical documentation! 🚀**
