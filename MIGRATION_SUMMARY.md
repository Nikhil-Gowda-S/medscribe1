# Migration Summary: OpenAI → Gemini

## Changes Made

✅ **Replaced OpenAI SDK with Google Gemini SDK**
✅ **Updated all API calls to use Gemini Pro**
✅ **Updated environment variables** (OPENAI_API_KEY → GEMINI_API_KEY)
✅ **Updated documentation** to reference Gemini
✅ **Updated package versions** to fix vulnerabilities

## Next Steps

### 1. Remove Old Dependencies

```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Or on Windows PowerShell:
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

### 2. Install Updated Dependencies

```bash
npm install
```

This will install:
- `@google/generative-ai` (instead of `openai`)
- Updated versions of all packages (fixes vulnerabilities)

### 3. Update Your .env File

Change this:
```env
OPENAI_API_KEY="your-openai-api-key"
```

To this:
```env
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

See `GEMINI_SETUP.md` for detailed instructions.

### 5. Fix Vulnerabilities

After installing, run:

```bash
npm audit fix
```

If vulnerabilities remain:

```bash
npm audit fix --force
```

**Note:** Test your app after running `--force` as it may update to breaking changes.

### 6. Test the Application

```bash
npm run dev
```

Then test:
1. Login
2. Add a patient
3. Start consultation
4. Generate a document (should use Gemini now)

## What Changed in Code

### File: `lib/openai.ts`
- Now uses `@google/generative-ai` instead of `openai`
- Uses `gemini-pro` model instead of `gpt-4`
- API structure updated for Gemini

### File: `.env.example`
- Changed `OPENAI_API_KEY` to `GEMINI_API_KEY`

### File: `package.json`
- Removed: `openai` package
- Added: `@google/generative-ai` package
- Updated all package versions

## Differences: OpenAI vs Gemini

| Feature | OpenAI | Gemini |
|---------|--------|--------|
| Model | gpt-4 | gemini-pro |
| API Key | platform.openai.com | makersuite.google.com |
| Cost | Pay per token | Free tier available |
| Rate Limit | Varies by plan | 60 req/min (free) |

## Troubleshooting

**"GEMINI_API_KEY is not set"**
- Check your `.env` file
- Ensure variable name is `GEMINI_API_KEY` (not `OPENAI_API_KEY`)
- Restart dev server after changing `.env`

**"Module not found: openai"**
- Run `npm install` again
- Check `package.json` doesn't have `openai` dependency

**Vulnerabilities still showing**
- Run `npm audit fix --force`
- Check if vulnerabilities are in dev dependencies (usually safe)

---

**Migration complete! Your app now uses Gemini instead of OpenAI.**
