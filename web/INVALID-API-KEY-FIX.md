# 🔧 Invalid API Key Error - Fix Guide

**Error:** "Invalid API key" shown on localhost sign-in page  
**URL:** http://localhost:8084/auth?mode=signup  
**Status:** ⚠️ Supabase API key issue

---

## 🐛 The Problem

The application is showing "Invalid API key" error because:
1. The Supabase anon key might be expired or invalid
2. The environment variables may not be loading correctly
3. The dev server wasn't restarted after environment changes

---

## ✅ Solutions

### Solution 1: Restart Dev Server (DONE ✅)

I've already restarted the dev server to load the latest environment variables.

**New URL:** http://localhost:8084/

**Please refresh your browser** and try again.

### Solution 2: Get Fresh Supabase Keys

If the error persists, you need to get fresh API keys from Supabase:

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/agvxymhumrrrwstfyuvk

2. **Navigate to Settings → API:**
   - Click "Settings" in left sidebar
   - Click "API"

3. **Copy the Anon (public) key:**
   - Look for "Project API keys"
   - Find "anon" key (starts with `eyJ...`)
   - Click the copy icon

4. **Update `.env` file:**
   ```env
   VITE_SUPABASE_ANON_KEY="<paste the new anon key here>"
   ```

5. **Restart dev server:**
   ```powershell
   # Stop the current server (Ctrl+C in terminal)
   # Then start again:
   npm run dev
   ```

### Solution 3: Verify Environment Variables

Check if environment variables are loaded:

1. **Open browser console** (F12)
2. **Paste this code:**
   ```javascript
   console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Loaded ✅' : 'Missing ❌');
   ```

**Expected output:**
```
VITE_SUPABASE_URL: https://agvxymhumrrrwstfyuvk.supabase.co
VITE_SUPABASE_ANON_KEY: Loaded ✅
```

**If you see "Missing ❌":**
- The `.env` file is not being read
- Make sure `.env` is in the root directory (d:/Green/.env)
- Restart the dev server

---

## 🔍 Current Configuration

**Your `.env` file contains:**
```env
VITE_SUPABASE_URL="https://agvxymhumrrrwstfyuvk.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Supabase client will use:**
1. First try: `import.meta.env.VITE_SUPABASE_ANON_KEY` ← Preferred
2. Fallback: `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
3. Fallback: `process.env.SUPABASE_PUBLISHABLE_KEY`

---

## 🧪 Testing Steps

1. **Open fresh browser tab** (to avoid cache issues)
2. **Navigate to:** http://localhost:8084/auth?mode=signup
3. **Check for error message:**
   - ✅ No error = Fixed!
   - ❌ Still shows "Invalid API key" = Try Solution 2

4. **Try to sign up:**
   - Fill in all fields (Full Name, Mobile, Email, Password)
   - Click "Create Account"
   - Should create account and redirect to profile page

---

## 🚨 Common Issues

### Issue 1: Old Browser Cache

**Symptom:** Still seeing "Invalid API key" after restart  
**Fix:** Hard refresh browser
- **Windows:** Ctrl + Shift + R or Ctrl + F5
- **Mac:** Cmd + Shift + R

### Issue 2: Wrong Supabase Project

**Symptom:** API key is valid but auth doesn't work  
**Fix:** Verify you're using the correct Supabase project:
- Project URL: https://agvxymhumrrrwstfyuvk.supabase.co
- Project ID: agvxymhumrrrwstfyuvk

### Issue 3: Supabase Service Down

**Symptom:** "Invalid API key" or network errors  
**Fix:** Check Supabase status:
- Go to: https://status.supabase.com/
- Look for any ongoing incidents

### Issue 4: Firewall or Network Issues

**Symptom:** Can't reach Supabase API  
**Fix:** Check network connection:
- Try accessing: https://agvxymhumrrrwstfyuvk.supabase.co
- Should see a JSON response or Supabase page
- Check firewall/antivirus settings

---

## 📋 Verification Checklist

Before reporting the issue:

- [ ] Dev server restarted (port 8084)
- [ ] Browser refreshed with Ctrl+Shift+R
- [ ] Checked browser console for errors (F12)
- [ ] Verified `.env` file exists in d:/Green/
- [ ] Verified `VITE_SUPABASE_ANON_KEY` is set
- [ ] Tested with different browser (Chrome/Firefox/Edge)
- [ ] Cleared browser cache and cookies
- [ ] Checked Supabase dashboard is accessible

---

## 🔑 Getting Correct API Keys

If you need to regenerate keys:

1. **Go to Supabase Dashboard:**
   https://app.supabase.com/project/agvxymhumrrrwstfyuvk/settings/api

2. **Look for these keys:**

**Project URL:**
```
https://agvxymhumrrrwstfyuvk.supabase.co
```

**anon / public key (starts with eyJ...):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndnh5bWh1bXJycndzdGZ5dXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzgyMzIsImV4cCI6MjA2MzU1NDIzMn0.ZRslCNm3mhtFzDFHUGfZ7kLg5Bi9WBj1yTIDgzGKlWM
```

**service_role key (starts with eyJ... - different from anon):**
```
(Keep this secret - don't share publicly)
```

3. **Update `.env` with correct keys**

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## ✅ Expected Behavior After Fix

1. **No error message** on auth page
2. **Sign up form works:**
   - Can enter name, mobile, email, password
   - Click "Create Account"
   - Account is created in Supabase
   - Redirects to profile page
   - Success toast: "Account created! Welcome 🌱"

3. **Sign in works:**
   - Can enter email and password
   - Click "Sign In"
   - Authenticated successfully
   - Redirects to home page
   - Success toast: "Welcome back!"

---

## 🆘 If Still Not Working

**Provide this information:**

1. **Browser console errors** (F12 → Console tab)
2. **Network tab errors** (F12 → Network tab, filter: supabase)
3. **Screenshot** of the error
4. **Dev server output** (terminal where `npm run dev` is running)
5. **Supabase project status** (accessible? yes/no)

**Check these logs:**
```bash
# In terminal where dev server is running, you should see:
VITE v7.3.5  ready in 13598 ms
➜  Local:   http://localhost:8084/
```

---

**Current Status:** Dev server restarted and running on http://localhost:8084/

**Next Step:** Refresh your browser at http://localhost:8084/auth and check if the error is gone.
