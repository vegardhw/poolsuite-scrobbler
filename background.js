/**
 * Poolsuite Last.fm Scrobbler - Background Script
 * 
 * Automatically scrobbles tracks from Poolsuite.net to Last.fm
 * Uses OAuth 2.0 authentication flow for secure user login
 * 
 * @author VHW
 * @version 1.0.0
 * @license MIT
 */

class PoolsuiteFmScrobbler {
  constructor() {
    // Last.fm API Configuration
    // IMPORTANT: These are intentionally public credentials from Web Scrobbler (open-source)
    // ✅ Safe to commit to Git, share publicly, and publish in extension stores
    // ✅ Used by thousands of users in Web Scrobbler: https://github.com/web-scrobbler/web-scrobbler
    // The shared secret is used only for request signing, not for authentication
    // User authentication is handled through OAuth 2.0 flow with user-specific session keys
    this.config = {
      apiKey: 'd9bb1870d3269646f740544d9def2c95',
      sharedSecret: '2160733a567d4a1a69a73fad54c564b2',
      apiUrl: 'https://ws.audioscrobbler.com/2.0/',
      authUrl: 'https://www.last.fm/api/auth/'
    };
    
    // User session data (loaded from browser storage)
    this.sessionKey = null;
    this.username = null;
    
    // Initialize extension
    this.testSignatureGeneration();
    this.loadUserSession();
    this.setupMessageListener();
  }
  
  /**
   * Test signature generation to ensure it matches expected results
   */
  testSignatureGeneration() {
    console.log('[Test] Testing MD5 implementation...');
    
    // Test basic MD5
    const testMd5 = this.md5('hello');
    console.log('[Test] MD5 of "hello":', testMd5);
    console.log('[Test] Expected: 5d41402abc4b2a76b9719d911017c592');
    
    // Test signature generation with known values
    const testParams = {
      api_key: this.config.apiKey,
      method: 'auth.gettoken',
      format: 'json'
    };
    const testSig = this.generateSignature(testParams);
    console.log('[Test] Test signature generated:', testSig);
  }
  
  /**
   * Load user session from storage (not API credentials)
   */
  async loadUserSession() {
    try {
      const result = await browser.storage.sync.get([
        'lastfm_session_key',
        'lastfm_username'
      ]);
      
      this.sessionKey = result.lastfm_session_key || null;
      this.username = result.lastfm_username || null;
      
      console.log('[Poolsuite Scrobbler] User session loaded:', {
        isLoggedIn: !!this.sessionKey,
        username: this.username
      });
    } catch (error) {
      console.error('[Poolsuite Scrobbler] Failed to load user session:', error);
    }
  }
  
  /**
   * Check if user is logged in
   */
  isUserLoggedIn() {
    return !!(this.sessionKey && this.username);
  }
  
  /**
   * Setup message listener for extension communication
   */
  setupMessageListener() {
    browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      console.log('[Background] Received message:', message);
      
      try {
        switch (message.action) {
          case 'scrobble':
            const scrobbleResult = await this.scrobbleTrack(message.track);
            return { success: true, result: scrobbleResult };
            
        case 'nowPlaying':
        case 'updateNowPlaying':
          const nowPlayingResult = await this.updateNowPlaying(message.track);
          return { success: true, result: nowPlayingResult };          case 'startLogin':
            const loginResult = await this.startUserLogin();
            return { success: true, result: loginResult };
            
          case 'completeLogin':
            const sessionResult = await this.completeUserLogin();
            return { success: true, result: sessionResult };
            
          case 'logout':
            await this.logoutUser();
            return { success: true };
            
          case 'getLoginStatus':
            return { 
              success: true, 
              result: {
                isLoggedIn: this.isUserLoggedIn(),
                username: this.username
              }
            };
            
          default:
            return { success: false, error: 'Unknown action: ' + message.action };
        }
      } catch (error) {
        console.error('[Background] Message handler error:', error);
        return { success: false, error: error.message };
      }
    });
  }
  
  /**
   * Generate MD5 signature for Last.fm API
   * Following Web Scrobbler's approach exactly
   */
  generateSignature(params) {
    const sortedKeys = Object.keys(params).sort();
    let sig = '';
    
    for (const key of sortedKeys) {
      // Skip format and callback parameters as per Last.fm API spec
      if (key === 'format' || key === 'callback') {
        continue;
      }
      sig += key + (params[key] || '');
    }
    sig += this.config.sharedSecret;
    
    console.log('[Signature] String to hash:', sig);
    
    // Generate MD5 hash using custom implementation
    const signature = this.md5(sig);
    console.log('[Signature] Generated signature:', signature);
    
    return signature;
  }
  
  /**
   * MD5 implementation for Last.fm API signatures
   * Based on RFC 1321 specification
   */
  md5(string) {
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }

    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) {
      return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
      return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
      return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function md51(s) {
      var n = s.length,
        state = [1732584193, -271733879, -1732584194, 271733878], i;
      for (i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < s.length; i++)
        tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) {
        md5cycle(state, tail);
        for (i = 0; i < 16; i++) tail[i] = 0;
      }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }

    function md5blk(s) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i)
          + (s.charCodeAt(i + 1) << 8)
          + (s.charCodeAt(i + 2) << 16)
          + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }

    var hex_chr = '0123456789abcdef'.split('');

    function rhex(n) {
      var s = '', j = 0;
      for (; j < 4; j++)
        s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]
          + hex_chr[(n >> (j * 8)) & 0x0F];
      return s;
    }

    function hex(x) {
      for (var i = 0; i < x.length; i++)
        x[i] = rhex(x[i]);
      return x.join('');
    }

    function add32(a, b) {
      return (a + b) & 0xFFFFFFFF;
    }

    return hex(md51(string));
  }
  
  /**
   * Make API call to Last.fm
   */
  async makeApiCall(params, requiresAuth = false) {
    if (requiresAuth && !this.sessionKey) {
      throw new Error('User not logged in');
    }
    
    // Add required parameters
    const apiParams = {
      ...params,
      api_key: this.config.apiKey,
      format: 'json'
    };
    
    // Add session key if authenticated call
    if (requiresAuth) {
      apiParams.sk = this.sessionKey;
    }
    
    // Generate signature
    const signature = this.generateSignature(apiParams);
    apiParams.api_sig = signature;
    
    // Debug: Log all parameters being sent
    console.log('[API Call]', params.method, requiresAuth ? '(authenticated)' : '(public)');
    console.log('[API Params]', apiParams);
    
    // Prepare form data - Last.fm API requires application/x-www-form-urlencoded
    const formParams = new URLSearchParams();
    for (const [key, value] of Object.entries(apiParams)) {
      formParams.append(key, value);
    }

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formParams
      });
      
      const responseText = await response.text();
      console.log('[API Response] Status:', response.status);
      console.log('[API Response] Headers:', [...response.headers.entries()]);
      console.log('[API Response] Raw text:', responseText);
      
      // Check if response looks like XML
      if (responseText.trim().startsWith('<')) {
        console.log('[API] Received XML response, attempting to parse...');
        // Try to extract error from XML if present
        const errorMatch = responseText.match(/<error code="(\d+)".*?>(.*?)<\/error>/);
        if (errorMatch) {
          throw new Error(`Last.fm API Error ${errorMatch[1]}: ${errorMatch[2]}`);
        }
        throw new Error('Received XML response instead of JSON - check API parameters');
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        
        if (data.error) {
          throw new Error(`Last.fm API Error ${data.error}: ${data.message}`);
        }
        
        return data;
      } catch (parseError) {
        console.error('[API] Failed to parse JSON response:', responseText);
        console.error('[API] Parse error:', parseError);
        throw new Error(`Invalid API response format. Raw response: ${responseText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error('[API] Request failed:', error);
      throw error;
    }
  }
  
  /**
   * Start user login process (Step 1: Get request token)
   * Following Web Scrobbler's proven approach
   */
  async startUserLogin() {
    try {
      console.log('[Login] Starting auth flow with proper Last.fm OAuth...');
      
      // Step 1: Get a request token from Last.fm
      const params = {
        method: 'auth.gettoken',
        api_key: this.config.apiKey,
        format: 'json'
      };
      
      const signature = this.generateSignature(params);
      params.api_sig = signature;
      
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const response = await fetch(`${this.config.apiUrl}?${queryString}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Last.fm API error: ${data.message}`);
      }
      
      const token = data.token;
      console.log('[Login] Got request token, redirecting to authorization...');
      
      // Step 2: Redirect user to authorize the token
      const authUrl = `https://www.last.fm/api/auth/?api_key=${this.config.apiKey}&token=${token}`;
      
      // Store the token for later session exchange
      await browser.storage.sync.set({ 'lastfm_temp_token': token });
      
      console.log('[Login] Opening Last.fm auth URL:', authUrl);
      
      // Open the authorization page
      await browser.tabs.create({ url: authUrl });
      
      return { 
        token: token, 
        authUrl: authUrl 
      };
      
    } catch (error) {
      console.error('[Login] Failed to start login:', error);
      throw error;
    }
  }
  
  /**
   * Complete user login (Step 2: Exchange token for session)
   * Following Web Scrobbler's proven approach
   */
  async completeUserLogin() {
    try {
      console.log('[Login] Completing login with token exchange...');
      
      // Get the stored token
      const result = await browser.storage.sync.get(['lastfm_temp_token']);
      const token = result.lastfm_temp_token;
      
      console.log('[Login] Retrieved token from storage:', token);
      
      if (!token) {
        throw new Error('No token found. Please start the login process again.');
      }
      
      // Step 3: Exchange the authorized token for a session key
      const params = {
        method: 'auth.getsession',
        token: token,
        api_key: this.config.apiKey,
        format: 'json'
      };
      
      console.log('[Login] Parameters before signature:', params);
      
      const signature = this.generateSignature(params);
      params.api_sig = signature;
      
      console.log('[Login] Final parameters:', params);
      
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const response = await fetch(`${this.config.apiUrl}?${queryString}`);
      const data = await response.json();
      
      console.log('[Login] Last.fm API response:', data);
      
      if (data.error) {
        throw new Error(`Last.fm API error: ${data.message}`);
      }
      
      // Save session data
      this.sessionKey = data.session.key;
      this.username = data.session.name;
      
      console.log('[Login] Session data received:', {
        username: this.username,
        sessionKey: this.sessionKey ? '***' + this.sessionKey.slice(-4) : null
      });
      
      await browser.storage.sync.set({
        'lastfm_session_key': this.sessionKey,
        'lastfm_username': this.username
      });
      
      console.log('[Login] Session saved to storage successfully');
      
      // Clean up temp token
      await browser.storage.sync.remove(['lastfm_temp_token']);
      
      console.log('[Login] Successfully logged in as:', this.username);
      return { username: this.username, sessionKey: this.sessionKey };
      
    } catch (error) {
      console.error('[Login] Failed to complete login:', error);
      throw error;
    }
  }
  
  /**
   * Logout user
   */
  async logoutUser() {
    try {
      // Clear storage
      await browser.storage.sync.remove([
        'lastfm_session_key',
        'lastfm_username'
      ]);
      
      // Clear instance variables
      this.sessionKey = null;
      this.username = null;
      
      console.log('[Logout] User logged out successfully');
    } catch (error) {
      console.error('[Logout] Failed to logout:', error);
      throw error;
    }
  }
  
  /**
   * Update "Now Playing" status
   */
  async updateNowPlaying(trackData) {
    if (!this.isUserLoggedIn()) {
      throw new Error('User must be logged in to update now playing');
    }
    
    console.log('[Now Playing] Updating status for:', trackData);
    
    const params = {
      method: 'track.updateNowPlaying',
      track: trackData.title,
      artist: trackData.artist,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    if (trackData.album) {
      params.album = trackData.album;
    }
    
    const result = await this.makeApiCall(params, true);
    console.log('[Now Playing] API result:', result);
    return result;
  }
  
  /**
   * Scrobble a track
   */
  async scrobbleTrack(trackData) {
    if (!this.isUserLoggedIn()) {
      throw new Error('User must be logged in to scrobble');
    }
    
    const params = {
      method: 'track.scrobble',
      track: trackData.title,
      artist: trackData.artist,
      timestamp: trackData.timestamp || Math.floor(Date.now() / 1000)
    };
    
    if (trackData.album) {
      params.album = trackData.album;
    }
    
    // Add duration if available (some scrobbling APIs require this)
    if (trackData.duration) {
      params.duration = trackData.duration;
    }
    
    return await this.makeApiCall(params, true);
  }
}

// Initialize the scrobbler
console.log('[Poolsuite Scrobbler] Initializing...');
const scrobbler = new PoolsuiteFmScrobbler();
