/**
 * GitHub Gist Setup Helper
 * This script adds a configuration UI for GitHub Gist storage
 */

(function() {
    // Ensure document is loaded before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGistSetup);
    } else {
        // Document already loaded, initialize immediately
        initializeGistSetup();
    }
    
    // Main initialization function 
    function initializeGistSetup() {
        console.log('Initializing GitHub Gist setup UI...');
        
        // Check if we already have a Gist ID in local storage
        const savedGistId = localStorage.getItem('gist-id') || null;
        const savedGithubToken = localStorage.getItem('github-token') || null;
        
        // Add a reference to the upload handler for force refresh integration
        let uploadHandler = null;
        
        // Only inject if our container doesn't already exist
        if (!document.querySelector('.gist-setup-container')) {
            injectCSS();
            createSetupUI();
            // Check for storage service with retry mechanism after UI is created
            checkStorageServiceAvailability();
        } else {
            console.log('Gist setup UI already exists, skipping initialization');
        }
    }
    
    // Function to inject CSS
    function injectCSS() {
        // Only inject if our style doesn't already exist
        if (document.querySelector('#gist-setup-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'gist-setup-styles';
        style.textContent = `
            .gist-setup-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                width: 300px;
                z-index: 1000;
                font-family: sans-serif;
            }
            
            .gist-setup-container.hidden {
                display: none;
            }
            
            .gist-setup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .gist-setup-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .gist-setup-close {
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
            }
            
            .gist-setup-form {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .gist-setup-form input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .gist-setup-form button {
                padding: 8px 12px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .gist-setup-form button:hover {
                background: #45a049;
            }
            
            .gist-setup-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 999;
            }
            
            .gist-id-status {
                font-size: 12px;
                margin-top: 5px;
            }
            
            .gist-id-status.valid {
                color: #4CAF50;
            }
            
            .gist-id-status.invalid {
                color: #f44336;
            }
            
            .gist-help-link {
                font-size: 12px;
                margin-top: 10px;
                color: #2196F3;
                text-decoration: underline;
                cursor: pointer;
            }
            
            .token-status {
                font-size: 12px;
                margin-top: 5px;
                display: flex;
                align-items: center;
            }
            
            .token-status.valid {
                color: #4CAF50;
            }
            
            .token-status.valid::before {
                content: "✓ ";
                margin-right: 5px;
            }
            
            .token-status.invalid {
                color: #f44336;
            }
            
            .token-status.invalid::before {
                content: "✗ ";
                margin-right: 5px;
            }
            
            .token-status.pending {
                color: #ff9800;
            }
            
            .token-status.pending::before {
                content: "⏳ ";
                margin-right: 5px;
            }
            
            .error-details {
                font-size: 11px;
                margin-top: 5px;
                color: #f44336;
                background-color: #ffebee;
                padding: 5px;
                border-radius: 4px;
                display: none;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .error-details.visible {
                display: block;
            }
            
            .token-validation-btn {
                font-size: 12px;
                color: #2196F3;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
                text-decoration: underline;
                margin-top: 3px;
            }
            
            .access-scope-list {
                font-size: 11px;
                margin-top: 5px;
                padding-left: 15px;
            }
            
            .gist-sync-btn {
                background: #3F51B5;
                margin-top: 10px;
            }
            
            .gist-sync-btn:hover {
                background: #303F9F;
            }
            
            .reset-btn {
                background: #ff9800;
                margin-top: 5px;
                font-size: 12px;
            }
            
            .reset-btn:hover {
                background: #e68900;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Function to create the setup UI
    function createSetupUI() {
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'gist-setup-toggle';
        toggleButton.innerHTML = '<i class="fas fa-cog"></i>';
        toggleButton.title = 'Configure GitHub Gist Storage';
        document.body.appendChild(toggleButton);
        
        // Create setup container
        const setupContainer = document.createElement('div');
        setupContainer.className = 'gist-setup-container hidden';
        
        setupContainer.innerHTML = `
            <div class="gist-setup-header">
                <h3>GitHub Gist Setup</h3>
                <button class="gist-setup-close">&times;</button>
            </div>
            
            <div class="gist-setup-form">
                <label for="gist-id-input">Your GitHub Gist ID:</label>
                <input 
                    type="text" 
                    id="gist-id-input" 
                    placeholder="e.g. f308c693f01b8cf73beabd0dca6655b8"
                    value="${savedGistId || ''}"
                >
                <div class="gist-id-status ${savedGistId ? 'valid' : ''}">
                    ${savedGistId ? 'Gist ID configured' : 'No Gist ID configured'}
                </div>
                
                <label for="github-token-input">GitHub Personal Access Token (required for private Gists):</label>
                <input 
                    type="password" 
                    id="github-token-input" 
                    placeholder="github_pat_xxx..."
                    value="${savedGithubToken || ''}"
                >
                <div class="token-status ${savedGithubToken ? 'valid' : ''}">
                    ${savedGithubToken ? 'Token configured' : 'Required for private Gists or to avoid rate limits'}
                </div>
                
                <button type="button" class="token-validation-btn" id="validate-token-btn">Validate token permissions</button>
                
                <div class="error-details" id="error-details"></div>
                
                <button id="save-gist-id-btn">Save Gist ID</button>
                <button id="test-gist-btn">Test Connection</button>
                <button id="sync-with-player-btn" class="gist-sync-btn">Sync with Player</button>
                <button id="reset-sync-flags-btn" class="reset-btn">Reset Sync Operations</button>
                
                <div class="gist-help-link">
                    How to create a GitHub Gist
                </div>
                <div class="gist-help-link token-help">
                    How to create a GitHub Personal Access Token
                </div>
            </div>
        `;
        
        document.body.appendChild(setupContainer);
        
        // Add event listeners
        toggleButton.addEventListener('click', () => {
            setupContainer.classList.toggle('hidden');
        });
        
        setupContainer.querySelector('.gist-setup-close').addEventListener('click', () => {
            setupContainer.classList.add('hidden');
        });
        
        setupContainer.querySelector('#save-gist-id-btn').addEventListener('click', () => {
            const gistIdInput = document.getElementById('gist-id-input');
            const githubTokenInput = document.getElementById('github-token-input');
            const gistId = gistIdInput.value.trim();
            const githubToken = githubTokenInput.value.trim();
            
            if (gistId) {
                localStorage.setItem('gist-id', gistId);
                
                // Save token if provided
                if (githubToken) {
                    localStorage.setItem('github-token', githubToken);
                    console.log('GitHub token saved (token value hidden for security)');
                    
                    // Update token status
                    const tokenStatus = document.querySelector('.token-status');
                    if (tokenStatus) {
                        tokenStatus.className = 'token-status valid';
                        tokenStatus.textContent = 'Token saved';
                    }
                } else {
                    // Remove any existing token if field is empty
                    localStorage.removeItem('github-token');
                    console.log('GitHub token removed');
                    
                    // Update token status
                    const tokenStatus = document.querySelector('.token-status');
                    if (tokenStatus) {
                        tokenStatus.className = 'token-status';
                        tokenStatus.textContent = 'Required for private Gists or to avoid rate limits';
                    }
                }
                
                updateGistStatus(true, 'Gist ID saved');
                updateStorageService(gistId);
            } else {
                updateGistStatus(false, 'Please enter a valid Gist ID');
            }
        });
        
        setupContainer.querySelector('#test-gist-btn').addEventListener('click', () => {
            const gistId = document.getElementById('gist-id-input').value.trim();
            
            if (!gistId) {
                updateGistStatus(false, 'Please enter a Gist ID first');
                return;
            }
            
            testGistConnection(gistId);
        });
        
        // Sync with player button (connects Gist sync with force refresh)
        setupContainer.querySelector('#sync-with-player-btn').addEventListener('click', () => {
            const gistId = document.getElementById('gist-id-input').value.trim();
            
            if (!gistId) {
                updateGistStatus(false, 'Please enter a Gist ID first');
                return;
            }
            
            // Get the sync button
            const syncButton = document.getElementById('sync-with-player-btn');
            
            // Check if the button is already in a throttled state
            if (syncButton.disabled || syncButton.classList.contains('throttled')) {
                console.log('Sync operation throttled - wait for the current sync to complete');
                return;
            }
            
            // Update button state to indicate sync is in progress
            const originalButtonText = syncButton.textContent;
            syncButton.textContent = 'Syncing...';
            syncButton.disabled = true;
            syncButton.classList.add('throttled');
            
            // Set a minimum timeout for the button regardless of sync result
            const enableButtonAfterDelay = () => {
                setTimeout(() => {
                    syncButton.disabled = false;
                    syncButton.textContent = originalButtonText;
                    syncButton.classList.remove('throttled');
                }, 5000); // Minimum 5 second wait between sync operations
            };
            
            // First sync from Gist to local storage
            if (window.storageService) {
                updateGistStatus(true, 'Syncing from Gist...');
                
                window.storageService.syncFromGistToLocal()
                    .then(success => {
                        if (success) {
                            updateGistStatus(true, 'Gist sync successful!');
                            
                            // Now trigger the player's force refresh
                            if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
                                // Update button text to indicate refresh phase
                                syncButton.textContent = 'Refreshing Player...';
                                
                                try {
                                    window.uploadHandler.forceRefresh();
                                    console.log('Triggered force refresh after Gist sync');
                                    
                                    // Show comprehensive success message
                                    showErrorDetailsHTML(`
                                        <span style="color: #4CAF50;">✅ Sync Successful!</span>
                                        <p>GitHub Gist data was successfully synced to your local player.</p>
                                        <p>Last sync: ${new Date().toLocaleString()}</p>
                                        ${window.storageService._tracks ? 
                                            `<p>Tracks loaded: ${window.storageService._tracks.length}</p>` : ''}
                                    `);
                                } catch (refreshError) {
                                    console.error('Error during player refresh:', refreshError);
                                    showErrorDetails(`Sync was successful but player refresh failed: ${refreshError.message}`);
                                }
                            } else {
                                console.warn('Upload handler or forceRefresh method not available');
                                showErrorDetails('Player refresh not available. The sync with Gist was successful, but you may need to refresh the page manually.');
                            }
                        } else {
                            updateGistStatus(false, 'Gist sync failed. Check connection and settings.');
                            
                            // Show troubleshooting tips
                            showErrorDetailsHTML(`
                                <strong>Sync Failed</strong>
                                <p>The sync operation could not be completed. This may be due to:</p>
                                <ul>
                                    <li>Invalid Gist ID</li>
                                    <li>Missing GitHub token for private Gists</li>
                                    <li>Network connectivity issues</li>
                                    <li>GitHub API rate limiting</li>
                                </ul>
                                <p>Try the "Test Connection" button to diagnose the issue.</p>
                            `);
                        }
                    })
                    .catch(error => {
                        console.error('Error during Gist sync:', error);
                        updateGistStatus(false, `Sync error: ${error.message || 'Unknown error'}`);
                        
                        // Show error details with troubleshooting steps
                        if (error.message.includes('403')) {
                            showErrorDetailsHTML(`
                                <strong>Access Denied (403)</strong>
                                <p>GitHub denied access to this Gist. Possible reasons:</p>
                                <ul>
                                    <li>This is a private Gist and you need a token</li>
                                    <li>Your token doesn't have the right permissions</li>
                                    <li>You've hit GitHub's rate limits</li>
                                </ul>
                                <p>Try validating your token or create a new token with gist scope.</p>
                            `);
                        } else if (error.message.includes('404')) {
                            showErrorDetailsHTML(`
                                <strong>Gist Not Found (404)</strong>
                                <p>The Gist ID "${gistId}" could not be found.</p>
                                <p>Make sure the Gist ID is correct and the Gist exists.</p>
                                <p>You can check by visiting: <a href="https://gist.github.com/${gistId}" target="_blank">https://gist.github.com/${gistId}</a></p>
                            `);
                        } else {
                            showErrorDetails(error.message || 'Unknown error occurred during sync');
                        }
                    })
                    .finally(() => {
                        // Enable the button after the minimum delay
                        enableButtonAfterDelay();
                    });
            } else {
                updateGistStatus(false, 'Storage service not available');
                enableButtonAfterDelay();
            }
        });
        
        // Validate token button
        setupContainer.querySelector('#validate-token-btn').addEventListener('click', () => {
            const token = document.getElementById('github-token-input').value.trim();
            
            if (!token) {
                showErrorDetails('Please enter a GitHub token to validate');
                return;
            }
            
            validateGitHubToken(token);
        });
        
        setupContainer.querySelector('.gist-help-link').addEventListener('click', () => {
            window.open('https://docs.github.com/en/github/writing-on-github/editing-and-sharing-content-with-gists/creating-gists', '_blank');
        });
        
        setupContainer.querySelector('.token-help').addEventListener('click', () => {
            window.open('https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token', '_blank');
        });
        
        // Add event listener for the reset button
        setupContainer.querySelector('#reset-sync-flags-btn').addEventListener('click', () => {
            if (window.storageService && typeof window.storageService.resetFlags === 'function') {
                window.storageService.resetFlags();
                updateGistStatus(true, 'Sync operations reset');
            } else {
                // Fallback if the resetFlags method doesn't exist
                if (window.storageService) {
                    window.storageService._syncInProgress = false;
                    window.storageService._refreshInProgress = false;
                }
                
                if (window.uploadHandler) {
                    window.uploadHandler._refreshInProgress = false;
                }
                
                updateGistStatus(true, 'Sync flags manually reset');
                
                // Show notification
                if (window.notificationService) {
                    window.notificationService.show(
                        'Operations Reset',
                        'Sync operations have been manually reset.',
                        'info',
                        3000
                    );
                }
            }
        });
    }
    
    // Update the status message
    function updateGistStatus(isValid, message) {
        const statusElement = document.querySelector('.gist-id-status');
        
        if (statusElement) {
            statusElement.className = isValid ? 'gist-id-status valid' : 'gist-id-status invalid';
            statusElement.textContent = message;
        }
        
        // Clear error details if successful
        if (isValid) {
            showErrorDetails('');
        }
    }
    
    // Show detailed error information
    function showErrorDetails(errorMessage) {
        const errorElement = document.getElementById('error-details');
        if (errorElement) {
            if (errorMessage) {
                errorElement.textContent = errorMessage;
                errorElement.classList.add('visible');
            } else {
                errorElement.textContent = '';
                errorElement.classList.remove('visible');
            }
        }
    }
    
    // Show error details with copy button for long error messages
    function showErrorDetailsHTML(htmlContent) {
        const errorElement = document.getElementById('error-details');
        if (errorElement) {
            if (htmlContent) {
                // Add a copy button for long error messages
                const hasCopyButton = htmlContent.length > 100;
                const copyButtonHTML = hasCopyButton ? 
                    `<div style="text-align: right; margin-top: 5px;">
                        <button id="copy-error-btn" style="font-size: 11px; padding: 2px 5px;">Copy Error</button>
                    </div>` : '';
                    
                errorElement.innerHTML = htmlContent + copyButtonHTML;
                errorElement.classList.add('visible');
                
                // Add click handler for copy button if present
                if (hasCopyButton) {
                    const copyBtn = errorElement.querySelector('#copy-error-btn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', () => {
                            // Create a plain text version of the error for copying
                            const tempElement = document.createElement('div');
                            tempElement.innerHTML = htmlContent;
                            const textToCopy = tempElement.textContent || tempElement.innerText;
                            
                            navigator.clipboard.writeText(textToCopy)
                                .then(() => {
                                    copyBtn.textContent = 'Copied!';
                                    setTimeout(() => {
                                        copyBtn.textContent = 'Copy Error';
                                    }, 2000);
                                })
                                .catch(err => {
                                    console.error('Could not copy text: ', err);
                                });
                        });
                    }
                }
            } else {
                errorElement.innerHTML = '';
                errorElement.classList.remove('visible');
            }
        }
    }
    
    // Validate GitHub token and check its permissions
    function validateGitHubToken(token) {
        // Update token status to pending
        const tokenStatus = document.querySelector('.token-status');
        if (tokenStatus) {
            tokenStatus.className = 'token-status pending';
            tokenStatus.textContent = 'Validating token...';
        }
        
        showErrorDetails('Validating token...');
        
        // Use the storage service validation if available
        if (window.storageService && typeof window.storageService.validateToken === 'function') {
            window.storageService.validateToken(token)
                .then(isValid => {
                    updateTokenStatusUI(isValid, token);
                })
                .catch(error => {
                    console.error('Error during token validation:', error);
                    showErrorDetails(`Token validation failed: ${error.message}`);
                    updateTokenStatusUI(false);
                });
            return;
        }
        
        // Fallback to local validation if storage service is not available
        const headers = new Headers({
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`,
            'User-Agent': 'TildePlayer'
        });
        
        // First check if the token is valid at all
        fetch('https://api.github.com/user', { 
            headers,
            cache: 'no-store' // Always bypass cache
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Invalid token - authentication failed. Please generate a new token.');
                    } else if (response.status === 403) {
                        // Check if rate limited
                        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                        if (rateLimitRemaining === '0') {
                            const resetTime = response.headers.get('X-RateLimit-Reset');
                            const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date();
                            throw new Error(`Rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
                        } else {
                            throw new Error('Token has insufficient permissions. Check GitHub scopes.');
                        }
                    } else {
                        throw new Error(`Token validation failed: HTTP status ${response.status}`);
                    }
                }
                return response.json();
            })
            .then(userData => {
                console.log('Token is valid for user:', userData.login);
                
                // Now check token scopes
                return fetch('https://api.github.com/gists', { 
                    headers,
                    cache: 'no-store' // Always bypass cache
                });
            })
            .then(response => {
                // Check the scopes in the response headers
                const scopes = response.headers.get('X-OAuth-Scopes');
                
                if (!response.ok) {
                    throw new Error(`Gist access check failed: HTTP status ${response.status}`);
                }
                
                let hasGistScope = false;
                if (scopes) {
                    hasGistScope = scopes.includes('gist') || scopes.includes('repo');
                }
                
                if (hasGistScope) {
                    showErrorDetailsHTML(`
                        <span style="color: #4CAF50;">✓ Token is valid and has the required Gist permissions!</span>
                        <div>Scopes: ${scopes || 'None'}</div>
                        <div>GitHub User: ${userData?.login || 'Unknown'}</div>
                    `);
                    
                    updateTokenStatusUI(true, token);
                } else {
                    showErrorDetailsHTML(`
                        <span style="color: #f44336;">⚠️ Token is valid but does not have Gist scope permissions.</span>
                        <div>Current scopes: ${scopes || 'None'}</div>
                        <div>To fix this, create a new token with these permissions:</div>
                        <ul class="access-scope-list">
                            <li>gist (read and write)</li>
                        </ul>
                    `);
                    
                    updateTokenStatusUI(false);
                }
                
                return response.json();
            })
            .catch(error => {
                console.error('Token validation error:', error);
                showErrorDetails(`Token validation failed: ${error.message}`);
                
                updateTokenStatusUI(false);
            });
    }
    
    // Helper function to update token status UI
    function updateTokenStatusUI(isValid, token = null) {
        // Update the token status
        const tokenStatus = document.querySelector('.token-status');
        if (tokenStatus) {
            tokenStatus.className = 'token-status ' + (isValid ? 'valid' : 'invalid');
            tokenStatus.textContent = isValid ? 'Token valid with Gist scope' : 'Invalid token';
        }
        
        // Save the validated token if valid
        if (isValid && token) {
            localStorage.setItem('github-token', token);
            
            // Update the storage service if available
            if (window.storageService) {
                window.storageService.GITHUB_TOKEN = token;
                console.log('Updated GitHub token in storage service');
                
                // If storage service has a method to update token status, call it
                if (typeof window.storageService.updateToken === 'function') {
                    window.storageService.updateToken(token);
                }
            }
        }
    }
    
    // Test connection to the Gist
    function testGistConnection(gistId) {
        updateGistStatus(true, 'Testing connection...');
        showErrorDetails(''); // Clear any previous error details
        
        // Get the token if available
        const token = localStorage.getItem('github-token');
        const headers = new Headers({
            'Accept': 'application/vnd.github.v3+json',
        });
        
        // Add token if available
        if (token) {
            headers.append('Authorization', `token ${token}`);
        }
        
        fetch(`https://api.github.com/gists/${gistId}`, { headers })
            .then(response => {
                // Capture rate limit information for all responses
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining') || 'unknown';
                const rateLimitTotal = response.headers.get('X-RateLimit-Limit') || 'unknown';
                const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'unknown';
                
                console.log(`GitHub API Rate Limit: ${rateLimitRemaining}/${rateLimitTotal} remaining, resets at ${resetTime}`);
                
                if (!response.ok) {
                    if (response.status === 403) {
                        // Is it a rate limit issue?
                        if (rateLimitRemaining === '0') {
                            throw new Error(`Rate limit exceeded. Resets at ${resetTime}`);
                        } else {
                            throw new Error('Forbidden: GitHub API access denied (403)');
                        }
                    } else if (response.status === 404) {
                        throw new Error('Gist not found: Check your Gist ID or make sure the Gist is public');
                    } else if (response.status === 401) {
                        throw new Error('Unauthorized: Invalid or expired token');
                    } else {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }
                return response.json();
            })
            .then(data => {
                if (data && data.files) {
                    // Check for tildeplayer_data.json first
                    if (data.files['tildeplayer_data.json']) {
                        updateGistStatus(true, 'Connection successful! Gist is properly configured.');
                        
                        // Check if it's a private Gist and show appropriate messaging
                        if (!data.public && !token) {
                            showErrorDetailsHTML(`
                                <strong>Private Gist Detected</strong>
                                <p>This is a private Gist. You must provide a GitHub token for it to work properly.</p>
                                <p>✅ Your Gist is correctly configured with tildeplayer_data.json</p>
                                <p>Rate limit info: ${rateLimitRemaining}/${rateLimitTotal} remaining</p>
                            `);
                        } else {
                            // Show success with details
                            showErrorDetailsHTML(`
                                <span style="color: #4CAF50;">✅ Connection successful!</span>
                                <p>Your Gist is correctly configured with tildeplayer_data.json</p>
                                <p>Owner: ${data.owner ? data.owner.login : 'Unknown'}</p>
                                <p>Created: ${new Date(data.created_at).toLocaleString()}</p>
                                <p>Last updated: ${new Date(data.updated_at).toLocaleString()}</p>
                            `);
                        }
                    } 
                    // Fall back to tracks.json for compatibility with older configurations
                    else if (data.files['tracks.json']) {
                        updateGistStatus(true, 'Connection successful! Using legacy tracks.json format.');
                        
                        showErrorDetailsHTML(`
                            <span style="color: #4CAF50;">✅ Connection successful!</span>
                            <p>Found legacy tracks.json format. This will work but consider migrating to the new format.</p>
                            <p>The system will automatically update to the new format on your next sync.</p>
                        `);
                    } else {
                        updateGistStatus(false, 'Gist found but missing required files');
                        
                        // Show advice on how to fix it
                        showErrorDetailsHTML(`
                            <strong>Missing Required Files</strong>
                            <p>Your Gist needs a file named tildeplayer_data.json.</p>
                            <p>Available files in this Gist: ${Object.keys(data.files).join(', ')}</p>
                            <p>The system will attempt to create this file for you on the next sync operation.</p>
                        `);
                    }
                } else {
                    updateGistStatus(false, 'Invalid Gist structure');
                    showErrorDetails('The Gist exists but has an unexpected structure. Make sure it contains files.');
                }
            })
            .catch(error => {
                console.error('Error testing Gist connection:', error);
                updateGistStatus(false, `Connection failed: ${error.message}`);
                
                // Show more detailed error information based on the error type
                if (error.message.includes('Forbidden')) {
                    showErrorDetailsHTML(`
                        <strong>403 Forbidden Error</strong>
                        <p>This error typically means one of three things:</p>
                        <ol>
                            <li>You are trying to access a private Gist without a token</li>
                            <li>You have exceeded GitHub API rate limits</li>
                            <li>Your token does not have the required permissions</li>
                        </ol>
                        <p><strong>Solution:</strong></p>
                        <ul>
                            <li>Make sure you've added a GitHub token with 'gist' scope</li>
                            <li>Click "Validate token permissions" to verify your token</li>
                            <li>If using a private Gist, ensure your token belongs to the Gist owner</li>
                        </ul>
                        <p><strong>Debug information:</strong></p>
                        <p>Gist ID: ${gistId}</p>
                        <p>Using token: ${token ? 'Yes' : 'No'}</p>
                    `);
                } else if (error.message.includes('Gist not found')) {
                    showErrorDetailsHTML(`
                        <strong>404 Not Found Error</strong>
                        <p>The Gist ID is incorrect or the Gist doesn't exist.</p>
                        <p><strong>Solution:</strong></p>
                        <ul>
                            <li>Verify your Gist ID is correct</li>
                            <li>If this is a private Gist, ensure you're using a valid token</li>
                            <li>Check if the Gist exists by visiting:<br>https://gist.github.com/${gistId}</li>
                        </ul>
                        <p><strong>Debug information:</strong></p>
                        <p>Gist ID being tested: ${gistId}</p>
                        <p>Using token: ${token ? 'Yes' : 'No'}</p>
                    `);
                } else if (error.message.includes('Unauthorized')) {
                    showErrorDetailsHTML(`
                        <strong>401 Unauthorized Error</strong>
                        <p>Your GitHub token is invalid or expired.</p>
                        <p><strong>Solution:</strong></p>
                        <ul>
                            <li>Generate a new token with Gist scope permissions</li>
                            <li>Make sure you're copying the entire token value</li>
                            <li>Click "How to create a GitHub Personal Access Token" for help</li>
                        </ul>
                        <p><strong>Debug information:</strong></p>
                        <p>Token length: ${token ? token.length : 0} characters</p>
                        <p>Token format correct: ${token && token.startsWith('ghp_') || token && token.startsWith('github_pat_') ? 'Yes' : 'No'}</p>
                    `);
                } else if (error.message.includes('Rate limit exceeded')) {
                    showErrorDetailsHTML(`
                        <strong>Rate Limit Exceeded</strong>
                        <p>${error.message}</p>
                        <p><strong>Solution:</strong></p>
                        <ul>
                            <li>Add a GitHub token to increase your rate limit</li>
                            <li>Wait until the rate limit resets</li>
                            <li>If you already have a token, it may have reached its own rate limit</li>
                        </ul>
                    `);
                }
            });
    }
    
    // Update the storage service with the new Gist ID
    function updateStorageService(gistId) {
        if (window.storageService) {
            // Update the Gist ID in the storage service
            window.storageService.GIST_ID = gistId;
            
            // Update token if available
            const token = localStorage.getItem('github-token');
            if (token) {
                window.storageService.GITHUB_TOKEN = token;
            } else {
                // Clear any existing token
                window.storageService.GITHUB_TOKEN = null;
            }
            
            // Make the storage service available globally
            window.storageService.forceRefreshAfterSync = function() {
                // Add a guard to prevent infinite loops
                if (window.storageService._refreshInProgress) {
                    console.log('Refresh already in progress, skipping to prevent infinite loop');
                    return false;
                }
                
                window.storageService._refreshInProgress = true;
                
                if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
                    console.log('Force refreshing player after Gist sync');
                    try {
                        window.uploadHandler.forceRefresh();
                        // Reset the guard after a delay to allow for any pending operations to complete
                        setTimeout(() => {
                            window.storageService._refreshInProgress = false;
                        }, 2000);
                        return true;
                    } catch (error) {
                        console.error('Error during force refresh:', error);
                        window.storageService._refreshInProgress = false;
                        return false;
                    }
                } else {
                    console.warn('Upload handler or forceRefresh method not available');
                    
                    // Try to reload the tracks data from localStorage directly
                    if (localStorage.getItem('tracks')) {
                        console.log('Attempting to reload tracks from localStorage directly');
                        try {
                            const tracksData = JSON.parse(localStorage.getItem('tracks'));
                            if (Array.isArray(tracksData) && tracksData.length > 0) {
                                console.log(`Found ${tracksData.length} tracks in localStorage, dispatching tracks-loaded event`);
                                document.dispatchEvent(new CustomEvent('tracks-loaded', { 
                                    detail: { tracks: tracksData } 
                                }));
                                
                                // Update global variables if they exist
                                if (typeof window.tracksData !== 'undefined') {
                                    window.tracksData = [...tracksData];
                                    if (typeof window.filteredTracks !== 'undefined') {
                                        window.filteredTracks = [...tracksData];
                                        if (typeof window.renderTrackList === 'function') {
                                            window.renderTrackList();
                                        }
                                    }
                                }
                                // Reset the guard after a delay
                                setTimeout(() => {
                                    window.storageService._refreshInProgress = false;
                                }, 2000);
                                return true;
                            }
                        } catch (e) {
                            console.error('Error parsing tracks from localStorage:', e);
                        }
                    }
                    
                    // Show notification suggesting page reload
                    if (window.notificationService) {
                        window.notificationService.show(
                            'Track Refresh Issue',
                            'Data synced, but track list could not be refreshed automatically. Consider reloading the page.',
                            'warning',
                            5000
                        );
                    }
                    window.storageService._refreshInProgress = false;
                    return false;
                }
            };
            
            // Force a sync to test the new Gist ID
            window.storageService.syncFromGistToLocal()
                .then(success => {
                    if (success) {
                        updateGistStatus(true, 'Gist ID saved and sync successful');
                    } else {
                        updateGistStatus(false, 'Gist ID saved but sync failed. Check your connection and Gist settings.');
                    }
                })
                .catch(error => {
                    console.error('Error syncing with new Gist ID:', error);
                    updateGistStatus(false, `Error syncing: ${error.message || 'Unknown error'}`);
                    
                    // Check if it's a 403 error and show more detailed information
                    if (error.message && error.message.includes('403')) {
                        showErrorDetailsHTML(`
                            <strong>403 Forbidden Error during sync</strong>
                            <p>The GitHub API denied access to this Gist. This might be because:</p>
                            <ol>
                                <li>This is a private Gist and you need a token with permissions</li>
                                <li>Your token doesn't have write access to this Gist</li> 
                                <li>You've hit GitHub API rate limits</li>
                            </ol>
                            <p><strong>Try these solutions:</strong></p>
                            <ol>
                                <li>Click "Validate token permissions" to check your token</li>
                                <li>Make sure your token has "gist" scope</li>
                                <li>If using someone else's Gist, create your own copy instead</li>
                            </ol>
                        `);
                    } else if (error.message && error.message.includes('404')) {
                        showErrorDetailsHTML(`
                            <strong>404 Not Found Error</strong>
                            <p>The system couldn't find the Gist with ID: <code>${gistId}</code></p>
                            <p>Double-check your Gist ID and make sure it exists.</p>
                        `);
                    }
                });
        } else {
            updateGistStatus(false, 'Storage service not available');
        }
    }
    
    // Listen for the storage-service-ready event
    window.addEventListener('storage-service-ready', function(event) {
        console.log('Received storage-service-ready event');
        
        // If we have a storage service and it's not fully initialized yet, initialize it
        if (window.storageService && !window.storageService._initialized) {
            console.log('Storage service detected from event, initializing...');
            initializeWithStorageService();
        }
        
        // Show status in UI if Gist setup panel is visible
        const setupContainer = document.querySelector('.gist-setup-container');
        if (setupContainer && !setupContainer.classList.contains('hidden')) {
            const statusElement = document.querySelector('.gist-id-status');
            if (statusElement) {
                const hasGistId = event.detail.hasGistId;
                statusElement.className = hasGistId ? 'gist-id-status valid' : 'gist-id-status';
                statusElement.textContent = hasGistId 
                    ? 'Gist ID configured and storage service connected' 
                    : 'Storage service connected, please configure a Gist ID';
            }
        }
    });
    
    // Add event listener for when upload handler is ready
    window.addEventListener('upload-handler-ready', function(event) {
        // Get the upload handler from the event
        const uploadHandler = event.detail.handler;
        
        // Connect storage service refresh callback to upload handler if both exist
        if (window.storageService && uploadHandler) {
            console.log('Connecting storage service to upload handler');
            
            // Set refresh callback on storage service if the method exists
            if (typeof window.storageService.setRefreshCallback === 'function') {
                window.storageService.setRefreshCallback(function() {
                    // Call force refresh on upload handler
                    return uploadHandler.forceRefresh();
                });
            } else {
                // Fallback to direct property assignment
                window.storageService.forceRefreshAfterSync = function() {
                    return uploadHandler.forceRefresh();
                };
            }
            
            // Make sure the Force Refresh button is added to the UI
            if (typeof uploadHandler.addForceRefreshButton === 'function') {
                uploadHandler.addForceRefreshButton();
            }
        } else {
            console.warn('Either storage service or upload handler is not available for connection');
        }
    });
    
    // Function to check for storage service availability
    function checkStorageServiceAvailability() {
        // If we already have the storageService, use it immediately
        if (window.storageService) {
            console.log('Storage service found on first check');
            initializeWithStorageService();
            return;
        }
        
        // Otherwise, set up a retry mechanism
        let retryCount = 0;
        const maxRetries = 10; // Increased from 5 to give more time
        const retryInterval = 800; // Reduced to make checks quicker
        
        console.log('Storage service not immediately available, will retry...');
        
        // Create fallback storage service if it doesn't exist after some retries
        const createFallbackStorageService = () => {
            console.log('Creating fallback storage service');
            // Simple fallback storage service with essential methods
            window.storageService = {
                GIST_ID: localStorage.getItem('gist-id') || null,
                GITHUB_TOKEN: localStorage.getItem('github-token') || null,
                hasValidGistSettings: localStorage.getItem('gist-id') && localStorage.getItem('github-token'),
                
                setGistId: function(gistId) {
                    this.GIST_ID = gistId;
                    localStorage.setItem('gist-id', gistId);
                    console.log('Gist ID set in fallback storage service:', gistId);
                },
                
                setGitHubToken: function(token) {
                    this.GITHUB_TOKEN = token;
                    localStorage.setItem('github-token', token);
                    console.log('GitHub token set in fallback storage service');
                },
                
                syncFromGistToLocal: async function() {
                    console.warn('Using fallback syncFromGistToLocal - limited functionality');
                    return false;
                },
                
                testConnection: async function() {
                    console.warn('Using fallback testConnection - limited functionality');
                    return false;
                },
                
                forceRefreshAfterSync: function() {
                    console.warn('Using fallback forceRefreshAfterSync - limited functionality');
                    if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
                        window.uploadHandler.forceRefresh();
                        return true;
                    }
                    return false;
                }
            };
            
            // Show notification about limited functionality
            const statusElement = document.querySelector('.gist-id-status');
            if (statusElement) {
                statusElement.textContent = 'Limited storage functionality available';
                statusElement.style.color = '#ff9800'; // Warning color
            }
            
            // Initialize with our fallback
            initializeWithStorageService();
        };
        
        const checkInterval = setInterval(() => {
            retryCount++;
            
            if (window.storageService) {
                console.log(`Storage service found after ${retryCount} retries`);
                clearInterval(checkInterval);
                initializeWithStorageService();
                return;
            }
            
            // After half the retries, try to load the storage service script dynamically
            if (retryCount === Math.floor(maxRetries / 2)) {
                console.log('Attempting to load storage-service.js dynamically');
                const script = document.createElement('script');
                script.src = 'js/storage-service.js';
                script.onload = () => console.log('storage-service.js loaded dynamically');
                script.onerror = () => console.error('Failed to load storage-service.js dynamically');
                document.head.appendChild(script);
            }
            
            if (retryCount >= maxRetries) {
                console.error(`Storage service not found after ${maxRetries} retries`);
                clearInterval(checkInterval);
                
                // Create a fallback storage service with basic functionality
                createFallbackStorageService();
                
                const errorMsg = 'Storage service not fully available. Limited functionality.';
                console.warn(errorMsg);
                
                // Update UI to show the status
                const statusElement = document.querySelector('.gist-id-status');
                if (statusElement && !document.querySelector('.gist-setup-container.hidden')) {
                    statusElement.className = 'gist-id-status invalid';
                    statusElement.textContent = errorMsg;
                }
                
                // Show detailed error information
                showErrorDetailsHTML(`
                    <strong>Storage Service Limited</strong>
                    <p>The GitHub Gist storage service is not fully available. This might be due to:</p>
                    <ul>
                        <li>Script loading issues</li>
                        <li>Initialization errors</li>
                        <li>Incorrect file order</li>
                    </ul>
                    <p>You can still use basic functionality, but GitHub Gist synchronization may be limited.</p>
                    <p>Try refreshing the page or check the browser console for errors.</p>
                `);
            } else {
                console.log(`Waiting for storage service... Retry ${retryCount}/${maxRetries}`);
                // Show this status only if user has opened the panel
                if (!document.querySelector('.gist-setup-container.hidden')) {
                    updateGistStatus(false, `Waiting for storage service... (${retryCount}/${maxRetries})`);
                }
            }
        }, retryInterval);
    }
    
    // Initialize with storage service when available
    function initializeWithStorageService() {
        try {
            // Check if storage service has necessary methods
            const hasValidMethods = window.storageService && 
                typeof window.storageService.setGistId === 'function' &&
                typeof window.storageService.setGitHubToken === 'function';
                
            if (!hasValidMethods) {
                console.warn('Storage service found but missing required methods');
                showErrorDetails('Storage service is limited. Some functionalities may not work properly.');
            }
            
            // If we have a saved Gist ID, use it to update the storage service
            if (savedGistId) {
                if (typeof window.storageService.setGistId === 'function') {
                    window.storageService.setGistId(savedGistId);
                } else {
                    window.storageService.GIST_ID = savedGistId;
                }
                console.log('Loaded Gist ID from local storage:', savedGistId);
                
                // Also set token if available
                if (savedGithubToken) {
                    if (typeof window.storageService.setGitHubToken === 'function') {
                        window.storageService.setGitHubToken(savedGithubToken);
                    } else {
                        window.storageService.GITHUB_TOKEN = savedGithubToken;
                    }
                    console.log('Loaded GitHub token from local storage (token value hidden for security)');
                }
                
                // Set up refresh connection if possible
                if (typeof window.storageService.setRefreshCallback === 'function') {
                    window.storageService.setRefreshCallback(function() {
                        if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
                            console.log('Force refreshing player after Gist sync');
                            window.uploadHandler.forceRefresh();
                            return true;
                        } else {
                            console.warn('Upload handler or forceRefresh method not available');
                            return false;
                        }
                    });
                } else {
                    // Fallback to basic method assignment
                    window.storageService.forceRefreshAfterSync = function() {
                        if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
                            console.log('Force refreshing player after Gist sync');
                            window.uploadHandler.forceRefresh();
                            return true;
                        } else {
                            console.warn('Upload handler or forceRefresh method not available');
                            return false;
                        }
                    };
                }
                
                updateGistStatus(true, 'Gist ID configured from local storage');
                
                // If we now have a fully operational storage service, test the connection
                if (typeof window.storageService.testConnection === 'function') {
                    // Test but don't wait for it, to avoid blocking the UI
                    window.storageService.testConnection().then(isConnected => {
                        if (isConnected) {
                            updateGistStatus(true, 'Connection to GitHub successful');
                        }
                    }).catch(error => {
                        console.warn('Connection test failed:', error);
                    });
                }
            } else {
                console.log('No saved Gist ID found');
                updateGistStatus(false, 'No Gist ID configured. Please enter a Gist ID to get started.');
            }
        } catch (error) {
            console.error('Error initializing with storage service:', error);
            showErrorDetails('Error initializing storage service: ' + error.message);
        }
    }
})(); 