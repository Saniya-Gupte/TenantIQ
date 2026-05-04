# TenantIQ Setup Guide

## Prerequisites
- Node.js 18+
- A Google AI Studio account (free) — for Gemini API
- A Supabase account (free tier works) — for database

---

## 1. Get your Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key

---

## 2. Set up Supabase

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

---

## 3. Configure Environment Variables

Edit `.env.local` and fill in your actual values:

```env
GEMINI_API_KEY=AIza...your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 4. Run the App

```bash
npm run dev
```

Open http://localhost:3000

---

## 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/apply` | 4-step application form |
| `/processing/[id]` | Real-time agent processing animation |
| `/results/[id]` | Comprehensive screening results |
| `/dashboard` | Landlord dashboard with all applications |

---

## Notes

- Works without Supabase configured — results are stored in sessionStorage during the demo
- The Gemini API has a free tier (15 requests/minute, 1M tokens/day for gemini-1.5-flash)
- All screening criteria are based on self-reported data — for demo purposes only
- Real deployments would integrate with Experian/TransUnion/Equifax APIs and background check services
