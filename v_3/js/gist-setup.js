/**
 * GitHub Gist Setup Helper
 * This script adds a configuration UI for GitHub Gist storage
 */

(function() {
    // Check if we already have a Gist ID in local storage
    const savedGistId = localStorage.getItem('gistId');
    
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
                
                <button id="save-gist-id-btn">Save Gist ID</button>
                <button id="test-gist-btn">Test Connection</button>
                
                <div class="gist-help-link">
                    How to create a GitHub Gist
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
            const gistId = gistIdInput.value.trim();
            
            if (gistId) {
                localStorage.setItem('gistId', gistId);
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
    }
    
    // Update the status message
    function updateGistStatus(isValid, message) {
        const statusElement = document.querySelector('.gist-id-status');
        
        if (statusElement) {
            statusElement.className = isValid ? 'gist-id-status valid' : 'gist-id-status invalid';
            statusElement.textContent = message;
        }
    }
    
    // Test connection to the Gist
    function testGistConnection(gistId) {
        updateGistStatus(true, 'Testing connection...');
        
        fetch(`https://api.github.com/gists/${gistId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.files && data.files['tildeplayer_data.json']) {
                    updateGistStatus(true, 'Connection successful! Gist is properly configured.');
                } else {
                    updateGistStatus(false, 'Gist found but missing tildeplayer_data.json file');
                }
            })
            .catch(error => {
                console.error('Error testing Gist connection:', error);
                updateGistStatus(false, `Connection failed: ${error.message}`);
            });
    }
    
    // Update the storage service with the new Gist ID
    function updateStorageService(gistId) {
        if (window.storageService) {
            // Update the Gist ID in the storage service
            window.storageService.GIST_ID = gistId;
            
            // Force a sync to test the new Gist ID
            window.storageService.syncFromGistToLocal()
                .then(success => {
                    if (success) {
                        updateGistStatus(true, 'Gist ID saved and sync successful');
                    } else {
                        updateGistStatus(false, 'Gist ID saved but sync failed');
                    }
                })
                .catch(error => {
                    console.error('Error syncing with new Gist ID:', error);
                    updateGistStatus(false, 'Error syncing with new Gist ID');
                });
        } else {
            updateGistStatus(false, 'Storage service not available');
        }
    }
    
    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        injectCSS();
        createSetupUI();
        
        // If we have a saved Gist ID, use it to update the storage service
        if (savedGistId && window.storageService) {
            window.storageService.GIST_ID = savedGistId;
            console.log('Loaded Gist ID from local storage:', savedGistId);
        }
    });
})(); 