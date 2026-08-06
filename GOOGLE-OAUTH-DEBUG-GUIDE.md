# 🔍 Google OAuth Authentication - Debug Guide

**Status:** ✅ Comprehensive logging added  
**Commit:** `26dde52` - "Add comprehensive logging and type detection for Google OAuth"  
**Issue:** Google OAuth redirecting to reset-password page instead of /home

---

## 🐛 The Problem

**Current Behavior:**
1. User clicks "Continue with Google"
2. Google account picker opens ✅
3. User selects Google account ✅
4. After authentication, redirects to **Reset Password page** ❌
5. Expected: Should go to Dashboard/Home page

---

## ✅ Fixes Applied

### 1. **Added Type Detection in OAuth Callback**

```typescript
// CRITICAL: Check if this is a password recovery token (type=recovery)
// Google OAuth will NOT have type=recovery
if (type === 'recovery') {
  console.log('[Google OAuth Callback] This is a PASSWORD RECOVERY token, not OAuth');
  console.log('[Google OAuth Callback] Redirecting to reset-password page');
  navigate({ to: '/reset-password' });
  return;
}

// If we have an access token without type=recovery, it's OAuth
if (accessToken) {
  console.log('[Google OAuth Callback] ✅ Valid OAuth access token detected');
  // Process OAuth token and navigate to /home
}
```

### 2. **Comprehensive Console Logging**

Every step of the OAuth flow now logs to console:

**Google Sign-In Initiation:**
- ✅ Configuration (redirect URL, provider, query params)
- ✅ Platform detection (web vs mobile)
- ✅ Popup/browser window opening
- ✅ Session polling activity
- ✅ Errors and exceptions

**OAuth Callback:**
- ✅ URL and hash parameters
- ✅ Access token detection
- ✅ Token type identification (recovery vs OAuth)
- ✅ Session establishment
- ✅ User email and provider
- ✅ Navigation destination

### 3. **Fixed Token Type Confusion**

**Before:**
- All `access_token` parameters were treated the same
- Both password recovery and OAuth tokens triggered redirects

**After:**
- Password recovery tokens have `type=recovery` ✅
- OAuth tokens have NO `type` parameter ✅
- Only `type=recovery` redirects to reset-password page ✅
- OAuth tokens navigate to /home ✅

---

## 🧪 Testing Instructions

### Step 1: Open Browser Console

1. Open your browser (Chrome, Edge, Firefox)
2. Press **F12** to open Developer Tools
3. Click on **Console** tab
4. Keep this open during testing

### Step 2: Test Google Sign-In

1. Navigate to: http://localhost:8084/auth (or production URL)
2. Click **"Continue with Google"** button
3. **Watch the console** for logs starting with `[Google OAuth]`

### Step 3: Analyze Console Logs

You should see logs like this:

```
[Google OAuth] ========================================
[Google OAuth] INITIATING GOOGLE SIGN-IN
[Google OAuth] ========================================
[Google OAuth] Configuration:
[Google OAuth]   - Redirect URL: http://localhost:8084/auth
[Google OAuth]   - Current URL: http://localhost:8084/auth?mode=signin
[Google OAuth]   - Provider: google
[Google OAuth]   - Query Params: access_type=offline, prompt=select_account
[Google OAuth] ✅ OAuth initiated successfully
[Google OAuth] Platform: Web Browser
[Google OAuth] Opening popup window: {width: 500, height: 600, left: 460, top: 140}
[Google OAuth] Popup opened successfully
[Google OAuth] Starting session polling (every 500ms)...
```

Then after you select your Google account:

```
[Google OAuth Callback] Starting callback handler
[Google OAuth Callback] Current URL: http://localhost:8084/auth#access_token=...
[Google OAuth Callback] URL Hash: #access_token=...&token_type=bearer&expires_in=3600
[Google OAuth Callback] Hash Parameters: {
  hasAccessToken: true,
  hasRefreshToken: true,
  type: null,  ← CRITICAL: Should be null for OAuth
  error: null,
  errorDescription: null
}
[Google OAuth Callback] ✅ Valid OAuth access token detected
[Google OAuth Callback] Token type: implicit (OAuth)
[Google OAuth Callback] Setting session with access token...
[Google OAuth Callback] ✅ Session established successfully
[Google OAuth Callback] User: your.email@gmail.com
[Google OAuth Callback] Provider: google  ← CRITICAL: Should be "google"
[Google OAuth Callback] Running in main window, navigating to /home
```

---

## 🔍 What to Look For

### ✅ GOOD SIGNS (OAuth Working Correctly):

1. **In callback logs:**
   - `type: null` or `type: implicit (OAuth)` ✅
   - `hasAccessToken: true` ✅
   - `Provider: google` ✅
   - `Navigating to /home` ✅

2. **In browser:**
   - Popup window opens ✅
   - Google account picker shown ✅
   - After selecting account, popup closes ✅
   - Toast message: "Welcome! Signed in with Google 🎉" ✅
   - Redirects to Dashboard/Home page ✅

### ❌ BAD SIGNS (Something Wrong):

1. **If you see:**
   - `type: recovery` ← This means it's being treated as password reset
   - `Redirecting to reset-password page` ← Wrong redirect
   - `This is a PASSWORD RECOVERY token` ← Token type confusion

2. **If you see:**
   - `❌ Session error:` ← Session establishment failed
   - `❌ No session found` ← Authentication didn't complete
   - `error: access_denied` ← OAuth was denied or failed

3. **If you don't see:**
   - `[Google OAuth Callback]` logs at all ← Callback not triggered
   - `Provider: google` ← Provider not detected
   - Navigation to /home ← Redirect logic not working

---

## 🛠️ Troubleshooting

### Issue 1: Redirects to Reset Password Page

**Console shows:**
```
[Google OAuth Callback] This is a PASSWORD RECOVERY token, not OAuth
```

**Cause:** Token has `type=recovery` parameter  
**Fix:** This shouldn't happen with OAuth. Check Supabase redirect URL configuration.

**Action:**
1. Go to Supabase Dashboard: https://app.supabase.com/project/agvxymhumrrrwstfyuvk
2. Authentication → URL Configuration
3. Verify redirect URLs:
   - `http://localhost:8084/auth` (for local)
   - `https://green-harvest-buddy.onrender.com/auth` (for production)
4. Should NOT include `/reset-password` in OAuth redirect URLs

---

### Issue 2: No Logs Appear

**Console is empty, no `[Google OAuth]` logs**

**Cause:** Code not executing or JavaScript error  
**Fix:** Check browser console for errors

**Action:**
1. Look for red error messages in console
2. Check if page loaded correctly
3. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Clear browser cache and cookies

---

### Issue 3: "Google Sign-In is not configured"

**Console shows:**
```
[Google OAuth] ❌ Error initiating OAuth: Provider not enabled
```

**Cause:** Google OAuth provider not enabled in Supabase  
**Fix:** Enable Google provider in Supabase Dashboard

**Action:**
1. Go to Supabase Dashboard
2. Authentication → Providers → Google
3. Toggle **Enable Google Provider** to ON
4. Add Google OAuth credentials (Client ID & Secret)
5. Save

See `GOOGLE-OAUTH-FIX.md` for detailed Google OAuth setup instructions.

---

### Issue 4: Session Not Established

**Console shows:**
```
[Google OAuth Callback] ✅ Valid OAuth access token detected
[Google OAuth Callback] ❌ Session error: Invalid token
```

**Cause:** Token invalid or expired  
**Fix:** Check Supabase configuration

**Action:**
1. Verify `VITE_SUPABASE_ANON_KEY` is set correctly in `.env`
2. Check Supabase project URL is correct
3. Verify Google OAuth credentials in Supabase are correct
4. Try signing in again

---

## 📊 Expected Flow Diagram

```
[User] → Click "Continue with Google"
   ↓
[Google OAuth] Initiate OAuth → Open popup window
   ↓
[Google] Show account picker
   ↓
[User] Select account
   ↓
[Google] Authenticate & redirect to: /auth#access_token=...
   ↓
[OAuth Callback] Detect access_token (NO type=recovery)
   ↓
[OAuth Callback] Call supabase.auth.setSession()
   ↓
[Supabase] Establish session
   ↓
[OAuth Callback] Navigate to /home
   ↓
[User] See Dashboard/Home page ✅
```

---

## 📋 Checklist

Before reporting an issue, verify:

- [ ] Browser console is open (F12 → Console tab)
- [ ] Cleared browser cache and cookies
- [ ] Using latest code from GitHub (commit `26dde52` or later)
- [ ] Local dev server is running: `npm run dev`
- [ ] Tested on http://localhost:8084/auth
- [ ] Clicked "Continue with Google" button
- [ ] Observed `[Google OAuth]` logs in console
- [ ] Copied full console log output (for debugging)
- [ ] Checked for `type: recovery` vs `type: null` in logs
- [ ] Verified `Provider: google` appears in logs
- [ ] Checked final navigation destination

---

## 📤 Reporting the Issue

If the issue persists, provide:

1. **Full console log output** (copy all `[Google OAuth]` logs)
2. **Screenshot** of the reset password page showing URL
3. **URL in address bar** when reset password page appears
4. **Browser** and version (Chrome 120, Firefox 121, etc.)
5. **Testing URL** (local or production)

**Example console log to copy:**
```
[Google OAuth] ========================================
[Google OAuth] INITIATING GOOGLE SIGN-IN
... (copy all logs)
[Google OAuth Callback] Hash Parameters: { ... }
... (copy all logs)
```

---

## ✅ Success Criteria

OAuth is working correctly when:

1. ✅ Console shows `[Google OAuth]` logs
2. ✅ `type: null` (NOT `type: recovery`)
3. ✅ `Provider: google`
4. ✅ Session established successfully
5. ✅ Navigates to `/home` (NOT `/reset-password`)
6. ✅ Toast message: "Welcome! Signed in with Google 🎉"
7. ✅ Dashboard/Home page loads
8. ✅ User is signed in

---

## 🚀 Next Steps

1. **Test locally:** http://localhost:8084/auth
2. **Copy console logs** for analysis
3. **Check token type** in logs (`type: recovery` vs `type: null`)
4. **Verify navigation** destination in logs
5. **Report findings** with full console output

---

**All debugging tools are now in place!** The comprehensive logging will help identify exactly where the authentication flow is breaking and why it's redirecting to the wrong page.
