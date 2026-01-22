# Security

## API Credentials

This extension uses **Web Scrobbler's public Last.fm API credentials**. These are intentionally public and shared across the open-source community.

### Why Public Credentials Are Safe

1. **No User Data Exposure**: The API key and shared secret are used only for:
   - Signing API requests (cryptographic verification)
   - Initiating OAuth flows

2. **OAuth 2.0 Protection**: User authentication is handled through Last.fm's OAuth 2.0 flow:
   - Users authorize the app on Last.fm's website
   - User-specific session keys are stored locally
   - No passwords are ever handled by the extension

3. **Industry Standard**: This approach is used by popular open-source projects like:
   - [Web Scrobbler](https://github.com/web-scrobbler/web-scrobbler) (100k+ users)
   - Other Last.fm integrations in the open-source community

### What's Stored Where

**In Code (Public):**
- ✅ Last.fm API Key
- ✅ Last.fm Shared Secret

**In Browser Storage (Private, User-Specific):**
- 🔒 User's Last.fm session key
- 🔒 User's Last.fm username

### Credential Rotation

If you prefer to use your own dedicated API credentials:
1. Register your app at https://www.last.fm/api/account/create
2. Replace the credentials in `background.js`
3. See [GET_API_CREDENTIALS.md](GET_API_CREDENTIALS.md) for detailed instructions

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue.

## Privacy

This extension:
- ✅ Only accesses Poolsuite.net and Last.fm API domains
- ✅ Stores data locally in browser storage
- ✅ Does not collect or transmit user data to third parties
- ✅ Does not track users
- ✅ Open source - you can audit all code

## Permissions Explained

- **`storage`**: Store user session and preferences locally
- **`tabs`**: Detect when you're on Poolsuite.net
- **`https://ws.audioscrobbler.com/*`**: Send scrobbles to Last.fm API
- **`https://www.last.fm/*`**: OAuth authentication flow
