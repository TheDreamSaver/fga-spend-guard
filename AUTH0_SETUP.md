# 🔐 Auth0 Configuration for Production

Your app is deployed at: **https://fga-spend-guard-3.vercel.app**

## 📋 What to Update in Auth0 Dashboard

### Step 1: Go to Auth0 Dashboard

1. Visit: https://manage.auth0.com
2. Select your tenant: **genai-4974078323403177**
3. Go to **Applications** in the sidebar

### Step 2: Find Your Application

Look for the application with **Client ID:** `iheHWjYxvIrrYAru4B382ywXsTUY8q39`

### Step 3: Update Allowed Callback URLs

In the **Allowed Callback URLs** field, add:

```
http://localhost:8080/app,https://fga-spend-guard-3.vercel.app/app
```

**Current value should be:** `http://localhost:8080/app`  
**New value should be:** `http://localhost:8080/app,https://fga-spend-guard-3.vercel.app/app`

### Step 4: Update Allowed Logout URLs

In the **Allowed Logout URLs** field, add:

```
http://localhost:8080,https://fga-spend-guard-3.vercel.app
```

### Step 5: Update Allowed Web Origins (if exists)

Add: `https://fga-spend-guard-3.vercel.app`

### Step 6: Save Changes

Click **"Save Changes"** at the bottom

---

## ✅ Summary of URLs to Add

| Field | Add This |
|-------|----------|
| **Allowed Callback URLs** | `https://fga-spend-guard-3.vercel.app/app` |
| **Allowed Logout URLs** | `https://fga-spend-guard-3.vercel.app` |
| **Allowed Web Origins** | `https://fga-spend-guard-3.vercel.app` |

---

## 🎯 After This, Your App Will:

- ✅ Allow users to sign in with Auth0
- ✅ Redirect back to your Vercel app after login
- ✅ Work in both local development and production

---

## 📸 Exact Fields to Update

**Allowed Callback URLs:**
```
http://localhost:8080/app,https://fga-spend-guard-3.vercel.app/app
```

**Allowed Logout URLs:**
```
http://localhost:8080,https://fga-spend-guard-3.vercel.app
```

**Allowed Web Origins:**
```
https://fga-spend-guard-3.vercel.app
```

---

## ⚠️ Important

Make sure there are **NO TRAILING SLASHES** in the URLs!

✅ Correct: `https://fga-spend-guard-3.vercel.app/app`  
❌ Wrong: `https://fga-spend-guard-3.vercel.app/app/`

