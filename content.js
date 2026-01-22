/**
 * Poolsuite Last.fm Scrobbler - Content Script
 * 
 * Monitors Poolsuite.net for track changes and extracts track information
 * Handles Soundcloud-based track structure with intelligent artist/title parsing
 * 
 * @author VHW
 * @version 1.0.0
 * @license MIT
 */

class PoolsuiteScrobbler {
  constructor() {
    this.currentTrack = null;
    this.trackStartTime = null;
    this.scrobbleThreshold = 30; // seconds
    this.hasScrobbled = false;
    this.checkInterval = null;
    
    this.init();
  }
  
  init() {
    console.log('[Poolsuite Scrobbler] Initializing on:', window.location.href);
    console.log('[Poolsuite Scrobbler] Page title:', document.title);
    
    // Wait for the page to fully load if it's still loading
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        console.log('[Poolsuite Scrobbler] Page loaded, starting monitoring...');
        this.startMonitoring();
      });
    } else {
      this.startMonitoring();
    }
    
    // Listen for page navigation events
    window.addEventListener('beforeunload', () => {
      this.handleTrackEnd();
    });
  }
  
  startMonitoring() {
    // Check for track info every 2 seconds
    this.checkInterval = setInterval(() => {
      this.checkForTrackChange();
    }, 2000);
    
    // Initial check
    this.checkForTrackChange();
  }
  
  checkForTrackChange() {
    const trackInfo = this.extractTrackInfo();
    
    console.log('[Poolsuite Scrobbler] Checking for track changes...', trackInfo);
    
    if (!trackInfo) {
      return;
    }
    
    const trackId = `${trackInfo.artist}-${trackInfo.title}`;
    const currentTrackId = this.currentTrack ? `${this.currentTrack.artist}-${this.currentTrack.title}` : null;
    
    if (trackId !== currentTrackId) {
      // New track detected
      if (this.currentTrack && !this.hasScrobbled) {
        this.handleTrackEnd();
      }
      
      this.handleNewTrack(trackInfo);
    }
  }
  
  /**
   * Extract track information from Poolsuite.net
   * 
   * Strategy:
   * 1. Primary: Parse "Artist - Title" format from H3 elements
   * 2. Fallback 1: Use Soundcloud username (H2) as artist, H3 as title
   * 3. Fallback 2: Use H3 content as both artist and title (avoids "Unknown Artist" rejection)
   */
  extractTrackInfo() {
    // Updated selectors based on current Poolsuite.net structure
    // H2 contains artist info, H3 contains track info
    const selectors = [
      // Poolsuite.net specific - track info in H3
      'h3',
      '.track-info h3',
      '.player h3',
      '.now-playing h3',
      // Fallback selectors
      '.track-info .title',
      '.now-playing .title',
      '.current-track .title',
      '[data-track-title]',
      '.track-title',
      '.song-title',
      '.title',
      // Generic music player selectors
      '.audio-title',
      '.media-title',
      '.playing-title'
    ];
    
    // Note: H2 elements contain Soundcloud usernames (used as fallback artist)
    // H3 elements contain track titles (may include "Artist - Title" format)
    
    let title = null;
    let artist = null;
    
    // Debug: Log all H2 and H3 elements found
    const allH2 = document.querySelectorAll('h2');
    const allH3 = document.querySelectorAll('h3');
    console.log('[Poolsuite Scrobbler] Found H2 elements (Soundcloud usernames):', Array.from(allH2).map(el => el.textContent.trim()));
    console.log('[Poolsuite Scrobbler] Found H3 elements (track titles):', Array.from(allH3).map(el => el.textContent.trim()));
    
    // Try to find title
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        console.log('[Poolsuite Scrobbler] Found title with selector:', selector, title);
        break;
      }
    }
    
    // Debug what we found in the H3 element
    console.log('[Poolsuite Scrobbler] Raw H3 title found:', title);
    
    // Now try to parse artist and title from the H3 content
    if (title) {
      // Check if title contains " - " which suggests "Artist - Title" format
      if (title.includes(' - ')) {
        console.log('[Poolsuite Scrobbler] H3 contains " - ", attempting to parse "Artist - Title" format...');
        const parsed = this.parsePoolsuiteTrackText(title);
        if (parsed && parsed.artist && parsed.title) {
          console.log('[Poolsuite Scrobbler] ✅ Successfully parsed "Artist - Title" format:', parsed);
          console.log('[Poolsuite Scrobbler] Using parsed data - Artist:', parsed.artist, 'Title:', parsed.title);
          return {
            title: parsed.title,
            artist: parsed.artist,
            timestamp: Math.floor(Date.now() / 1000)
          };
        } else {
          console.log('[Poolsuite Scrobbler] ❌ Parsing failed, parsed result:', parsed);
        }
      } else {
        console.log('[Poolsuite Scrobbler] No " - " found in H3, cannot parse "Artist - Title" format');
      }
      
      // If no " - " found or parsing failed, implement fallback strategy
      console.log('[Poolsuite Scrobbler] 🔄 Implementing fallback strategy...');
      
      // FALLBACK 1: Try to get Soundcloud username from H2 elements
      let fallbackArtist = this.extractSoundcloudUsername();
      
      if (fallbackArtist) {
        console.log('[Poolsuite Scrobbler] 🎯 FALLBACK 1: Using Soundcloud username as artist:', fallbackArtist);
        return {
          title: title,
          artist: fallbackArtist,
          timestamp: Math.floor(Date.now() / 1000)
        };
      }
      
      // FALLBACK 2: Use track title as artist (Last.fm requires non-empty artist)
      console.log('[Poolsuite Scrobbler] 🎯 FALLBACK 2: Using title as artist to avoid Last.fm rejection');
      return {
        title: title,
        artist: title, // Use title as artist to avoid "Unknown Artist" rejection
        timestamp: Math.floor(Date.now() / 1000)
      };
    }
    
    // If no H3 found, fall back to other methods
    
    // Fallback: look for patterns in meta tags or title
    if (!title || !artist) {
      const metaInfo = this.extractFromMeta();
      title = title || metaInfo.title;
      artist = artist || metaInfo.artist;
      if (metaInfo.title || metaInfo.artist) {
        console.log('[Poolsuite Scrobbler] Found track info from meta tags:', metaInfo);
      }
    }
    
    // Another fallback: parse from page title or other text
    if (!title || !artist) {
      const fallbackInfo = this.extractFromFallback();
      title = title || fallbackInfo.title;
      artist = artist || fallbackInfo.artist;
      if (fallbackInfo.title || fallbackInfo.artist) {
        console.log('[Poolsuite Scrobbler] Found track info from fallback:', fallbackInfo);
      }
    }
    
    // Debug: log all potential track-related elements
    if (!title && !artist) {
      console.log('[Poolsuite Scrobbler] No track info found, debugging DOM...');
      this.debugDOMElements();
    }
    
    if (title && artist) {
      return {
        title: title,
        artist: artist,
        timestamp: Math.floor(Date.now() / 1000)
      };
    }
    
    return null;
  }
  
  /**
   * Extract Soundcloud username from H2 elements
   * H2 elements on Poolsuite.net contain Soundcloud usernames which can serve as artist fallback
   * Target: H2 with classes "font-everyday leading-none mt-[5px] text-[10px] tracking-[-1px] min-h-[10px]"
   */
  extractSoundcloudUsername() {
    console.log('[Poolsuite Scrobbler] Attempting to extract Soundcloud username...');
    
    // Target the specific H2 element with Soundcloud username styling
    // This H2 has classes: font-everyday leading-none mt-[5px] text-[10px] tracking-[-1px] min-h-[10px]
    const soundcloudH2Selectors = [
      'h2.font-everyday.leading-none.mt-\\[5px\\].text-\\[10px\\].tracking-\\[-1px\\].min-h-\\[10px\\]', // Exact match
      'h2.font-everyday.leading-none.text-\\[10px\\]', // Partial match (more flexible)
      'h2.font-everyday', // Fallback to font class
    ];
    
    for (const selector of soundcloudH2Selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          const username = element.textContent.trim();
          
          // Skip if it's the "Poolsuite" header or other common patterns
          const skipPatterns = [
            'poolsuite', 'fm', 'radio', 'channel', 'default'
          ];
          
          const isSkippable = skipPatterns.some(pattern => 
            username.toLowerCase().includes(pattern.toLowerCase())
          );
          
          if (!isSkippable && username.length > 1) {
            console.log('[Poolsuite Scrobbler] Found Soundcloud username with selector:', selector, username);
            return username;
          }
        }
      } catch (error) {
        // CSS selector might be invalid, continue to next
        console.log('[Poolsuite Scrobbler] Selector failed:', selector, error.message);
      }
    }
    
    // Fallback: look at all H2 elements and use heuristics
    console.log('[Poolsuite Scrobbler] Specific selectors failed, trying heuristic approach...');
    const allH2 = document.querySelectorAll('h2');
    
    console.log('[Poolsuite Scrobbler] Found H2 elements:', Array.from(allH2).map(el => ({
      text: el.textContent.trim(),
      classes: el.className
    })));
    
    for (const h2 of allH2) {
      const username = h2.textContent.trim();
      const classes = h2.className;
      
      // Skip empty or very short usernames
      if (!username || username.length < 2) {
        continue;
      }
      
      // Skip the "Poolsuite" header H2 (has "uppercase font-ishmeria" classes)
      if (classes.includes('uppercase') || classes.includes('font-ishmeria')) {
        console.log('[Poolsuite Scrobbler] Skipping Poolsuite header H2:', username);
        continue;
      }
      
      // Skip common non-username text patterns
      const skipPatterns = [
        'poolsuite', 'fm', 'radio', 'now playing', 'current track',
        'loading', 'buffering', 'playlist', 'next', 'previous', 'channel', 'default'
      ];
      
      const isSkippable = skipPatterns.some(pattern => 
        username.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isSkippable) {
        console.log('[Poolsuite Scrobbler] Skipping H2 (common pattern):', username);
        continue;
      }
      
      // If we found a reasonable username, return it
      console.log('[Poolsuite Scrobbler] Found potential Soundcloud username via heuristics:', username);
      return username;
    }
    
    console.log('[Poolsuite Scrobbler] No valid Soundcloud username found');
    return null;
  }
  
  parsePoolsuiteTrackText(text) {
    // Parse format: "Artist - Title" with Soundcloud premiere prefix cleanup
    // Examples: 
    // "PREMIERE: Retromigration - Arranciata" → Artist: "Retromigration", Title: "Arranciata"
    // "PREMIERE : Nebraska - Cop Show" → Artist: "Nebraska", Title: "Cop Show"
    // "Regular Artist - Track Name" → Artist: "Regular Artist", Title: "Track Name"
    
    console.log('[Poolsuite Scrobbler] Parsing track text:', text);
    
    // Split by " - " to get artist and title
    const dashIndex = text.indexOf(' - ');
    
    if (dashIndex !== -1) {
      let artist = text.substring(0, dashIndex).trim();
      const title = text.substring(dashIndex + 3).trim(); // +3 for " - "
      
      console.log('[Poolsuite Scrobbler] Raw parsed artist:', artist, 'title:', title);
      
      // Clean up artist name - remove Soundcloud premiere prefixes
      const premierePatterns = [
        'PREMIERE: ',  // With colon and space
        'PREMIERE : ', // With space, colon, space
        'PREMIERE:',   // With colon only (fallback)
        'PREMIERE :'   // With space and colon (fallback)
      ];
      
      for (const pattern of premierePatterns) {
        if (artist.startsWith(pattern)) {
          const cleanedArtist = artist.substring(pattern.length).trim();
          console.log('[Poolsuite Scrobbler] Removed premiere prefix "' + pattern + '" from artist');
          console.log('[Poolsuite Scrobbler] Artist before cleanup:', artist);
          console.log('[Poolsuite Scrobbler] Artist after cleanup:', cleanedArtist);
          artist = cleanedArtist;
          break; // Only remove the first matching pattern
        }
      }
      
      console.log('[Poolsuite Scrobbler] Final parsed artist:', artist, 'title:', title);
      
      return {
        artist: artist,
        title: title
      };
    }
    
    // If no " - " found, treat the whole text as title with unknown artist
    console.log('[Poolsuite Scrobbler] No " - " separator found, treating as title only');
    return {
      artist: 'Unknown Artist',
      title: text.trim()
    };
  }
  
  extractFromMeta() {
    // Check meta tags for track info
    const titleMeta = document.querySelector('meta[property="og:title"]') || 
                     document.querySelector('meta[name="title"]');
    const descMeta = document.querySelector('meta[property="og:description"]') ||
                    document.querySelector('meta[name="description"]');
    
    let title = null;
    let artist = null;
    
    if (titleMeta) {
      const content = titleMeta.content;
      // Try to parse "Artist - Title" format
      const match = content.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      if (match) {
        artist = match[1].trim();
        title = match[2].trim();
      }
    }
    
    return { title, artist };
  }
  
  extractFromFallback() {
    // Last resort: try to find track info in any text content
    const bodyText = document.body.textContent || '';
    
    // Look for common patterns
    const patterns = [
      /Now Playing[:\s]*(.+?)\s*[-–—]\s*(.+)/i,
      /Currently Playing[:\s]*(.+?)\s*[-–—]\s*(.+)/i,
      /♪\s*(.+?)\s*[-–—]\s*(.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        return {
          artist: match[1].trim(),
          title: match[2].trim()
        };
      }
    }
    
    return { title: null, artist: null };
  }
  
  debugDOMElements() {
    // Log potentially relevant elements for debugging
    console.log('[Poolsuite Scrobbler] Debugging DOM elements...');
    
    // Look for any elements that might contain track info
    const potentialSelectors = [
      'audio', 'video', // Media elements
      '[class*="track"]', '[class*="song"]', '[class*="music"]', 
      '[class*="player"]', '[class*="playing"]', '[class*="current"]',
      '[id*="track"]', '[id*="song"]', '[id*="music"]',
      '[id*="player"]', '[id*="playing"]', '[id*="current"]'
    ];
    
    potentialSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`[Poolsuite Scrobbler] Found ${elements.length} elements for selector "${selector}"`);
        elements.forEach((el, index) => {
          if (index < 3) { // Only log first 3 to avoid spam
            console.log(`  - Element ${index + 1}:`, el.tagName, el.className, el.id, el.textContent?.slice(0, 50));
          }
        });
      }
    });
    
    // Also check for any audio elements specifically
    const audioElements = document.querySelectorAll('audio, video');
    if (audioElements.length > 0) {
      console.log('[Poolsuite Scrobbler] Found media elements:', audioElements.length);
      audioElements.forEach((media, index) => {
        console.log(`  - Media ${index + 1}:`, {
          src: media.src || media.currentSrc,
          duration: media.duration,
          currentTime: media.currentTime,
          paused: media.paused
        });
      });
    }
  }
  
  handleNewTrack(trackInfo) {
    console.log('[Poolsuite Scrobbler] New track detected:', trackInfo);
    
    this.currentTrack = trackInfo;
    this.trackStartTime = Date.now();
    this.hasScrobbled = false;
    
    // Send "Now Playing" update to Last.fm
    this.sendNowPlaying(trackInfo);
    
    // Start scrobble timer
    setTimeout(() => {
      if (this.currentTrack === trackInfo && !this.hasScrobbled) {
        this.scrobbleTrack(trackInfo);
      }
    }, this.scrobbleThreshold * 1000);
  }
  
  handleTrackEnd() {
    if (this.currentTrack && !this.hasScrobbled) {
      const playDuration = (Date.now() - this.trackStartTime) / 1000;
      
      // Scrobble if played for at least 30 seconds or half the track (whichever is less)
      if (playDuration >= this.scrobbleThreshold) {
        this.scrobbleTrack(this.currentTrack);
      }
    }
  }
  
  sendNowPlaying(trackInfo) {
    browser.runtime.sendMessage({
      action: 'nowPlaying',
      track: trackInfo
    }).then((response) => {
      if (response && response.success) {
        console.log('[Poolsuite Scrobbler] Now Playing sent successfully');
      } else {
        console.error('[Poolsuite Scrobbler] Failed to send Now Playing:', response?.error);
      }
    }).catch((error) => {
      console.error('[Poolsuite Scrobbler] Error sending Now Playing:', error);
    });
  }
  
  scrobbleTrack(trackInfo) {
    if (this.hasScrobbled) return;
    
    this.hasScrobbled = true;
    
    browser.runtime.sendMessage({
      action: 'scrobble',
      track: trackInfo
    }).then((response) => {
      if (response && response.success) {
        console.log('[Poolsuite Scrobbler] Track scrobbled successfully');
      } else {
        console.error('[Poolsuite Scrobbler] Failed to scrobble track:', response?.error);
      }
    }).catch((error) => {
      console.error('[Poolsuite Scrobbler] Error scrobbling track:', error);
    });
  }
}

// Initialize the scrobbler when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PoolsuiteScrobbler();
  });
} else {
  new PoolsuiteScrobbler();
}
