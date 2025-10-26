# 🚀 Quick Deploy - Let's Get You Live!

## ✅ Step 1: Deploy Backend to Render (10 minutes)

1. **Go to:** https://render.com
2. **Sign up** (or sign in with GitHub)
3. Click **"New"** → **"Web Service"**
4. **Connect GitHub** and select: `fga-spend-guard`
5. **Configure:**
   - **Name:** `smart-spend-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `./` (keep default)
   - **Environment:** `Node`
   - **Build Command:** (leave empty)
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

6. Click **"Add Environment Variable"** and add these:

   **Demo Mode:**
   ```
   OPENFGA_STORE_ID = YOUR_FGA_STORE_ID
   OPENFGA_AUTHORIZATION_MODEL_ID = YOUR_FGA_AUTHORIZATION_MODEL_ID
   OPENFGA_CLIENT_ID = YOUR_FGA_CLIENT_ID
   OPENFGA_CLIENT_SECRET = REDACTED_FGA_CLIENT_SECRET
   OPENFGA_API_URL = https://api.us1.fga.dev
   ```

   **Authenticated Mode:**
   ```
   AUTH_OPENFGA_STORE_ID = YOUR_FGA_STORE_ID
   AUTH_OPENFGA_AUTHORIZATION_MODEL_ID = YOUR_FGA_AUTHORIZATION_MODEL_ID
   AUTH_OPENFGA_CLIENT_ID = YOUR_FGA_CLIENT_ID
   AUTH_OPENFGA_CLIENT_SECRET = REDACTED_FGA_CLIENT_SECRET
   ```

7. Click **"Create Web Service"**
8. **Wait 2-3 minutes** for deployment
9. **Copy the URL:** `https://smart-spend-backend.onrender.com` ⚠️ SAVE THIS!
https://smart-spend-backend-oj1y.onrender.com
---

## ✅ Step 2: Deploy Frontend to Vercel (5 minutes)

**Via Dashboard (Easiest):**

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. **Import** `TheDreamSaver/fga-spend-guard`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Click **"Environment Variables"** and add:
   - `VITE_API_URL` = `https://smart-spend-backend-oj1y.onrender.com` (use YOUR actual Render URL!)
   - `VITE_OPENAI_API_KEY` = (optional - add your OpenAI API key if you want AI to work, or leave empty to use mock responses)

6. Click **"Deploy"**
7. Wait 3 minutes
8. **Copy your Vercel URL:** `https://fga-spend-guard.vercel.app` ⚠️ SAVE THIS!

---

## ✅ Step 3: Update CORS (2 minutes)

Edit `server.js` and update line 63:

```javascript
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://fga-spend-guard.vercel.app'  // Your Vercel URL from step 2
];
```

Then commit and push:

```bash
git add server.js
git commit -m "Update CORS for production"
git push
```

Render will auto-redeploy when you push!

---

## ✅ Step 4: Test! (5 minutes)

Visit your Vercel URL and test:
- ✅ View expenses
- ✅ Add expense
- ✅ Approve/deny expense
- ✅ AI assistant
- ✅ Both demo and auth mode

---

## 🎉 Done!

**Frontend:** Your Vercel URL  
**Backend:** Your Render URL  
**Cost:** $0/month  
**Time:** ~25 minutes total

---

## 📋 Quick Commands Reference

```bash
# Check if code is pushed
git status

# If you need to push
git add .
git commit -m "Update for deployment"
git push
```

---

## ❓ Need Help?

- **Render isn't deploying?** Check the logs in Render dashboard
- **Vercel build failing?** Check build logs in Vercel dashboard
- **CORS errors?** Make sure you updated server.js and pushed
- **API not working?** Check that VITE_API_URL is set correctly

Let me know when you've completed Step 1 and I'll help you with Step 2!

