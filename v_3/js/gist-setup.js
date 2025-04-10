/**
 * GitHub Gist Setup Helper
 * This script adds a configuration UI for GitHub Gist storage
 */

(function() {
    // Check if we already have a Gist ID in local storage
    const savedGistId = localStorage.getItem('gistId');
    const savedGithubToken = localStorage.getItem('githubToken');
    
    // Function to inject CSS
    function injectCSS() {
        const style = document.createElement('style');
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
            }
            
            .token-status.valid {
                color: #4CAF50;
            }
            
            .token-status.invalid {
                color: #f44336;
            }
            
            .error-details {
                font-size: 11px;
                margin-top: 5px;
                color: #f44336;
                background-color: #ffebee;
                padding: 5px;
                border-radius: 4px;
                display: none;
            }
            
            .error-details.visible {
                display: block;
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
                
                <div class="error-details" id="error-details"></div>
                
                <button id="save-gist-id-btn">Save Gist ID</button>
                <button id="test-gist-btn">Test Connection</button>
                
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
                localStorage.setItem('gistId', gistId);
                
                // Save token if provided
                if (githubToken) {
                    localStorage.setItem('githubToken', githubToken);
                    console.log('GitHub token saved (token value hidden for security)');
                    
                    // Update token status
                    const tokenStatus = document.querySelector('.token-status');
                    if (tokenStatus) {
                        tokenStatus.className = 'token-status valid';
                        tokenStatus.textContent = 'Token saved';
                    }
                } else {
                    // Remove any existing token if field is empty
                    localStorage.removeItem('githubToken');
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
        
        setupContainer.querySelector('.gist-help-link').addEventListener('click', () => {
            window.open('https://docs.github.com/en/github/writing-on-github/editing-and-sharing-content-with-gists/creating-gists', '_blank');
        });
        
        setupContainer.querySelector('.token-help').addEventListener('click', () => {
            window.open('https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token', '_blank');
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
    
    // Test connection to the Gist
    function testGistConnection(gistId) {
        updateGistStatus(true, 'Testing connection...');
        showErrorDetails(''); // Clear any previous error details
        
        // Get the token if available
        const token = localStorage.getItem('githubToken');
        const headers = new Headers({
            'Accept': 'application/vnd.github.v3+json',
        });
        
        // Add token if available
        if (token) {
            headers.append('Authorization', `token ${token}`);
        }
        
        fetch(`https://api.github.com/gists/${gistId}`, { headers })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('Forbidden: GitHub API rate limit or authentication issue');
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
                if (data && data.files && data.files['tildeplayer_data.json']) {
                    updateGistStatus(true, 'Connection successful! Gist is properly configured.');
                    
                    // Check if it's a private Gist and show appropriate messaging
                    if (!data.public && !token) {
                        showErrorDetails('Note: This is a private Gist. You must provide a GitHub token for it to work properly.');
                    }
                } else {
                    updateGistStatus(false, 'Gist found but missing tildeplayer_data.json file');
                    
                    // Show advice on how to fix it
                    showErrorDetails('Your Gist needs a file named tildeplayer_data.json. Please add this file with the basic structure shown in the documentation.');
                }
            })
            .catch(error => {
                console.error('Error testing Gist connection:', error);
                updateGistStatus(false, `Connection failed: ${error.message}`);
                
                // Show more detailed error information
                if (error.message.includes('Forbidden')) {
                    showErrorDetails('A 403 Forbidden error typically means one of three things:\n' +
                        '1. You are trying to access a private Gist without a token\n' +
                        '2. You have exceeded GitHub API rate limits (provide a token to increase limits)\n' +
                        '3. Your token does not have the required permissions (needs Gist read/write)');
                } else if (error.message.includes('Gist not found')) {
                    showErrorDetails('Make sure your Gist ID is correct. If this is a private Gist, you must provide a valid GitHub token with Gist access permissions.');
                } else if (error.message.includes('Unauthorized')) {
                    showErrorDetails('Your GitHub token is invalid or expired. Please generate a new token with Gist scope permissions.');
                }
            });
    }
    
    // Update the storage service with the new Gist ID
    function updateStorageService(gistId) {
        if (window.storageService) {
            // Update the Gist ID in the storage service
            window.storageService.GIST_ID = gistId;
            
            // Update token if available
            const token = localStorage.getItem('githubToken');
            if (token) {
                window.storageService.GITHUB_TOKEN = token;
            } else {
                // Clear any existing token
                window.storageService.GITHUB_TOKEN = null;
            }
            
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
                    
                    // Show detailed error information
                    if (error.message && error.message.includes('403')) {
                        showErrorDetails('Authentication error: If your Gist is private, you need to provide a valid GitHub token with Gist access permissions.');
                    } else if (error.message && error.message.includes('404')) {
                        showErrorDetails('Gist not found: Check that your Gist ID is correct and the Gist exists.');
                    }
                });
        } else {
            updateGistStatus(false, 'Storage service not available');
        }
    }
    
    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        injectCSS();
        createSetupUI();
        
        // Check for storage service with retry mechanism
        checkStorageServiceAvailability();
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
        const maxRetries = 5;
        const retryInterval = 1000; // 1 second interval
        
        const checkInterval = setInterval(() => {
            retryCount++;
            
            if (window.storageService) {
                console.log(`Storage service found after ${retryCount} retries`);
                clearInterval(checkInterval);
                initializeWithStorageService();
                return;
            }
            
            if (retryCount >= maxRetries) {
                console.error(`Storage service not found after ${maxRetries} retries`);
                clearInterval(checkInterval);
                updateGistStatus(false, 'Storage service not available. Please refresh the page and try again.');
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
        // If we have a saved Gist ID, use it to update the storage service
        if (savedGistId) {
            window.storageService.GIST_ID = savedGistId;
            console.log('Loaded Gist ID from local storage:', savedGistId);
            
            // Also set token if available
            if (savedGithubToken) {
                window.storageService.GITHUB_TOKEN = savedGithubToken;
                console.log('Loaded GitHub token from local storage (token value hidden for security)');
            }
            
            updateGistStatus(true, 'Gist ID configured from local storage');
        }
    }
})(); 