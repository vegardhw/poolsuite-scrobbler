/**
 * Poolsuite Last.fm Scrobbler - Options Page
 * 
 * Provides user interface for Last.fm authentication and status display
 * Handles OAuth 2.0 flow for secure user login
 * 
 * @author VHW
 * @version 1.0.0
 * @license MIT
 */

// DOM elements
const loginStatus = document.getElementById('loginStatus');
const loginButton = document.getElementById('loginButton');
const completeLoginButton = document.getElementById('completeLoginButton');
const logoutButton = document.getElementById('logoutButton');
const loginInstructions = document.getElementById('loginInstructions');
const statusMessage = document.getElementById('statusMessage');
const scrobblingStatus = document.getElementById('scrobblingStatus');

// State
let pendingToken = null;

/**
 * Initialize the options page
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Options page loaded');
    
    // Add event listeners
    loginButton.addEventListener('click', startLogin);
    completeLoginButton.addEventListener('click', completeLogin);
    logoutButton.addEventListener('click', logout);
    
    // Check initial login status
    await checkLoginStatus();
});

/**
 * Check if user is currently logged in
 */
async function checkLoginStatus() {
    try {
        const response = await browser.runtime.sendMessage({
            action: 'getLoginStatus'
        });
        
        if (response.success) {
            updateUIForLoginStatus(response.result.isLoggedIn, response.result.username);
        } else {
            showStatus('Failed to check login status: ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Failed to check login status:', error);
        showStatus('Error checking login status', 'error');
    }
}

/**
 * Update UI based on login status
 */
function updateUIForLoginStatus(isLoggedIn, username = null) {
    if (isLoggedIn && username) {
        // User is logged in
        loginStatus.className = 'login-status logged-in';
        loginStatus.innerHTML = `
            <div>✅ Logged in as <span class="username">${username}</span></div>
            <div class="info-text">Ready to scrobble tracks from Poolsuite.net!</div>
        `;
        
        loginButton.classList.add('hidden');
        completeLoginButton.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        loginInstructions.style.display = 'none';
        
        scrobblingStatus.innerHTML = `
            <span style="color: #28a745;">🟢 Active</span> - 
            Tracks from Poolsuite.net will be automatically scrobbled to ${username}'s Last.fm profile
        `;
    } else {
        // User is not logged in
        loginStatus.className = 'login-status logged-out';
        loginStatus.innerHTML = `
            <div>❌ Not logged in</div>
            <div class="info-text">Login with your Last.fm account to start scrobbling</div>
        `;
        
        loginButton.classList.remove('hidden');
        completeLoginButton.classList.add('hidden');
        logoutButton.classList.add('hidden');
        loginInstructions.style.display = 'none';
        
        scrobblingStatus.innerHTML = `
            <span style="color: #dc3545;">🔴 Inactive</span> - 
            Login first to enable automatic scrobbling
        `;
    }
}

/**
 * Start the login process
 */
async function startLogin() {
    loginButton.disabled = true;
    loginButton.textContent = 'Opening Last.fm...';
    
    try {
        const response = await browser.runtime.sendMessage({
            action: 'startLogin'
        });
        
        if (response.success) {
            pendingToken = response.result.token;
            
            showStatus('Last.fm authorization page opened! Please authorize the extension.', 'success');
            
            // Update UI for auth flow
            loginButton.classList.add('hidden');
            completeLoginButton.classList.remove('hidden');
            loginInstructions.style.display = 'block';
            
        } else {
            showStatus('Failed to start login: ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showStatus('Login error: ' + error.message, 'error');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login with Last.fm';
    }
}

/**
 * Complete the login process
 */
async function completeLogin() {
    if (!pendingToken) {
        showStatus('No pending login. Please start the login process first.', 'error');
        return;
    }
    
    completeLoginButton.disabled = true;
    completeLoginButton.textContent = 'Completing login...';
    
    try {
        const response = await browser.runtime.sendMessage({
            action: 'completeLogin'
        });
        
        if (response.success) {
            const username = response.result.username;
            showStatus(`Successfully logged in as ${username}! 🎉`, 'success');
            
            // Reset UI state
            pendingToken = null;
            
            // Refresh login status from background script
            await checkLoginStatus();
            
        } else {
            showStatus('Failed to complete login: ' + response.error, 'error');
            // Reset to login state
            resetToLoginState();
        }
    } catch (error) {
        console.error('Login completion error:', error);
        showStatus('Login completion error: ' + error.message, 'error');
        resetToLoginState();
    } finally {
        completeLoginButton.disabled = false;
        completeLoginButton.textContent = 'Complete Login';
    }
}

/**
 * Logout the user
 */
async function logout() {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Logging out...';
    
    try {
        const response = await browser.runtime.sendMessage({
            action: 'logout'
        });
        
        if (response.success) {
            showStatus('Logged out successfully', 'success');
            updateUIForLoginStatus(false);
        } else {
            showStatus('Failed to logout: ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showStatus('Logout error: ' + error.message, 'error');
    } finally {
        logoutButton.disabled = false;
        logoutButton.textContent = 'Logout';
    }
}

/**
 * Reset UI to login state (used when auth fails)
 */
function resetToLoginState() {
    loginButton.classList.remove('hidden');
    completeLoginButton.classList.add('hidden');
    logoutButton.classList.add('hidden');
    loginInstructions.style.display = 'none';
    pendingToken = null;
}

/**
 * Show status message to user
 */
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.style.display = 'block';
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Periodically check login status to keep UI in sync
setInterval(checkLoginStatus, 30000); // Check every 30 seconds
