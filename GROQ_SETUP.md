# Using Groq API – Free & Fast

MedScribe uses **Groq** for generating discharge summaries and case sheets when you set `GROQ_API_KEY`. Groq offers a free tier and very fast inference.

## Why Groq?

- **Free tier** – No credit card required at signup (console.groq.com)
- **Fast** – Optimized inference (e.g. Llama at 500+ tokens/sec)
- **OpenAI-compatible** – Same API style, easy to use
- **Less restrictive** – Generous free limits compared to some other providers

## Setup

### 1. Get an API key

1. Go to **https://console.groq.com/**
2. Sign up or sign in
3. Open **API Keys**
4. Create a new key and copy it

### 2. Add to `.env`

```env
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

You can leave `GEMINI_API_KEY` empty to use only Groq.

### 3. Restart the app

```bash
npm run dev
```

## Priority

- If **GROQ_API_KEY** is set → use **Groq**
- Else if **GEMINI_API_KEY** is set → use **Gemini**
- If neither is set → app will error asking for one of them

## Models used (Groq)

The app tries these in order:

- `llama-3.3-70b-versatile`
- `llama-3.1-70b-versatile`
- `llama-3.1-8b-instant`
- `mixtral-8x7b-32768`
- `llama3-70b-8192`
- `llama3-8b-8192`

## Links

- Console: https://console.groq.com/
- Docs: https://console.groq.com/docs
- Models: https://console.groq.com/docs/models
