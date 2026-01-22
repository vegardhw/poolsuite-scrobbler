# Poolsuite Last.fm Scrobbler

A Firefox extension that automatically scrobbles tracks from [Poolsuite.net](https://poolsuite.net) to your Last.fm profile.

## Features

- 🎵 Automatic track detection from Poolsuite.net
- 🔐 Secure OAuth 2.0 authentication with Last.fm
- ⚡ Real-time "Now Playing" updates
- 📊 Intelligent scrobbling (only after 30+ seconds of listening)
- 🎨 Clean, user-friendly options interface

## Installation for Local Testing

This extension is not yet published to the Firefox Add-ons store. Here's how to test it locally:

### Option 1: Quick Load (Temporary - Best for Quick Testing)

1. Clone this repository:
   ```bash
   git clone https://github.com/vegardhw/poolsuite-scrobbler.git
   cd poolsuite-scrobbler
   ```

2. **(First time only)** Generate extension icons:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   Or manually create icon files (16x16, 32x32, 48x48, 96x96 PNG) in the `icons/` folder.

3. Open Firefox and navigate to `about:debugging`

4. Click **"This Firefox"** → **"Load Temporary Add-on..."**

5. Navigate to the extension folder and select `manifest.json`

6. The extension loads **until Firefox restarts** - you'll need to reload it each time

### Option 2: Using web-ext (Recommended for Active Development)

Best for development with automatic reloading:

```bash
# Install web-ext globally (one time)
npm install -g web-ext

# Run the extension with auto-reload
cd poolsuite-scrobbler
web-ext run
```

This launches Firefox with the extension loaded and automatically reloads when you make code changes.

### Option 3: Persistent Installation (Unsigned)

For testing without reloading every time:

1. Use **Firefox Developer Edition** or **Nightly** (required for unsigned extensions)
2. Go to `about:config`
3. Set `xpinstall.signatures.required` to `false`
4. Package the extension:
   ```bash
   cd poolsuite-scrobbler
   zip -r poolsuite-scrobbler.xpi * -x "*.git*" "*.DS_Store" "README.md" "setup.sh"
   ```
5. Drag and drop the `.xpi` file into Firefox
6. Extension persists across browser restarts

## Setup

1. Click the extension icon or go to the extension options page
2. Click "Login with Last.fm"
3. Authorize the extension on Last.fm
4. Return to the options page and click "Complete Login"
5. Start playing music on [Poolsuite.net](https://poolsuite.net)!

## API Credentials

This extension uses **Web Scrobbler's public Last.fm API credentials**. These credentials are:
- ✅ Intentionally public and safe to commit to Git
- ✅ Used by thousands of users in the open-source [Web Scrobbler](https://github.com/web-scrobbler/web-scrobbler) project
- ✅ Secure - user authentication is handled through OAuth 2.0 with user-specific session keys

No additional API key setup is required! For more information, see [GET_API_CREDENTIALS.md](GET_API_CREDENTIALS.md).

## License

MIT License - see [LICENSE](LICENSE) file for details
