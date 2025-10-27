# 🚨 OpenAI API Key Leak - Action Required

## ⚠️ Critical Security Issue

Your OpenAI API key was exposed in the code and pushed to GitHub. You need to take immediate action.

## 🔒 Step 1: Revoke the Compromised Key (Do This NOW)

1. Go to: https://platform.openai.com/api-keys
2. Find the key starting with `sk-proj-CbZES...`
3. Click the **trash icon** to delete it
4. Confirm deletion

**Time to revoke:** 2 minutes

---

## ✅ Step 2: Create New API Key

1. On the same page, click **"Create new secret key"**
2. **Copy the new key immediately** (you won't see it again!)
3. Give it a name like: "SmartSpend Production"

**Time to create:** 1 minute

---

## 🔄 Step 3: Add New Key to Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Edit `VITE_OPENAI_API_KEY`
4. Replace with your **new** API key
5. Save

**Time to update:** 1 minute

---

## 🧹 Step 4: Clean Git History (Optional but Recommended)

The old key is still in git history. To remove it:

### Option A: Rewrite Git History (Advanced)
```bash
# Warning: This rewrites history - coordinate with team!
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch src/lib/ai.ts' \
  --prune-empty --tag-name-filter cat -- --all
```

### Option B: Accept the Risk (Simpler)
- The key is revoked, so it won't work
- New key is safe
- Git history is public anyway
- Most developers just revoke and move on

**Recommended:** Just do Step 1-3. The old key won't work anymore.

---

## ✅ That's It!

- ✅ Old key revoked
- ✅ New key created  
- ✅ New key added to Vercel
- ✅ Your app continues working with AI

Total time: **5 minutes**

---

## 📝 Lessons Learned

For production apps, **never** hardcode API keys in:
- ❌ Source code
- ❌ Public repositories
- ✅ Always use environment variables

This is why we moved it to `VITE_OPENAI_API_KEY`! 🎉

---

## 🛡️ Going Forward

Monitor your OpenAI usage:
- https://platform.openai.com/usage
- Set up billing alerts
- Check if anyone else used your leaked key

**The good news:** Since you revoked it immediately, damage should be minimal.

