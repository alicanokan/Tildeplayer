// Function to show notification messages to the user
function showNotification(message, type = 'info') {
    console.log(`Notification: ${message} (${type})`);
    // You can implement a more sophisticated notification system here
    // For now, we'll just alert the message
    alert(message);
}

// Client-side upload handler for Tildeplayer
class UploadHandler {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.tracksData = null;
        this.currentUploadFile = null;
        this.storageServiceAvailable = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        
        // Inject CSS for refresh buttons - always do this for all pages
        this.injectRefreshButtonsCSS();
        
        // Wait for storage service to be available
        this.waitForStorageService();
        
        // Only enable upload functionality if we're on the upload.html page
        const isUploadPage = window.location.pathname.includes('upload.html');
        
        // Add UI elements - refresh buttons are added to all pages
        this.addRefreshButton();
        
        // Load tracks data - needed on all pages
        this.loadTracksData();
        
        // Make refresh function globally accessible on all pages
        window.refreshTracks = this.refreshTracksData.bind(this);
        
        // Add a global refreshTracksData function that will be accessible from anywhere
        window.refreshTracksData = () => {
            console.log('Global refresh tracks data called');
            this.refreshTracksData();
        };
        
        // Add a global forceRefresh function that will be accessible from anywhere
        window.forceRefresh = () => {
            console.log('Global force refresh called');
            this.forceRefresh();
        };
        
        // Initialize UI only if we're on the upload page
        if (isUploadPage) {
            console.log('On upload page - initializing upload UI');
            this.initUI();
        } else {
            console.log('Not on upload page - skipping upload UI initialization');
        }
        
        // Announce that the upload handler is ready
        this._announceReady();
    }

    // Initialize UI components
    initUI() {
        console.log('Initializing upload handler UI');
        
        // Add event listeners for drag and drop if applicable
        const dropArea = document.getElementById('drop-area');
        if (dropArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropArea.addEventListener(eventName, () => {
                    dropArea.classList.add('highlight');
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, () => {
                    dropArea.classList.remove('highlight');
                });
            });
            
            dropArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                this.handleFileUpload(files);
            });
            
            console.log('Drop area event listeners initialized');
        }
        
        // Add event listener for file input if applicable
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
            
            console.log('File input event listener initialized');
        }
    }

    // Inject CSS for refresh buttons
    injectRefreshButtonsCSS() {
        // Create a style element
        const style = document.createElement('style');
        style.textContent = `
            .refresh-buttons-container {
                display: flex;
                gap: 10px;
                align-items: center;
                transition: all 0.3s ease;
            }
            
            .refresh-tracks-btn, .force-refresh-btn, .refresh-help-icon {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .refresh-tracks-btn:hover, .force-refresh-btn:hover, .refresh-help-icon:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            
            .refresh-tracks-btn.refreshing {
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .refresh-buttons-container {
                    bottom: 70px !important;
                    right: 20px !important;
                    flex-direction: column;
                }
            }
        `;
        
        // Add to document head
        document.head.appendChild(style);
        console.log('Refresh buttons CSS injected');
    }

    // New method to wait for the storage service to be available
    waitForStorageService() {
        console.log('Checking for storage service availability...');
        
        // Check if storage service is already available
        if (window.storageService) {
            console.log('Storage service already available on initialization');
            this.storageServiceAvailable = true;
            return;
        }
        
        // Listen for the storage-service-ready event
        window.addEventListener('storage-service-ready', (event) => {
            console.log('Received storage-service-ready event in upload handler');
            this.storageServiceAvailable = true;
            
            // Get the service from the event for more reliability
            const service = event.detail?.service || window.storageService;
            
            if (service) {
                // Connect refresh callbacks
                if (typeof service.setRefreshCallback === 'function') {
                    service.setRefreshCallback(() => this.forceRefresh());
                    console.log('Successfully connected refresh callback to storage service');
                }
                
                // Show a notification that connection is established
                if (window.notificationService) {
                    window.notificationService.show(
                        'Connected', 
                        'GitHub Gist storage service connected successfully.',
                        'success',
                        3000
                    );
                }
            }
        });
        
        // Set up a retry mechanism to check for storage service
        this.checkStorageServiceWithRetry();
    }
    
    // New method to retry checking for storage service
    checkStorageServiceWithRetry() {
        const retryInterval = 1000; // 1 second between retries
        
        const checkInterval = setInterval(() => {
            this.retryCount++;
            
            if (window.storageService) {
                clearInterval(checkInterval);
                this.storageServiceAvailable = true;
                console.log(`Storage service found after ${this.retryCount} retries`);
                
                // Connect refresh callback
                if (typeof window.storageService.setRefreshCallback === 'function') {
                    window.storageService.setRefreshCallback(() => this.forceRefresh());
                    console.log('Successfully connected refresh callback to storage service');
                }
                
                return;
            }
            
            if (this.retryCount >= this.maxRetries) {
                clearInterval(checkInterval);
                console.warn(`Storage service not found after ${this.maxRetries} retries`);
                
                // Show a warning notification with helpful information
                if (window.notificationService) {
                    window.notificationService.show(
                        'Storage Service Not Available', 
                        `The GitHub Gist storage service is not available. Track changes will be saved locally only. 
                        Check that storage-service.js is loaded correctly in your HTML.`,
                        'warning',
                        8000
                    );
                }
                
                // Continue in local-only mode
                this.useLocalStorageOnly();
            }
        }, retryInterval);
    }
    
    // New method to handle operating in local-only mode
    useLocalStorageOnly() {
        console.log('Switching to local storage only mode');
        
        // Create a minimal fallback service to avoid errors
        if (!window.storageService) {
            window.storageService = {
                saveData: (key, data) => {
                    try {
                        localStorage.setItem(key, JSON.stringify(data));
                        return Promise.resolve(true);
                    } catch (error) {
                        return Promise.reject(error);
                    }
                },
                loadData: (key) => {
                    try {
                        const data = localStorage.getItem(key);
                        return Promise.resolve(data ? JSON.parse(data) : null);
                    } catch (error) {
                        return Promise.reject(error);
                    }
                },
                forceRefreshAfterSync: () => {
                    this.forceRefresh();
                    return true;
                },
                syncFromGistToLocal: () => {
                    console.warn('Gist sync not available in local-only mode');
                    return Promise.resolve(false);
                }
            };
            
            // Dispatch an event to notify that we have a fallback service
            const event = new CustomEvent('storage-service-ready', {
                detail: {
                    service: window.storageService,
                    storageMode: 'LOCAL',
                    hasGistId: false,
                    hasToken: false,
                    isFallback: true
                },
                bubbles: true
            });
            window.dispatchEvent(event);
            
            console.log('Created fallback storage service');
        }
    }

    async loadTracksData() {
        try {
            // Add cache-busting parameter to prevent browser caching
            const cacheBuster = `?cb=${Date.now()}`;
            const response = await fetch('assets/tracks/tracks.json' + cacheBuster);
            if (!response.ok) {
                throw new Error('Failed to load tracks data');
            }
            this.tracksData = await response.json();
            this.initializeTracksFromLog();
        } catch (error) {
            console.error('Error loading tracks data:', error);
            this.tracksData = { tracks: [], lastUpdated: new Date().toISOString() };
            
            // Try to load from localStorage instead
            try {
                const localTracks = localStorage.getItem('tracks');
                if (localTracks) {
                    this.tracksData = { tracks: JSON.parse(localTracks), lastUpdated: new Date().toISOString() };
                    console.log(`Loaded ${this.tracksData.tracks.length} tracks from localStorage fallback`);
                    this.initializeTracksFromLog();
                }
            } catch (localError) {
                console.error('Error loading from localStorage fallback:', localError);
            }
        }
    }

    // Add a refresh button to the UI
    addRefreshButton() {
        // Check if button already exists
        if (document.getElementById('refresh-tracks-btn')) return;

        // Create refresh buttons container
        const refreshButtonsContainer = document.createElement('div');
        refreshButtonsContainer.className = 'refresh-buttons-container';
        refreshButtonsContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 70px; /* Position to the left of GitHub settings button */
            display: flex;
            gap: 10px;
            z-index: 999;
        `;

        // Create standard refresh button
        const button = document.createElement('button');
        button.id = 'refresh-tracks-btn';
        button.className = 'refresh-tracks-btn';
        button.innerHTML = '<i class="fas fa-sync-alt"></i>';
        button.title = 'Refresh Tracks: Reload tracks data';
        button.style.cssText = `
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
        `;
        
        // Add event listener
        button.addEventListener('click', () => {
            this.refreshTracksData();
        });
        
        // Create Force Refresh button
        const forceRefreshBtn = document.createElement('button');
        forceRefreshBtn.id = 'force-refresh-btn';
        forceRefreshBtn.className = 'force-refresh-btn';
        forceRefreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        forceRefreshBtn.title = 'Force Refresh: Completely bypass browser cache';
        forceRefreshBtn.style.cssText = `
            background: #2196F3;
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
        `;
        
        // Add event listener for force refresh
        forceRefreshBtn.addEventListener('click', () => {
            this.forceRefresh();
        });
        
        // Add help icon for explaining refresh options
        const helpIcon = document.createElement('button');
        helpIcon.id = 'refresh-help-icon';
        helpIcon.className = 'refresh-help-icon';
        helpIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
        helpIcon.title = 'Click for information about refresh options';
        helpIcon.style.cssText = `
            background: #FFC107;
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
        `;
        
        // Add click event to show tooltip explaining refresh options
        helpIcon.addEventListener('click', () => {
            showNotification(`
                <strong>Refresh Options:</strong>
                <ul>
                    <li><strong>Refresh Tracks</strong>: Standard refresh that may use cached data</li>
                    <li><strong>Force Refresh</strong>: Completely bypasses browser cache for the latest data</li>
                </ul>
                <p><strong>Keyboard Shortcuts:</strong></p>
                <ul>
                    <li>Ctrl/Cmd + R: Standard refresh</li>
                    <li>Ctrl/Cmd + Shift + R: Global refresh</li>
                    <li>Ctrl/Cmd + Alt + R: Force refresh</li>
                </ul>
            `, 'info', 8000);
        });
        
        // Add all buttons to the container
        refreshButtonsContainer.appendChild(button);
        refreshButtonsContainer.appendChild(forceRefreshBtn);
        refreshButtonsContainer.appendChild(helpIcon);
        
        // Add container to the document body, not the player container
        document.body.appendChild(refreshButtonsContainer);
        
        // Add hover effect to all buttons
        const allButtons = [button, forceRefreshBtn, helpIcon];
        allButtons.forEach(btn => {
            btn.addEventListener('mouseover', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.transition = 'transform 0.2s ease';
            });
            
            btn.addEventListener('mouseout', () => {
                btn.style.transform = 'scale(1)';
            });
        });
        
        // Connect to existing Apply button if it exists
        document.addEventListener('DOMContentLoaded', () => {
            // Find the apply button using standard selectors and text content
            const findButtonByText = (text) => {
                return Array.from(document.querySelectorAll('button'))
                    .find(btn => btn.textContent.includes(text));
            };
            
            const applyButton = document.querySelector('#apply-tracks-btn') || 
                                findButtonByText('Apply Tracks to Player Page');
            
            if (applyButton) {
                applyButton.addEventListener('click', () => {
                    setTimeout(() => {
                        // Run refresh after a short delay to allow changes to propagate
                        window.refreshTracksData(); // Use the global function
                    }, 1000);
                });
            } else {
                // Try alternative selectors
                const possibleButtons = [
                    findButtonByText('Apply'),
                    findButtonByText('Apply Tracks'),
                    document.querySelector('[id*="apply"], [class*="apply"]'),
                    Array.from(document.querySelectorAll('button')).find(el => 
                        el.textContent.toLowerCase().includes('apply') || 
                        el.textContent.toLowerCase().includes('update')
                    )
                ].filter(Boolean);
                
                if (possibleButtons.length > 0) {
                    possibleButtons[0].addEventListener('click', () => {
                        setTimeout(() => {
                            window.refreshTracksData(); // Use the global function
                        }, 1000);
                    });
                }
            }
            
            // Also add listener for the keyboard shortcut
            if (this.setupKeyboardShortcut) {
                this.setupKeyboardShortcut();
            }
        });
    }
    
    // Refresh tracks data without clearing cache
    async refreshTracksData() {
        const refreshButton = document.getElementById('refresh-tracks-btn');
        
        // Add spinning animation to button
        if (refreshButton) {
            refreshButton.classList.add('refreshing');
            const originalHTML = refreshButton.innerHTML;
            refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
            refreshButton.disabled = true;
        }
        
        // Show notification
        showNotification('Refreshing tracks data...', 'info');
        
        try {
            // Force reload the tracks data with cache-busting
            const cacheBuster = `?cb=${Date.now()}`;
            const response = await fetch('assets/tracks/tracks.json' + cacheBuster);
            
            if (!response.ok) {
                throw new Error('Failed to refresh tracks data');
            }
            
            this.tracksData = await response.json();
            
            // Make sure the global tracksData exists
            if (typeof window.tracksData === 'undefined') {
                window.tracksData = [];
                console.log('Created global tracksData array');
            }
            
            // Clear existing tracks array
            window.tracksData.length = 0;
            
            // Reinitialize from log
            this.initializeTracksFromLog();
            
            // Show success notification
            showNotification('Tracks data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing tracks data:', error);
            showNotification('Failed to refresh tracks data: ' + error.message, 'error');
        } finally {
            // Reset button state
            if (refreshButton) {
                refreshButton.classList.remove('refreshing');
                refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
                refreshButton.disabled = false;
            }
        }
    }

    // Add a method to handle keyboard shortcut for refreshing
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + R for refresh (prevent default browser refresh)
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault();
                this.refreshTracksData();
            }
            
            // Add a special keyboard shortcut for global refresh: Ctrl/Cmd + Shift + R
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'r') {
                event.preventDefault();
                console.log('Global refresh keyboard shortcut detected');
                this.refreshTracksData();
                showNotification('Tracks refreshed with keyboard shortcut!', 'success');
            }
            
            // Add a special keyboard shortcut for force refresh: Ctrl/Cmd + Alt + R
            if ((event.ctrlKey || event.metaKey) && event.altKey && event.key === 'r') {
                event.preventDefault();
                console.log('Force refresh keyboard shortcut detected');
                this.forceRefresh();
                showNotification('Force refresh initiated with keyboard shortcut!', 'info');
            }
        });
    }

    initializeTracksFromLog() {
        if (this.tracksData && this.tracksData.tracks) {
            // Check if global tracksData exists, if not create it
            if (typeof window.tracksData === 'undefined') {
                window.tracksData = [];
                console.log('Created global tracksData array');
            }
            
            // Clear existing tracks
            window.tracksData.length = 0;
            
            // Add tracks from the log
            this.tracksData.tracks.forEach(track => {
                if (!window.tracksData.some(t => t.id === track.id)) {
                    // Ensure consistent tag format (lowercase, trimmed)
                    if (track.mood) track.mood = track.mood.map(m => m.toLowerCase().trim());
                    if (track.genre) track.genre = track.genre.map(g => g.toLowerCase().trim());
                    
                    window.tracksData.push(track);
                }
            });
            
            // Update UI if globals exist
            if (typeof window.filteredTracks !== 'undefined') {
                window.filteredTracks = [...window.tracksData];
            }
            
            if (typeof window.renderTrackList === 'function') {
                window.renderTrackList();
            }
            
            console.log(`Initialized ${window.tracksData.length} tracks from track log`);
        }
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) {
            console.error('No files selected for upload');
            return;
        }

        // Show upload progress container
        this.createProgressBar();
        
        // Process each file with progress
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.type.startsWith('audio/')) {
                showNotification(`${file.name} is not an audio file`, 'error');
                continue;
            }
            
            this.currentUploadFile = file;
            this.updateProgressBar(0, `Preparing ${file.name} (${i+1}/${files.length})...`);
            
            // Show tag selection dialog after short delay to show progress
            setTimeout(() => {
                this.showTagSelectionDialog(file);
            }, 500);
            
            // Wait for this file to be processed before moving to next
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.currentUploadFile !== file) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 500);
            });
        }
    }
    
    createProgressBar() {
        // Check if progress bar already exists
        let progressContainer = document.getElementById('upload-progress-container');
        if (!progressContainer) {
            // Create progress container
            progressContainer = document.createElement('div');
            progressContainer.id = 'upload-progress-container';
            progressContainer.className = 'upload-progress-container';
            progressContainer.innerHTML = `
                <div class="upload-progress-info">Preparing upload...</div>
                <div class="upload-progress">
                    <div class="upload-progress-bar" id="upload-progress-bar"></div>
                </div>
            `;
            
            // Add to body
            document.querySelector('.player-container').appendChild(progressContainer);
        } else {
            // Just show it if it exists
            progressContainer.style.display = 'block';
        }
        
        // Show the progress elements
        document.querySelector('.upload-progress').style.display = 'block';
    }
    
    updateProgressBar(percent, message) {
        const progressBar = document.getElementById('upload-progress-bar');
        const progressInfo = document.querySelector('.upload-progress-info');
        
        if (progressBar && progressInfo) {
            progressBar.style.width = `${percent}%`;
            progressInfo.textContent = message || 'Processing...';
        }
    }
    
    hideProgressBar() {
        const progressContainer = document.getElementById('upload-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    showTagSelectionDialog(file) {
        // Update progress
        this.updateProgressBar(30, `Processing ${file.name}...`);
        
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'upload-dialog';
        dialog.id = 'upload-tag-dialog';

        // Define available moods and genres - must match the filters used in the player
        const availableMoods = ['happy', 'sad', 'energetic', 'calm', 'dark', 'bright', 'upbeat', 'melancholic', 'technology', 'modern'];
        const availableGenres = ['pop', 'rock', 'electronic', 'classical', 'jazz', 'hiphop', 'ambient', 'indie', 'folk', 'funk'];
        const availableDurations = ['short', 'medium', 'long'];

        // Create dialog content
        dialog.innerHTML = `
            <div class="upload-dialog-content">
                <h3>Add Track Details</h3>
                
                <div class="upload-form">
                    <div class="form-group">
                        <label for="track-title">Title</label>
                        <input type="text" id="track-title" value="${file.name.replace('.mp3', '')}" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="track-artist">Artist</label>
                        <input type="text" id="track-artist" value="TildeSoundArt" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Mood (Select at least one)</label>
                        <div class="tag-selection mood-selection">
                            ${availableMoods.map(mood => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="mood" value="${mood}">
                                    <span>${mood}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Genre (Select at least one)</label>
                        <div class="tag-selection genre-selection">
                            ${availableGenres.map(genre => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="genre" value="${genre}">
                                    <span>${genre}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Duration</label>
                        <div class="tag-selection duration-selection">
                            ${availableDurations.map(duration => `
                                <label class="tag-checkbox">
                                    <input type="radio" name="duration" value="${duration}">
                                    <span>${duration}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="dialog-buttons">
                    <button id="cancel-upload-btn" class="btn">Cancel</button>
                    <button id="save-track-btn" class="btn btn-primary">Save & Upload</button>
                </div>
            </div>
        `;

        // Update progress
        this.updateProgressBar(60, `Ready to add details for ${file.name}`);
        
        // Add dialog to the document
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('cancel-upload-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.currentUploadFile = null;
            this.hideProgressBar();
        });

        document.getElementById('save-track-btn').addEventListener('click', () => {
            // Validation - ensure at least one mood and genre is selected
            const moodCount = document.querySelectorAll('input[name="mood"]:checked').length;
            const genreCount = document.querySelectorAll('input[name="genre"]:checked').length;
            
            if (moodCount === 0) {
                showNotification("Please select at least one mood", "error");
                return;
            }
            
            if (genreCount === 0) {
                showNotification("Please select at least one genre", "error");
                return;
            }
            
            this.processTrackWithTags(file, dialog);
        });

        // Set default values
        document.querySelectorAll('input[name="duration"]')[1].checked = true; // Default to medium
        
        // Default to some common mood and genre if none selected
        if (document.querySelectorAll('input[name="mood"]:checked').length === 0) {
            // Check the first one as default
            const firstMoodCheckbox = document.querySelector('input[name="mood"]');
            if (firstMoodCheckbox) firstMoodCheckbox.checked = true;
        }
        
        if (document.querySelectorAll('input[name="genre"]:checked').length === 0) {
            // Check the first one as default
            const firstGenreCheckbox = document.querySelector('input[name="genre"]');
            if (firstGenreCheckbox) firstGenreCheckbox.checked = true;
        }
    }

    processTrackWithTags(file, dialog) {
        // Update progress
        this.updateProgressBar(80, `Saving track information...`);
        
        // Get form values
        const title = document.getElementById('track-title').value || file.name.replace('.mp3', '');
        const artist = document.getElementById('track-artist').value || 'TildeSoundArt';
        
        // Get selected moods - ensure in lowercase for consistency
        const selectedMoods = [];
        document.querySelectorAll('input[name="mood"]:checked').forEach(checkbox => {
            selectedMoods.push(checkbox.value.toLowerCase().trim());
        });
        
        // Get selected genres - ensure in lowercase for consistency
        const selectedGenres = [];
        document.querySelectorAll('input[name="genre"]:checked').forEach(checkbox => {
            selectedGenres.push(checkbox.value.toLowerCase().trim());
        });
        
        // Get selected duration
        const selectedDuration = document.querySelector('input[name="duration"]:checked')?.value || 'medium';
        
        // Create track object
        const newTrack = {
            id: Date.now().toString(),
            title: title,
            artist: artist,
            src: `assets/tracks/${file.name}`,
            albumArt: 'assets/images/Tilde_Logo.png',
            mood: selectedMoods.length > 0 ? selectedMoods : ['unknown'],
            genre: selectedGenres.length > 0 ? selectedGenres : ['unknown'],
            duration: selectedDuration,
            dateAdded: new Date().toISOString()
        };

        // Log the tag data to verify it's being captured
        console.log('New track tags:', {
            mood: newTrack.mood,
            genre: newTrack.genre,
            duration: newTrack.duration
        });

        // Add to tracks data
        this.tracksData.tracks.push(newTrack);
        this.tracksData.lastUpdated = new Date().toISOString();

        // Remove dialog
        document.body.removeChild(dialog);

        // Update progress
        this.updateProgressBar(90, `Finalizing upload...`);
        
        // Update the tracks.json content
        const trackLogContent = JSON.stringify(this.tracksData, null, 2);
        
        // Create a download link for the updated tracks.json
        const blob = new Blob([trackLogContent], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = 'tracks.json';
        
        // Update progress
        this.updateProgressBar(100, `Upload complete!`);
        
        // Show notification with instructions
        showNotification(`
            Track "${newTrack.title}" has been processed. To complete the upload:
            1. The tracks.json file will download automatically
            2. Replace the existing tracks.json in your GitHub repository
            3. Commit and push the changes to GitHub
            4. Place the audio file in the assets/tracks directory
        `, 'info', 10000);
        
        // Trigger download
        downloadLink.click();
        
        // Add to tracksData and update UI
        if (!tracksData.some(track => track.id === newTrack.id)) {
            tracksData.push(newTrack);
            filteredTracks = [...tracksData];
            renderTrackList();
        }

        // Add the file to the known files list if available
        if (window.addKnownFile && typeof window.addKnownFile === 'function') {
            window.addKnownFile(file.name);
        }

        showNotification(`Successfully processed ${file.name}`, 'success');
        
        // Clear current file
        this.currentUploadFile = null;
        
        // Hide progress bar after delay
        setTimeout(() => {
            this.hideProgressBar();
        }, 2000);
    }
    
    // Edit existing track metadata
    editTrack(trackId) {
        // Find the track in tracksData
        const track = this.tracksData.tracks.find(t => t.id === trackId);
        if (!track) {
            showNotification('Track not found', 'error');
            return;
        }
        
        // Show the edit dialog with current values
        this.showEditTrackDialog(track);
    }
    
    showEditTrackDialog(track) {
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'upload-dialog';
        dialog.id = 'edit-track-dialog';

        // Define available moods and genres - must match the filters used in the player
        const availableMoods = ['happy', 'sad', 'energetic', 'calm', 'dark', 'bright', 'upbeat', 'melancholic', 'technology', 'modern'];
        const availableGenres = ['pop', 'rock', 'electronic', 'classical', 'jazz', 'hiphop', 'ambient', 'indie', 'folk', 'funk'];
        const availableDurations = ['short', 'medium', 'long'];

        // Create dialog content
        dialog.innerHTML = `
            <div class="upload-dialog-content">
                <h3>Edit Track Details</h3>
                
                <div class="upload-form">
                    <div class="form-group">
                        <label for="edit-track-title">Title</label>
                        <input type="text" id="edit-track-title" value="${track.title}" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-track-artist">Artist</label>
                        <input type="text" id="edit-track-artist" value="${track.artist}" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Mood (Select at least one)</label>
                        <div class="tag-selection mood-selection">
                            ${availableMoods.map(mood => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="edit-mood" value="${mood}" ${track.mood && track.mood.includes(mood.toLowerCase()) ? 'checked' : ''}>
                                    <span>${mood}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Genre (Select at least one)</label>
                        <div class="tag-selection genre-selection">
                            ${availableGenres.map(genre => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="edit-genre" value="${genre}" ${track.genre && track.genre.includes(genre.toLowerCase()) ? 'checked' : ''}>
                                    <span>${genre}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Duration</label>
                        <div class="tag-selection duration-selection">
                            ${availableDurations.map(duration => `
                                <label class="tag-checkbox">
                                    <input type="radio" name="edit-duration" value="${duration}" ${track.duration === duration ? 'checked' : ''}>
                                    <span>${duration}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="dialog-buttons">
                    <button id="cancel-edit-btn" class="btn">Cancel</button>
                    <button id="update-track-btn" class="btn btn-primary">Save Changes</button>
                </div>
            </div>
        `;

        // Add dialog to the document
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        document.getElementById('update-track-btn').addEventListener('click', () => {
            // Validation - ensure at least one mood and genre is selected
            const moodCount = document.querySelectorAll('input[name="edit-mood"]:checked').length;
            const genreCount = document.querySelectorAll('input[name="edit-genre"]:checked').length;
            
            if (moodCount === 0) {
                showNotification("Please select at least one mood", "error");
                return;
            }
            
            if (genreCount === 0) {
                showNotification("Please select at least one genre", "error");
                return;
            }
            
            this.updateTrack(track.id, dialog);
        });
    }
    
    updateTrack(trackId, dialog) {
        // Create progress indicator
        this.createProgressBar();
        this.updateProgressBar(30, "Updating track information...");
        
        // Find track in data
        const trackIndex = this.tracksData.tracks.findIndex(t => t.id === trackId);
        if (trackIndex === -1) {
            showNotification('Track not found', 'error');
            document.body.removeChild(dialog);
            this.hideProgressBar();
            return;
        }
        
        // Get form values
        const title = document.getElementById('edit-track-title').value;
        const artist = document.getElementById('edit-track-artist').value;
        
        // Get selected moods - ensure in lowercase for consistency
        const selectedMoods = [];
        document.querySelectorAll('input[name="edit-mood"]:checked').forEach(checkbox => {
            selectedMoods.push(checkbox.value.toLowerCase().trim());
        });
        
        // Get selected genres - ensure in lowercase for consistency
        const selectedGenres = [];
        document.querySelectorAll('input[name="edit-genre"]:checked').forEach(checkbox => {
            selectedGenres.push(checkbox.value.toLowerCase().trim());
        });
        
        // Get selected duration
        const selectedDuration = document.querySelector('input[name="edit-duration"]:checked')?.value || 'medium';
        
        // Update progress
        this.updateProgressBar(60, "Saving changes...");
        
        // Log the tag data to verify it's being captured
        console.log('Updated track tags:', {
            mood: selectedMoods,
            genre: selectedGenres,
            duration: selectedDuration
        });
        
        // Update track data
        this.tracksData.tracks[trackIndex] = {
            ...this.tracksData.tracks[trackIndex],
            title: title,
            artist: artist,
            mood: selectedMoods.length > 0 ? selectedMoods : ['unknown'],
            genre: selectedGenres.length > 0 ? selectedGenres : ['unknown'],
            duration: selectedDuration,
            lastModified: new Date().toISOString()
        };
        
        this.tracksData.lastUpdated = new Date().toISOString();
        
        // Remove dialog
        document.body.removeChild(dialog);
        
        // Update the tracks.json content
        const trackLogContent = JSON.stringify(this.tracksData, null, 2);
        
        // Create a download link for the updated tracks.json
        const blob = new Blob([trackLogContent], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = 'tracks.json';
        
        // Update progress
        this.updateProgressBar(90, "Finalizing changes...");
        
        // Show notification with instructions
        showNotification(`
            Track "${this.tracksData.tracks[trackIndex].title}" has been updated. To save changes:
            1. The updated tracks.json file will download automatically
            2. Replace the existing tracks.json in your GitHub repository
            3. Commit and push the changes to GitHub
        `, 'info', 10000);
        
        // Trigger download
        downloadLink.click();
        
        // Update progress
        this.updateProgressBar(100, "Update complete!");
        
        // Update local tracksData and UI
        const localTrackIndex = tracksData.findIndex(t => t.id === trackId);
        if (localTrackIndex !== -1) {
            tracksData[localTrackIndex] = { ...this.tracksData.tracks[trackIndex] };
            filteredTracks = [...tracksData];
            renderTrackList();
        }

        showNotification(`Successfully updated track "${title}"`, 'success');
        
        // Hide progress bar after delay
        setTimeout(() => {
            this.hideProgressBar();
        }, 2000);
    }

    // Get formatted track list for export
    getFormattedTrackList() {
        return this.tracksData.tracks.map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            src: track.src,
            dateAdded: track.dateAdded,
            mood: track.mood || ['unknown'],
            genre: track.genre || ['unknown'],
            duration: track.duration || 'medium'
        }));
    }

    /**
     * Announce that the upload handler is ready so other components can connect to it
     */
    _announceReady() {
        // Create and dispatch a custom event to announce the upload handler is ready
        const event = new CustomEvent('upload-handler-ready', {
            detail: {
                handler: this
            },
            bubbles: true
        });
        
        // Dispatch the event on the window object
        window.dispatchEvent(event);
        console.log('Upload handler ready event dispatched');
    }
    
    /**
     * Force refresh the track data without clearing the browser cache
     * Can be triggered manually or after a Gist sync
     */
    forceRefresh() {
        // Guard against recursive or rapid repeat calls
        if (this._refreshInProgress) {
            console.log('A refresh operation is already in progress, ignoring duplicate call');
            return false;
        }
        
        // Set refresh in progress flag and clear after a timeout
        this._refreshInProgress = true;
        const refreshTimeout = setTimeout(() => {
            this._refreshInProgress = false;
        }, 5000); // Clear flag after 5 seconds to ensure it doesn't stay stuck
        
        console.log('Force refreshing track data...');
        
        // Show a notification if the service is available
        if (window.notificationService) {
            window.notificationService.show(
                'Refreshing Data', 
                'Refreshing track data from server...', 
                'info', 
                3000
            );
        }
        
        // Check if storage service exists and use it to sync data first
        if (this.storageServiceAvailable && window.storageService && typeof window.storageService.syncFromGistToLocal === 'function') {
            // First sync from Gist to local
            window.storageService.syncFromGistToLocal()
                .then(success => {
                    if (success) {
                        console.log('Successfully synced from Gist to local storage');
                        
                        // After syncing, load tracks from local storage and update UI
                        this._refreshFromLocalStorage();
                        
                        // Ensure the track list is immediately re-rendered
                        if (typeof window.renderTrackList === 'function') {
                            setTimeout(() => {
                                window.renderTrackList();
                                console.log('Explicitly re-rendered track list after sync');
                            }, 500); // Small delay to ensure data has been processed
                        }
                    } else {
                        console.warn('Failed to sync from Gist, falling back to direct fetch');
                        // Fallback to direct fetch from server
                        this._fetchTracksWithCacheBusting();
                    }
                    // Clear refresh flag
                    clearTimeout(refreshTimeout);
                    this._refreshInProgress = false;
                })
                .catch(error => {
                    console.error('Error syncing from Gist:', error);
                    
                    // Show detailed error message
                    if (window.notificationService) {
                        window.notificationService.show(
                            'Sync Error', 
                            `Error syncing from GitHub: ${error.message}. Falling back to direct fetch.`, 
                            'error', 
                            5000
                        );
                    }
                    
                    // Fallback to direct fetch from server
                    this._fetchTracksWithCacheBusting();
                    
                    // Clear refresh flag
                    clearTimeout(refreshTimeout);
                    this._refreshInProgress = false;
                });
        } else {
            // No storage service available, use direct fetch
            console.warn('Storage service not available for sync, using direct fetch');
            this._fetchTracksWithCacheBusting();
            
            // Clear refresh flag
            clearTimeout(refreshTimeout);
            this._refreshInProgress = false;
        }
        
        return true;
    }
    
    /**
     * Refresh track data from localStorage
     * Used after a Gist sync operation
     */
    _refreshFromLocalStorage() {
        try {
            const tracksDataStr = localStorage.getItem('tracks');
            
            if (tracksDataStr) {
                let tracks = [];
                const parsedData = JSON.parse(tracksDataStr);
                
                // Handle both array format and object format with tracks property
                if (Array.isArray(parsedData)) {
                    tracks = parsedData;
                } else if (parsedData && parsedData.tracks && Array.isArray(parsedData.tracks)) {
                    tracks = parsedData.tracks;
                } else {
                    console.warn('Unexpected tracks data format in localStorage:', parsedData);
                }
                
                if (tracks.length > 0) {
                    console.log(`Loaded ${tracks.length} tracks from localStorage`);
                    
                    // Update the UI with the new tracks data
                    document.dispatchEvent(new CustomEvent('tracks-loaded', { detail: { tracks } }));
                    
                    // Update global tracksData if it exists
                    if (typeof tracksData !== 'undefined') {
                        // Clear existing tracks array
                        tracksData.length = 0;
                        // Add new tracks
                        tracks.forEach(track => tracksData.push(track));
                        console.log(`Updated global tracksData with ${tracksData.length} tracks`);
                        
                        // Update filteredTracks if it exists
                        if (typeof filteredTracks !== 'undefined') {
                            filteredTracks = [...tracksData];
                            console.log(`Updated filteredTracks with ${filteredTracks.length} tracks`);
                            
                            // Render track list if the function exists
                            if (typeof renderTrackList === 'function') {
                                renderTrackList();
                                console.log('Re-rendered track list');
                            }
                        }
                    }
                    
                    // Show success notification
                    if (window.notificationService) {
                        window.notificationService.show(
                            'Refresh Complete', 
                            `Successfully loaded ${tracks.length} tracks from storage`,
                            'success',
                            5000
                        );
                    } else {
                        // Use basic alert as fallback
                        alert(`Successfully loaded ${tracks.length} tracks from storage`);
                    }
                    
                    return true;
                } else {
                    console.warn('No tracks found in localStorage or invalid format');
                    return false;
                }
            } else {
                console.warn('No tracks data found in localStorage');
                return false;
            }
        } catch (error) {
            console.error('Error refreshing from localStorage:', error);
            return false;
        }
    }
    
    /**
     * Fetch tracks data with cache busting
     * Used as a fallback when storage service operations fail
     */
    _fetchTracksWithCacheBusting() {
        // Add timestamp to URL to bypass browser cache
        const timestamp = new Date().getTime();
        const url = `assets/tracks/tracks.json?t=${timestamp}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Extract the tracks array from the response
                let tracks = [];
                if (data.tracks && Array.isArray(data.tracks)) {
                    tracks = data.tracks;
                } else if (Array.isArray(data)) {
                    tracks = data;
                } else {
                    console.warn('Unexpected tracks data format:', data);
                    tracks = [];
                }
                
                console.log(`Fetched ${tracks.length} tracks from server with cache busting`);
                
                // Update the UI with the new tracks data
                document.dispatchEvent(new CustomEvent('tracks-loaded', { detail: { tracks } }));
                
                // Also update localStorage for future use
                localStorage.setItem('tracks', JSON.stringify(tracks));
                
                // Update global tracksData if it exists
                if (typeof tracksData !== 'undefined') {
                    // Clear existing tracks array
                    tracksData.length = 0;
                    // Add new tracks
                    tracks.forEach(track => tracksData.push(track));
                    console.log(`Updated global tracksData with ${tracksData.length} tracks`);
                    
                    // Update filteredTracks if it exists
                    if (typeof filteredTracks !== 'undefined') {
                        filteredTracks = [...tracksData];
                        console.log(`Updated filteredTracks with ${filteredTracks.length} tracks`);
                        
                        // Render track list if the function exists
                        if (typeof renderTrackList === 'function') {
                            renderTrackList();
                            console.log('Re-rendered track list');
                            
                            // Add another render after a delay to ensure UI is updated
                            setTimeout(() => {
                                if (typeof renderTrackList === 'function') {
                                    renderTrackList();
                                    console.log('Re-rendered track list again after delay');
                                }
                            }, 1000);
                        }
                    }
                }
                
                // Show success notification
                if (window.notificationService) {
                    window.notificationService.show(
                        'Refresh Complete', 
                        `Successfully loaded ${tracks.length} tracks from server`,
                        'success',
                        3000
                    );
                } else {
                    // Use basic alert as fallback
                    alert(`Successfully loaded ${tracks.length} tracks from server`);
                }
            })
            .catch(error => {
                console.error('Error fetching tracks:', error);
                
                // Show error notification
                if (window.notificationService) {
                    window.notificationService.show(
                        'Refresh Failed', 
                        `Failed to refresh tracks: ${error.message}`,
                        'error',
                        5000
                    );
                } else {
                    // Use basic alert as fallback
                    alert(`Failed to refresh tracks: ${error.message}`);
                }
            });
    }
    
    /**
     * Add the Force Refresh button to the UI
     * This is no longer needed since we handle this in addRefreshButton,
     * but kept for backward compatibility
     */
    addForceRefreshButton() {
        // If we already have the buttons in our new layout, don't add another one
        if (document.querySelector('.refresh-buttons-container')) {
            console.log('Force Refresh button already exists in the new layout');
            return;
        }
        
        // For legacy layouts, check the controls container
        const controlsContainer = document.querySelector('.player-controls') || document.querySelector('.controls-container');
        
        if (!controlsContainer) {
            console.error('Could not find controls container for Force Refresh button');
            return;
        }
        
        // If already exists, don't add another
        if (document.getElementById('force-refresh-button')) {
            return;
        }
        
        // Create the refresh button for legacy layout
        const refreshButton = document.createElement('button');
        refreshButton.id = 'force-refresh-button';
        refreshButton.className = 'control-button refresh-button';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshButton.title = 'Force Refresh Data';
        
        // Add click event listener
        refreshButton.addEventListener('click', () => {
            this.forceRefresh();
        });
        
        // Add the button to the controls container
        controlsContainer.appendChild(refreshButton);
        console.log('Force Refresh button added to UI in legacy layout');
    }

    /**
     * Manually save tracks data to GitHub Gist
     * This can be useful when you want to ensure your changes are saved to Gist
     */
    async saveToGithubGist() {
        if (!window.storageService || window.storageService.STORAGE_MODE !== 'gist') {
            console.warn('GitHub Gist storage not enabled');
            if (window.notificationService) {
                window.notificationService.show(
                    'Save Failed',
                    'GitHub Gist storage is not enabled. Please configure GitHub Gist in settings.',
                    'error',
                    4000
                );
            }
            return;
        }
        
        try {
            // Show loading status
            if (window.notificationService) {
                window.notificationService.show(
                    'Saving...',
                    'Saving track data to GitHub Gist...',
                    'info',
                    2000
                );
            }
            
            // Get the current tracks data
            const tracksData = await window.storageService.getTracksData();
            
            // Convert tracks data to JSON string
            const tracksJson = JSON.stringify(tracksData, null, 2);
            
            // Save to GitHub Gist
            const result = await window.storageService.saveFileToGist('tracks.json', tracksJson, 'Updated tracks by Tildeplayer');
            
            if (result.success) {
                console.log('Successfully saved tracks data to GitHub Gist:', result);
                
                // Show success notification
                if (window.notificationService) {
                    window.notificationService.show(
                        'Save Successful',
                        'Successfully saved tracks data to GitHub Gist',
                        'success',
                        3000
                    );
                }
            } else {
                console.error('Failed to save tracks data to GitHub Gist:', result);
                
                // Show error notification
                if (window.notificationService) {
                    window.notificationService.show(
                        'Save Failed',
                        result.message || 'Failed to save tracks data to GitHub Gist',
                        'error',
                        5000
                    );
                }
            }
        } catch (error) {
            console.error('Error saving tracks data to GitHub Gist:', error);
            
            // Show error notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Save Error',
                    `Error saving tracks data to GitHub Gist: ${error.message}`,
                    'error',
                    5000
                );
            }
        }
    }
}

// Initialize upload handler
const uploadHandler = new UploadHandler();

// Make upload handler globally available
window.uploadHandler = uploadHandler;

// Dispatch an event to notify other components that the upload handler is ready
document.dispatchEvent(new CustomEvent('upload-handler-ready', {
    detail: {
        handler: uploadHandler
    }
}));

// Add drag and drop support
document.addEventListener('DOMContentLoaded', () => {
    console.log('Upload handler registered globally as window.uploadHandler');
    
    // Check if we're on the upload page - only show upload interface there
    const isUploadPage = window.location.pathname.includes('upload.html');
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname.endsWith('/') || 
                        window.location.pathname.split('/').pop() === '';
    
    // Extra safety check to ensure upload box NEVER appears on index page
    if (isIndexPage) {
        console.log('On index page - upload box will not be shown');
        
        // Find and remove any existing upload zones that might have been created
        const existingDropZone = document.getElementById('upload-drop-zone');
        if (existingDropZone) {
            existingDropZone.parentNode.removeChild(existingDropZone);
            console.log('Removed existing upload-drop-zone from index page');
        }
        return;
    }
    
    // Only add drop zone on the upload page, not on the main index page
    if (isUploadPage) {
        const dropZone = document.createElement('div');
        dropZone.id = 'upload-drop-zone';
        dropZone.className = 'upload-drop-zone';
        dropZone.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <p>Drag and drop audio files here or click to upload</p>
            <input type="file" id="file-input" accept="audio/*" multiple style="display: none">
        `;

        const playerContainer = document.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.appendChild(dropZone);
            console.log('Added upload-drop-zone to upload page');
        } else {
            console.error('Could not find .player-container to add upload-drop-zone');
        }

        const fileInput = dropZone.querySelector('#file-input');

        // Handle drag and drop events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            uploadHandler.handleFileUpload(files);
        });

        // Handle click to upload
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            uploadHandler.handleFileUpload(e.target.files);
        });
    }

    // These event listeners are always active regardless of page
    // Add edit button to each track
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-track-btn') || 
            (e.target.parentElement && e.target.parentElement.classList.contains('edit-track-btn'))) {
            const trackItem = e.target.closest('.track-item');
            if (trackItem) {
                const trackId = trackItem.dataset.trackId;
                uploadHandler.editTrack(trackId);
            }
        }
    });

    // Setup keyboard shortcuts - use the uploadHandler instance to call the method
    document.addEventListener('keydown', (e) => {
        // Check for Ctrl+R or Cmd+R (regular refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            uploadHandler.refreshTracksData();
            showNotification('Tracks refreshed!');
        }
        
        // Check for Ctrl+Shift+R or Cmd+Shift+R (global refresh)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            uploadHandler.refreshTracksData();
            showNotification('Global refresh performed!');
        }
    });
}); 