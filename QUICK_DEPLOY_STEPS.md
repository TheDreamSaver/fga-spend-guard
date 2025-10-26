# Quick Deploy in 30 Minutes 🚀

## Step 1: Deploy Backend to Render (10 min)

1. Go to https://render.com
2. **Sign up** (or sign in)
3. Click **"New"** → **"Web Service"**
4. **Connect your GitHub repository**
5. Configure:
   - **Name:** `smart-spend-backend`
   - **Environment:** `Node`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
6. Click **"Add Environment Variable"** → Add:
   ```
   OPENFGA_STORE_ID=YOUR_FGA_STORE_ID
   OPENFGA_AUTHORIZATION_MODEL_ID=YOUR_FGA_AUTHORIZATION_MODEL_ID
   OPENFGA_CLIENT_ID=YOUR_FGA_CLIENT_ID
   OPENFGA_CLIENT_SECRET=REDACTED_FGA_CLIENT_SECRET
   OPENFGA_API_URL=https://api.us1.fga.dev
   ```
7. Click **"Create Web Service"**
8. **Wait 2-3 minutes** for deployment
9. **Copy the URL:** `https://smart-spend-backend.onrender.com`

## Step 2: Deploy Frontend to Vercel (10 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable
vercel env add VITE_API_URL
# Enter: https://smart-spend-backend.onrender.com (from step 1)

# Deploy to production
vercel --prod
```

## Step 3: Update Backend CORS (5 min)

Edit `server.js` line 63, update:
```javascript
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://your-frontend.vercel.app'  // Your Vercel URL
];
```

Push to GitHub:
```bash
git add server.js
git commit -m "Update CORS for production"
git push
```

Render will auto-redeploy!

## Step 4: Done! ✅

- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-app.render.com  
- **Storage:** File-based (works!)
- **Cost:** $0/month

---

## 🎯 This is the Fastest Path!

You'll be live in under 30 minutes with ZERO code changes (except CORS update).

Want me to help with any step? Just ask!

