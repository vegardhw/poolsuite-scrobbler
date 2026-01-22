# Last.fm API Credentials

## Current Setup: Using Web Scrobbler's Public Credentials

This extension currently uses **Web Scrobbler's public API credentials**, which are intentionally shared and safe to use in open-source projects. These credentials are already configured in the code and work out of the box.

**No action needed** - the extension is ready to use as-is!

---

## Optional: Register Your Own Application (Advanced)

If you prefer to use your own dedicated Last.fm API credentials instead of the shared ones:

### Step 1: Register Your Application

1. **Go to Last.fm API Account Creation:**
   https://www.last.fm/api/account/create

2. **Fill out the form:**
   - **Application name:** `Poolsuite Scrobbler`
   - **Application description:** `Automatically scrobbles tracks from Poolsuite.net to Last.fm`
   - **Application homepage URL:** `https://poolsuite.net` (or your own domain)
   - **Callback URL:** Leave blank (not needed for desktop apps)

3. **Submit the form** and you'll get:
   - **API Key** (32-character hex string)
   - **Shared Secret** (32-character hex string)

## Step 2: Update Your Extension

Replace these lines in `background.js`:

```javascript
// CURRENT (Web Scrobbler's public credentials - already working)
this.apiKey = 'd9bb1870d3269646f740544d9def2c95';
this.sharedSecret = '2160733a567d4a1a69a73fad54c564b2';

// IF YOU WANT YOUR OWN (Optional - your registered credentials)
this.apiKey = 'YOUR_ACTUAL_API_KEY_HERE';
this.sharedSecret = 'YOUR_ACTUAL_SHARED_SECRET_HERE';
```

## Step 3: Test the Extension

Once you have real credentials:
1. Update the background.js file
2. Reload the extension in Firefox
3. Try the "Login with Last.fm" button again

## Why You Might Want Your Own

The current credentials are Web Scrobbler's public credentials and work perfectly fine. However, you might want your own if:
- You're creating a commercial product
- You want separate API usage statistics
- You want full control over the API application

## For Publishing and Security

When you publish this extension:
- **Keep your credentials private** in your development version
- **Don't share your shared secret** publicly
- **Each published extension needs its own registered app**

This is the standard practice for all Last.fm integrations (Spotify, Apple Music, etc. all do this).
