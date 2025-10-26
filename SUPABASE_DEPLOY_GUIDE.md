# Deploy to Vercel + Supabase

## 🎯 Prerequisites
- GitHub account (code must be pushed)
- Vercel account (free)
- Supabase account (free)

## 📝 Step-by-Step Guide

### Step 1: Create Supabase Project (5 min)

1. Go to https://supabase.com
2. **Sign up** for free
3. Click **"New Project"**
4. Fill in:
   - **Name:** smart-spend
   - **Database Password:** (choose a strong password)
   - **Region:** Choose closest to you
5. Click **"Create new project"**
6. Wait 2 minutes for database to provision

### Step 2: Set Up Database (5 min)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open `supabase-schema.sql` from this project
4. Copy and paste into SQL Editor
5. Click **"Run"**
6. Tables created! ✅

### Step 3: Get Supabase Keys (2 min)

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (under "Config")
   - **anon public** key (under "Project API keys")

### Step 4: Deploy to Vercel (5 min)

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com
2. **Sign up** (or sign in)
3. Click **"Add New Project"**
4. **Import your GitHub repository**
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your anon key
   - `OPENFGA_STORE_ID` = YOUR_FGA_STORE_ID
   - `OPENFGA_AUTHORIZATION_MODEL_ID` = YOUR_FGA_AUTHORIZATION_MODEL_ID
   - `OPENFGA_CLIENT_ID` = YOUR_FGA_CLIENT_ID
   - `OPENFGA_CLIENT_SECRET` = REDACTED_FGA_CLIENT_SECRET
   - `OPENFGA_API_URL` = https://api.us1.fga.dev
7. Click **"Deploy"**
8. Wait 3-5 minutes

**Option B: Via CLI**

```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
vercel --prod
```

### Step 5: Test Your Deployment

Visit your Vercel URL and test:
- ✅ View expenses
- ✅ Add new expense
- ✅ Approve/deny expenses
- ✅ AI assistant works
- ✅ Authorized mode works

## ⚠️ What's NOT Done Yet

The API routes are created but NOT fully implemented. Currently:
- ✅ Basic CRUD operations
- ❌ OpenFGA integration in API routes
- ❌ Auth endpoint handling
- ❌ Proper error handling

## 🚀 Quick Alternative

**Want it working in 30 minutes instead?**

Use Render for backend (keeps current Express + file storage):
- See `QUICK_DEPLOY_STEPS.md`

This gets you live NOW, then you can migrate to Supabase later if needed.

## 💡 Recommendation

**Start with Render + Vercel** (30 min) → get live  
**Migrate to Supabase later** (when you have time to complete API routes)

**Which do you prefer?** I can help with either!

