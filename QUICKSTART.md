# Quick Start Guide

Get MedScribe running in 5 minutes!

## Prerequisites Check

```bash
node --version   # Need 18+
npm --version    # Need 9+
psql --version   # Need 12+
```

## 5-Minute Setup

### 1. Install Dependencies (1 min)
```bash
npm install
```

### 2. Create Database (30 sec)
```bash
# In PostgreSQL:
CREATE DATABASE medscribe;
```

### 3. Configure Environment (1 min)
```bash
cp .env.example .env
# Edit .env with your database and OpenAI API key
```

### 4. Setup Database Schema (30 sec)
```bash
npm run db:generate
npm run db:push
```

### 5. Seed Sample Data (30 sec)
```bash
npm run db:seed
```

### 6. Start Server (30 sec)
```bash
npm run dev
```

### 7. Login (30 sec)
- Open http://localhost:3000
- Email: `doctor@medscribe.com`
- Password: `password123`

## Test the Full Flow

1. **Add Patient** (or use seeded patient)
2. **Start Consultation** → Select patient
3. **Record** → Click "Start Recording", speak for 10 seconds
4. **Save** → Click "Save Consultation"
5. **Generate** → Select "Discharge Summary", click "Generate"
6. **Download** → Click "Download PDF"

## Common Issues

**Database error?**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env

**Voice not working?**
- Use Chrome/Edge/Safari
- Allow microphone permission

**Gemini error?**
- Check API key in .env
- Verify API key is valid at makersuite.google.com

## Next Steps

- Read [SETUP.md](./SETUP.md) for detailed setup
- Read [README.md](./README.md) for features
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy

---

**That's it! You're ready to use MedScribe! 🚀**
