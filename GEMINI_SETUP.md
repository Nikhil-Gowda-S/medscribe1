# Gemini API Setup Guide

## Getting Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project" or choose existing project
   - Copy the generated API key

3. **Add to Environment Variables**
   - Open your `.env` file
   - Add: `GEMINI_API_KEY="your-api-key-here"`
   - Save the file

## API Key Security

- **Never commit** your API key to Git
- Keep it in `.env` file (which is gitignored)
- Rotate keys periodically
- Use different keys for development and production

## Testing Your API Key

After setting up, test with:

```bash
npm run dev
```

Then try generating a document in the app. If you see errors, check:
1. API key is correct
2. API key has proper permissions
3. You have API quota available

## Rate Limits

Gemini API has rate limits:
- Free tier: 60 requests per minute
- Check your quota at: https://makersuite.google.com/app/apikey

## Troubleshooting

**Error: "API key not valid"**
- Verify key is copied correctly
- Check for extra spaces
- Ensure key starts with "AIza"

**Error: "Quota exceeded"**
- Wait a few minutes
- Check usage dashboard
- Consider upgrading plan

**Error: "Model not found"**
- Ensure you're using `gemini-pro` model
- Check Google AI Studio for available models

---

**Your Gemini API key is ready to use!**
