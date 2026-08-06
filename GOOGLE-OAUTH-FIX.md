# 🔧 Google OAuth Fix - Implementation Guide

**Status:** ✅ Code changes committed and pushed  
**Commit:** `071fd5b` - "fix: Improve Google OAuth authentication"

---

## What Was Fixed

### 1. **Supabase Client Configuration** ✅
- Added `VITE_SUPABASE_ANON_KEY` to `.env` file
- Updated Supabase client to prioritize anon key over publishable key
- Enabled PKCE flow for better security
- Enabled `detectSessionInUrl` for OAuth callback handling

### 2. **Google OAuth Handler** ✅
- Improved error handling with detailed console logging
- Fixed redirect URL to use `/auth` instead of `/home`
- Added Capacitor platform detection for mobile apps
- Added OAuth query parameters:
  - `access_type: 'offline'` - Get refresh token
  - `prompt: 'consent'` - Force consent screen

### 3. **OAuth Callback Handler** ✅
- Added `useEffect` hook to detect OAuth callback
- Processes `access_token` and `refresh_token` from URL hash
- Establishes session using `supabase.auth.setSession()`
- Clears URL hash after successful authentication
- Shows success toast and navigates to `/home`

---

## Required Supabase Configuration

**⚠️ IMPORTANT:** You need to configure Google OAuth in Supabase Dashboard:

### Step 1: Go to Supabase Dashboard
1. Visit: https://app.supabase.com/project/agvxymhumrrrwstfyuvk
2. Navigate to **Authentication** → **Providers**
3. Find **Google** provider

### Step 2: Enable Google Provider
1. Toggle **Enable Google Provider** to ON
2. You'll need to provide:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

### Step 3: Get Google OAuth Credentials

#### Option A: Use Existing Credentials (If Available)
If you already have Google OAuth credentials, use them.

#### Option B: Create New Credentials
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `Green Harvest Buddy`
7. **Authorized JavaScript origins:**
   ```
   https://green-harvest-buddy.onrender.com
   http://localhost:8085
   ```
8. **Authorized redirect URIs:**
   ```
   https://agvxymhumrrrwstfyuvk.supabase.co/auth/v1/callback
   https://green-harvest-buddy.onrender.com/auth
   http://localhost:8085/auth
   ```
9. Click **CREATE**
10. Copy the **Client ID** and **Client Secret**

### Step 4: Configure in Supabase
1. Back in Supabase **Authentication** → **Providers** → **Google**
2. Paste **Client ID**
3. Paste **Client Secret**
4. Click **Save**

### Step 5: Update Redirect URLs in Supabase
1. Go to **Authentication** → **URL Configuration**
2. Add redirect URLs:
   ```
   https://green-harvest-buddy.onrender.com/auth
   http://localhost:8085/auth
   ```

---

## Update Render Environment Variables

Add the new environment variable to Render:

1. Go to: https://dashboard.render.com/
2. Select your service: `green-harvest-buddy`
3. Go to **Environment** tab
4. Add new variable:
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndnh5bWh1bXJycndzdGZ5dXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzgyMzIsImV4cCI6MjA2MzU1NDIzMn0.ZRslCNm3mhtFzDFHUGfZ7kLg5Bi9WBj1yTIDgzGKlWM
   ```
5. Click **Save Changes**
6. Service will auto-redeploy

---

## Testing the Fix

### Test in Browser (Local)
1. Start local dev server:
   ```powershell
   npm run dev
   ```
2. Navigate to: http://localhost:8085/auth
3. Click "Continue with Google"
4. Should redirect to Google OAuth consent screen
5. After approval, should redirect back to `/auth` then to `/home`
6. Check browser console for logs: `[Google OAuth]`

### Test on Production (Render)
1. Navigate to: https://green-harvest-buddy.onrender.com/auth
2. Click "Continue with Google"
3. Complete OAuth flow
4. Should redirect to `/home` with success message

### Test on Mobile (Android APK)
1. Rebuild APK with new changes:
   ```powershell
   npm run build
   npx cap sync android
   cd android
   .\gradlew assembleDebug
   ```
2. Install APK on device
3. Tap "Continue with Google"
4. Should open Chrome Custom Tab or browser
5. After auth, should redirect back to app

---

## Troubleshooting

### Issue 1: "Google Sign-In is not configured"
**Cause:** Google provider not enabled in Supabase  
**Solution:** Follow Step 2 above to enable Google provider

### Issue 2: "redirect_uri_mismatch"
**Cause:** Redirect URI not whitelisted in Google Cloud Console  
**Solution:** Add the exact Supabase callback URL to Google OAuth client:
```
https://agvxymhumrrrwstfyuvk.supabase.co/auth/v1/callback
```

### Issue 3: OAuth works but doesn't redirect to app
**Cause:** Session not being established correctly  
**Solution:** Check browser console for `[Google OAuth]` logs. The OAuth callback handler should process the tokens.

### Issue 4: "Invalid redirect URL"
**Cause:** Redirect URL not whitelisted in Supabase  
**Solution:** Add `/auth` to Supabase URL Configuration

---

## Code Changes Summary

### File: `.env`
```env
# Added:
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndnh5bWh1bXJycndzdGZ5dXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzgyMzIsImV4cCI6MjA2MzU1NDIzMn0.ZRslCNm3mhtFzDFHUGfZ7kLg5Bi9WBj1yTIDgzGKlWM"
```

### File: `src/integrations/supabase/client.ts`
```typescript
// Changed from:
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// To:
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Added auth options:
auth: {
  detectSessionInUrl: true,
  flowType: 'pkce',
}
```

### File: `src/routes/auth.tsx`
```typescript
// Added OAuth callback handler:
useEffect(() => {
  const handleOAuthCallback = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    // ... process tokens and establish session
  };
  handleOAuthCallback();
}, [navigate]);

// Improved signInWithGoogle:
- Changed redirectTo from '/home' to '/auth'
- Added query params: access_type, prompt
- Better error handling and logging
- Added Capacitor platform detection
```

---

## Expected Behavior After Fix

### ✅ Success Flow:
1. User clicks "Continue with Google"
2. Redirects to Google OAuth consent screen
3. User approves permissions
4. Google redirects to: `https://agvxymhumrrrwstfyuvk.supabase.co/auth/v1/callback`
5. Supabase processes OAuth and redirects to: `https://green-harvest-buddy.onrender.com/auth#access_token=...`
6. Our OAuth callback handler in `/auth` detects the token
7. Establishes session using `setSession()`
8. Shows success toast: "Welcome! Signed in with Google 🎉"
9. Navigates to `/home`

---

## Next Steps

1. ✅ Code changes committed and pushed to GitHub
2. ⏳ Configure Google OAuth in Supabase Dashboard (requires your action)
3. ⏳ Add VITE_SUPABASE_ANON_KEY to Render environment variables
4. ⏳ Test on production after Render redeployment
5. ⏳ Rebuild Android APK with new changes
6. ⏳ Test on mobile device

---

**Status:** Code is ready. Waiting for Supabase Google OAuth configuration.

**Questions?** Check Supabase logs at: https://app.supabase.com/project/agvxymhumrrrwstfyuvk/logs/auth-logs
