// Storage Service for TildeSoundArt Player
class StorageService {
    constructor() {
        console.log('Initializing storage service...');
        
        // Core properties
        this.GIST_ID = localStorage.getItem('gistId') || null;
        this.GITHUB_TOKEN = localStorage.getItem('githubToken') || null;
        this.STORAGE_MODE = this.GIST_ID ? 'GIST' : 'LOCAL';
        this.SYNC_TIMESTAMP = null;
        
        // Flag to track if initialization is complete
        this._initialized = false;
        // Flag to track service availability
        this._available = true;
        // Flag to track if token is valid
        this._tokenValid = null;
        // Retry counts for initialization
        this._initRetryCount = 0;
        this._maxInitRetries = 3;
        // Callback for force refresh after sync
        this.forceRefreshAfterSync = null;
        // Tracks data reference
        this._tracks = [];
        
        // Log initial state
        console.log(`Storage mode: ${this.STORAGE_MODE}`);
        console.log(`Gist ID: ${this.GIST_ID ? 'configured' : 'not configured'}`);
        console.log(`GitHub token: ${this.GITHUB_TOKEN ? 'configured' : 'not configured'}`);
        
        // Initialize internal storage
        this._init();
        
        // Dispatch event to notify other components that storage service is ready
        window.addEventListener('DOMContentLoaded', () => {
            this._announceReady();
        });
        
        // Also announce immediately if DOM is already loaded
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this._announceReady();
        }
        
        // Make sure the service is globally available
        window.storageService = this;
    }
    
    // Add new method to announce when the storage service is ready
    _announceReady() {
        this._initialized = true;
        console.log('Storage service initialization complete');
        
        // Create and dispatch a custom event to announce the storage service is ready
        const event = new CustomEvent('storage-service-ready', {
            detail: {
                service: this,
                storageMode: this.STORAGE_MODE,
                hasGistId: !!this.GIST_ID,
                hasToken: !!this.GITHUB_TOKEN,
                tokenValid: this._tokenValid,
                available: this._available
            },
            bubbles: true
        });
        
        // Dispatch on window so it can be caught anywhere
        window.dispatchEvent(event);
        console.log('Storage service ready event dispatched with status:', {
            available: this._available,
            mode: this.STORAGE_MODE,
            tokenValid: this._tokenValid
        });
    }
    
    // Initialize internal storage 
    _init() {
        try {
            // Load necessary data into memory
            const tracks = localStorage.getItem('tracks');
            const approvedTracks = localStorage.getItem('approvedTracks');
            const pendingTracks = localStorage.getItem('pendingTracks');
            
            // Set up internal properties
            this._tracks = tracks ? JSON.parse(tracks) : [];
            this._approvedTracks = approvedTracks ? JSON.parse(approvedTracks) : [];
            this._pendingTracks = pendingTracks ? JSON.parse(pendingTracks) : [];
            
            // Set last sync time if available
            const lastSync = localStorage.getItem('lastGistSync');
            if (lastSync) {
                this.SYNC_TIMESTAMP = lastSync;
            }
            
            console.log(`Storage service initialized with ${this._tracks.length} tracks`);
            
            // Validate token in background if in Gist mode
            if (this.STORAGE_MODE === 'GIST' && this.GITHUB_TOKEN) {
                this.validateToken(this.GITHUB_TOKEN)
                    .then(isValid => {
                        this._tokenValid = isValid;
                        console.log(`GitHub token validation result: ${isValid ? 'valid' : 'invalid'}`);
                        
                        // If token is invalid and we're in Gist mode, show a warning
                        if (!isValid && this.STORAGE_MODE === 'GIST') {
                            this.showTokenReminder('GitHub token appears to be invalid or has insufficient permissions.');
                        }
                    })
                    .catch(err => {
                        console.error('Token validation error:', err);
                        this._tokenValid = false;
                    });
            }
            
            // Set service as available
            this._available = true;
        } catch (error) {
            console.error('Error initializing storage service internal data:', error);
            
            // Handle initialization failure
            if (this._initRetryCount < this._maxInitRetries) {
                this._initRetryCount++;
                console.log(`Retrying initialization (${this._initRetryCount}/${this._maxInitRetries})...`);
                setTimeout(() => this._init(), 1000);
            } else {
                console.error('Failed to initialize storage service after maximum retries');
                // Initialize with empty arrays as fallback
                this._tracks = [];
                this._approvedTracks = [];
                this._pendingTracks = [];
                // Mark service as available but with issues
                this._available = true;
                
                // Show a notification about the issue
                if (window.notificationService) {
                    window.notificationService.show(
                        'Storage Initialization Issue', 
                        'There was a problem initializing the storage. Using local storage as fallback.',
                        'warning',
                        8000
                    );
                }
            }
        }
    }
    
    // Show a notification to remind users about token setup
    showTokenReminder(customMessage = null) {
        const message = customMessage || 'A GitHub token is needed for full functionality. Please configure it in settings.';
        
        if (window.notificationService) {
            window.notificationService.show(
                'GitHub Token Required', 
                message,
                'warning',
                8000
            );
        } else {
            console.warn('GitHub token required for full functionality');
            alert('GitHub Token Required: ' + message);
        }
    }
    
    // New method to refresh token and Gist ID if there's an error
    refreshCredentials(newToken = null, newGistId = null) {
        let updated = false;
        
        if (newToken) {
            this.GITHUB_TOKEN = newToken;
            localStorage.setItem('githubToken', newToken);
            updated = true;
            console.log('GitHub token refreshed');
            
            // Validate the new token to ensure it has the right permissions
            this.validateToken(newToken)
                .then(isValid => {
                    this._tokenValid = isValid;
                    if (!isValid) {
                        console.warn('New token validation failed - token may have insufficient permissions');
                        this.showTokenReminder('The provided GitHub token may have insufficient permissions (gist scope required).');
                    }
                })
                .catch(error => {
                    console.warn('Token validation error:', error);
                    this._tokenValid = false;
                });
        }
        
        if (newGistId) {
            this.GIST_ID = newGistId;
            localStorage.setItem('gistId', newGistId);
            this.STORAGE_MODE = 'GIST';
            updated = true;
            console.log('Gist ID refreshed to:', newGistId);
        }
        
        if (updated) {
            // Show a success notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Credentials Updated', 
                    'GitHub credentials have been refreshed. Testing connection...',
                    'success',
                    3000
                );
            }
            
            // Test the connection with new credentials
            this.testConnection();
            
            // Re-announce the service is ready with new settings
            this._announceReady();
        }
        
        return updated;
    }
    
    // New method to validate a GitHub token
    async validateToken(token) {
        try {
            if (!token) {
                console.warn('No GitHub token provided for validation');
                return false;
            }
            
            console.log('Validating GitHub token...');
            const headers = new Headers({
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${token}`,
                'User-Agent': 'TildePlayer'
            });
            
            // Check if the token is valid
            const userResponse = await fetch('https://api.github.com/user', { 
                headers,
                cache: 'no-store' // Always bypass cache
            });
            
            if (!userResponse.ok) {
                console.warn(`Token validation failed: ${userResponse.status} ${userResponse.statusText}`);
                return false;
            }
            
            // Check token scopes
            const gistResponse = await fetch('https://api.github.com/gists', { 
                headers,
                cache: 'no-store' // Always bypass cache
            });
            
            if (!gistResponse.ok) {
                console.warn(`Gist access check failed: ${gistResponse.status} ${gistResponse.statusText}`);
                return false;
            }
            
            // Check the scopes
            const scopes = gistResponse.headers.get('X-OAuth-Scopes');
            
            if (!scopes || (!scopes.includes('gist') && !scopes.includes('repo'))) {
                console.warn('Token does not have gist scope. Limited functionality.');
                
                // Show a specific notification about scopes
                if (window.notificationService) {
                    window.notificationService.show(
                        'Token Permission Issue', 
                        'Your GitHub token does not have the "gist" permission scope. Some features may not work.',
                        'warning',
                        8000
                    );
                }
                
                return false;
            }
            
            console.log('Token validated successfully with scopes:', scopes);
            
            // Update the token valid state
            this._tokenValid = true;
            
            return true;
        } catch (error) {
            console.error('Error validating token:', error);
            
            // Show error notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Token Validation Error', 
                    `Error validating GitHub token: ${error.message}. Check your internet connection.`,
                    'error',
                    5000
                );
            }
            
            this._tokenValid = false;
            return false;
        }
    }
    
    // Test GitHub connection
    async testConnection() {
        try {
            console.log("Testing GitHub connection...");
            
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                headers: this.getGitHubHeaders(),
                cache: 'no-store' // Always bypass cache for fresh data
            });
            
            // Log rate limit information
            const rateLimit = {
                remaining: response.headers.get('X-RateLimit-Remaining'),
                limit: response.headers.get('X-RateLimit-Limit'),
                reset: response.headers.get('X-RateLimit-Reset')
            };
            
            console.log(`GitHub API Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
            
            if (!response.ok) {
                throw this.handleGitHubApiError(response, 'testing connection');
            }
            
            // Show success notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Connection Successful', 
                    'Successfully connected to GitHub Gist',
                    'success',
                    3000
                );
            }
            
            return true;
        } catch (error) {
            console.error("Connection test failed:", error);
            
            // Check if this is a token issue
            if (error.message.includes('401') || error.message.includes('403')) {
                this.showTokenReminder();
            }
            
            // Show error notification with refresh instructions
            if (window.notificationService) {
                window.notificationService.show(
                    'Connection Failed', 
                    `GitHub connection failed: ${error.message}. Please refresh your token and Gist ID in settings.`,
                    'error',
                    10000
                );
            }
            
            return false;
        }
    }
    
    // Initialize storage and perform any needed syncing
    async initializeStorage() {
        console.log("Initializing storage service");
        console.log("Storage mode:", this.hasValidGistSettings ? "GitHub Gist" : "Local Storage");
        
        // Always try to sync from Gist if we have valid settings
        if (this.hasValidGistSettings) {
            try {
                // First ensure the Gist exists and is initialized
                await this.initializeGist();
                
                // Then sync from Gist to local
                await this.syncFromGistToLocal();
                
                console.log("Initial Gist sync complete");
            } catch (error) {
                console.error("Error during initial Gist-to-Local sync:", error);
                
                // Display a notification for better user feedback
                if (window.notificationService) {
                    window.notificationService.show(
                        'GitHub Gist Error', 
                        `Failed to sync with GitHub Gist: ${error.message}. Check your Gist settings.`,
                        'error',
                        10000
                    );
                }
            }
        } else {
            console.warn("No valid Gist settings. You should configure your GitHub token and Gist ID.");
        }
        
        // Always sync track collections to ensure consistency
        try {
            await this.syncTrackCollections();
        } catch (error) {
            console.error("Error during initial track collections sync:", error);
        }
    }
    
    // Helper method to get appropriate headers for GitHub API requests
    getGitHubHeaders() {
        const headers = new Headers({
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        });
        
        if (this.GITHUB_TOKEN) {
            headers.append('Authorization', `token ${this.GITHUB_TOKEN}`);
        }
        
        return headers;
    }
    
    // Helper method to handle GitHub API errors consistently
    handleGitHubApiError(response, operation = 'API request') {
        // Log request details for debugging
        console.log(`GitHub API ${operation} failed with status ${response.status}`);
        
        if (response.status === 403) {
            // Could be rate limit or permissions
            const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
            const rateLimitReset = response.headers.get('X-RateLimit-Reset');
            
            if (rateLimitRemaining === '0') {
                const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : new Date();
                return new Error(`GitHub API rate limit exceeded. Try again after ${resetTime.toLocaleTimeString()} or add a Personal Access Token.`);
            } else {
                // This is likely a permissions issue
                if (!this.GITHUB_TOKEN) {
                    return new Error(`GitHub API access forbidden (403). A GitHub token is required for this operation.`);
                } else {
                    return new Error(`GitHub API access forbidden (403). Check that your token has the correct permissions (gist scope).`);
                }
            }
        } else if (response.status === 404) {
            return new Error(`Gist not found (404). Check your Gist ID or create a new Gist.`);
        } else if (response.status === 401) {
            return new Error(`GitHub authentication failed (401). Your token may be invalid or expired.`);
        } else {
            return new Error(`GitHub API error during ${operation}: ${response.status} ${response.statusText}`);
        }
    }
    
    // New method to sync data from Gist to localStorage
    async syncFromGistToLocal() {
        if (!this.GIST_ID) {
            console.error('Cannot sync from Gist: No Gist ID configured');
            this._showSyncStatus('Sync failed: No Gist ID configured', 'error');
            return false;
        }
        
        try {
            // Show loading indicator
            this._showSyncStatus('Syncing from Gist...', 'loading');
            
            const tracksData = await this._fetchGistData();
            
            // First check for tildeplayer_data.json (new format)
            if (tracksData.files && tracksData.files['tildeplayer_data.json']) {
                const content = tracksData.files['tildeplayer_data.json'].content;
                
                try {
                    const parsedData = JSON.parse(content);
                    
                    if (parsedData) {
                        console.log('Found tildeplayer_data.json with structure:', Object.keys(parsedData));
                        
                        // Store each key from the data object in localStorage
                        let syncCount = 0;
                        for (const [key, value] of Object.entries(parsedData)) {
                            if (key !== 'lastUpdated') {
                                localStorage.setItem(key, JSON.stringify(value));
                                this[`_${key}`] = value;
                                syncCount++;
                            }
                        }
                        
                        // Update timestamp
                        this.SYNC_TIMESTAMP = new Date().toISOString();
                        localStorage.setItem('lastGistSync', this.SYNC_TIMESTAMP);
                        
                        this._showSyncStatus(`Sync from Gist successful! Synced ${syncCount} data collections.`, 'success');
                        
                        // Trigger force refresh if callback is available
                        if (typeof this.forceRefreshAfterSync === 'function') {
                            setTimeout(() => {
                                this.forceRefreshAfterSync();
                            }, 500);
                        }
                        
                        return true;
                    } else {
                        throw new Error('Invalid data format in tildeplayer_data.json');
                    }
                } catch (parseError) {
                    console.error('Error parsing tildeplayer_data.json:', parseError);
                    this._showSyncStatus('Sync failed: Invalid JSON data in tildeplayer_data.json', 'error');
                    return false;
                }
            } 
            // Legacy format: check for tracks.json
            else if (tracksData.files && tracksData.files['tracks.json']) {
                console.log('Using legacy tracks.json format');
                const content = tracksData.files['tracks.json'].content;
                
                try {
                    const parsedData = JSON.parse(content);
                    
                    if (parsedData && Array.isArray(parsedData)) {
                        // Store tracks in localStorage
                        localStorage.setItem('tracks', content);
                        
                        // Update internal storage
                        this._tracks = parsedData;
                        
                        // Update timestamp
                        this.SYNC_TIMESTAMP = new Date().toISOString();
                        localStorage.setItem('lastGistSync', this.SYNC_TIMESTAMP);
                        
                        this._showSyncStatus('Sync from Gist successful! (Legacy format)', 'success');
                        console.log(`Successfully synced ${parsedData.length} tracks from Gist to local storage`);
                        
                        // Trigger force refresh if callback is available
                        if (typeof this.forceRefreshAfterSync === 'function') {
                            setTimeout(() => {
                                this.forceRefreshAfterSync();
                            }, 500);
                        }
                        
                        return true;
                    } else {
                        throw new Error('Invalid data format in tracks.json');
                    }
                } catch (parseError) {
                    console.error('Error parsing tracks.json:', parseError);
                    this._showSyncStatus('Sync failed: Invalid JSON data in tracks.json', 'error');
                    return false;
                }
            } else {
                console.error('No valid data files found in Gist');
                this._showSyncStatus('Sync failed: No valid data files found in Gist', 'error');
                
                // Offer to initialize the Gist
                if (window.notificationService) {
                    window.notificationService.show(
                        'Initialize Gist?', 
                        'Would you like to initialize this Gist with empty data? This will create the necessary file structure.',
                        'warning',
                        15000,
                        () => {
                            // User clicked yes/confirm
                            this.initializeGist().then(initialized => {
                                if (initialized) {
                                    window.notificationService.show(
                                        'Gist Initialized', 
                                        'Successfully created data structure in Gist. You can now sync with the player.',
                                        'success',
                                        5000
                                    );
                                }
                            });
                        }
                    );
                }
                
                return false;
            }
        } catch (error) {
            console.error('Error syncing from Gist:', error);
            
            const errorMessage = error.status === 404 
                ? 'Gist not found (404): Check your Gist ID'
                : error.status === 403
                ? 'Access denied (403): Check your GitHub token for private Gists'
                : error.status === 401
                ? 'Unauthorized (401): GitHub token is invalid or expired'
                : `Error: ${error.message || 'Unknown error'}`;
                
            this._showSyncStatus(errorMessage, 'error');
            
            // Show more specific instructions
            if (error.status === 403 && !this.GITHUB_TOKEN) {
                this.showTokenReminder();
            }
            
            return false;
        }
    }

    async _fetchGistData() {
        const url = `https://api.github.com/gists/${this.GIST_ID}`;
        
        // Get headers with proper authorization
        const headers = this.getGitHubHeaders();
        
        try {
            const response = await fetch(url, { 
                method: 'GET',
                headers: headers,
                cache: 'no-store' // Always bypass cache for fresh data
            });
            
            if (!response.ok) {
                const error = this.handleGitHubApiError(response, 'fetching Gist data');
                error.status = response.status;
                throw error;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching Gist data:', error);
            
            // Check for network errors
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Unable to connect to GitHub API. Check your internet connection.');
            }
            
            throw error;
        }
    }

    async _updateGist(jsonData) {
        if (!this.GIST_ID) {
            console.error('Cannot update Gist: No Gist ID configured');
            return false;
        }
        
        const url = `https://api.github.com/gists/${this.GIST_ID}`;
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token is available
        if (this.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${this.GITHUB_TOKEN}`;
        } else {
            console.warn('No GitHub token provided. This may fail for private Gists.');
        }
        
        const payload = {
            files: {
                'tracks.json': {
                    content: jsonData
                }
            }
        };
        
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const error = new Error(`GitHub API error: ${response.statusText}`);
                error.status = response.status;
                throw error;
            }
            
            // Update timestamp
            this.SYNC_TIMESTAMP = new Date().toISOString();
            localStorage.setItem('lastGistSync', this.SYNC_TIMESTAMP);
            
            return true;
        } catch (error) {
            console.error('Error updating Gist:', error);
            
            // Show specific error message based on status code
            if (error.status === 404) {
                this._showSyncStatus('Gist not found (404): Check your Gist ID', 'error');
            } else if (error.status === 403) {
                this._showSyncStatus('Access denied (403): Check your GitHub token for private Gists', 'error');
            } else if (error.status === 401) {
                this._showSyncStatus('Unauthorized (401): GitHub token is invalid or expired', 'error');
            } else {
                this._showSyncStatus(`Error updating Gist: ${error.message || 'Unknown error'}`, 'error');
            }
            
            return false;
        }
    }
    
    /**
     * Show sync status to the user
     */
    _showSyncStatus(message, type = 'info') {
        // Check if we have the notification system available
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show(message, type === 'error' ? 'error' : 'info');
        } else {
            // Fallback to console
            if (type === 'error') {
                console.error(message);
            } else if (type === 'success') {
                console.log('%c' + message, 'color: green; font-weight: bold');
            } else {
                console.log(message);
            }
        }
    }

    /**
     * Synchronizes all track collections to ensure consistency
     * This is the core method that fixes the issue with tracks not showing up
     * in the main player and disappearing after refresh
     */
    async syncTrackCollections() {
        try {
            console.log("Synchronizing track collections...");
            
            // Load all track collections
            const mainTracks = await this.loadData('tracks') || [];
            const approvedTracks = await this.loadData('approvedTracks') || [];
            const pendingTracks = await this.loadData('pendingTracks') || [];
            
            console.log(`Track collections before sync - Main: ${mainTracks.length}, Approved: ${approvedTracks.length}, Pending: ${pendingTracks.length}`);
            
            // Ensure all approved tracks are in main tracks collection
            let mainTracksModified = false;
            const updatedMainTracks = [...mainTracks];
            
            approvedTracks.forEach(approvedTrack => {
                // Check if this approved track is already in main tracks
                const existingTrackIndex = updatedMainTracks.findIndex(track => 
                    track.id === approvedTrack.id || 
                    (track.title === approvedTrack.title && track.artist === approvedTrack.artist)
                );
                
                if (existingTrackIndex === -1) {
                    // Track not found in main collection, add it
                    updatedMainTracks.push(approvedTrack);
                    mainTracksModified = true;
                    console.log(`Added track "${approvedTrack.title}" to main collection`);
                }
            });
            
            // Save updated main tracks if modified
            if (mainTracksModified) {
                await this.saveData('tracks', updatedMainTracks);
                console.log(`Updated main tracks collection with ${updatedMainTracks.length} tracks`);
            }
            
            // Ensure all approved tracks are consistent with their source
            // This handles the case where tracks are approved but might have disappeared
            const validPendingTracks = pendingTracks.filter(track => 
                !approvedTracks.some(approved => 
                    approved.id === track.id || 
                    (approved.title === track.title && approved.artist === track.artist)
                )
            );
            
            // If the valid pending tracks count differs, update storage
            if (validPendingTracks.length !== pendingTracks.length) {
                await this.saveData('pendingTracks', validPendingTracks);
                console.log(`Updated pending tracks collection with ${validPendingTracks.length} tracks`);
            }
        } catch (error) {
            console.error("Error during track collections sync:", error);
        }
    }
    
    // Helper method to sanitize track data before saving
    sanitizeTrackData(data) {
        if (!data || !Array.isArray(data)) return data;
        
        return data.map(track => {
            if (!track) return track;
            
            // Clone the track to avoid modifying the original object
            const sanitizedTrack = {...track};
            
            // Fix "medium" duration values
            if (sanitizedTrack.duration === "medium") {
                console.log(`Fixing "medium" duration value for track "${sanitizedTrack.title}" to "energetic"`);
                sanitizedTrack.duration = "energetic";
            }
            
            return sanitizedTrack;
        });
    }
    
    // Special method to properly save approved tracks
    async saveApprovedTracks(tracks) {
        if (!tracks || !Array.isArray(tracks)) {
            console.error("Invalid tracks data for saveApprovedTracks");
            return false;
        }
        
        try {
            console.log(`Saving ${tracks.length} approved tracks`);
            
            // Sanitize the tracks first
            const sanitizedTracks = this.sanitizeTrackData(tracks);
            
            // First, save to approved tracks collection
            await this.saveData('approvedTracks', sanitizedTracks);
            
            // Then sync with main tracks collection
            await this.syncTrackCollections();
            
            return true;
        } catch (error) {
            console.error("Error saving approved tracks:", error);
            return false;
        }
    }

    async saveData(key, data) {
        let saveSuccess = false;
        
        // Sanitize track data if it's a tracks collection
        let sanitizedData = data;
        if ((key === 'tracks' || key === 'approvedTracks' || key === 'pendingTracks') && Array.isArray(data)) {
            sanitizedData = this.sanitizeTrackData(data);
        }
        
        // Always save to localStorage first as a fallback
        const localSaveSuccess = this.saveToLocalStorage(key, sanitizedData);
        
        // Special handling for tracks and approvedTracks
        if (key === 'approvedTracks' && Array.isArray(sanitizedData)) {
            // When saving approved tracks, also ensure they're in the main tracks collection
            const mainTracks = this.loadFromLocalStorage('tracks') || [];
            let mainTracksNeedUpdate = false;
            
            sanitizedData.forEach(approvedTrack => {
                if (!mainTracks.some(track => track.id === approvedTrack.id || 
                    (track.title === approvedTrack.title && track.artist === approvedTrack.artist))) {
                    mainTracks.push(approvedTrack);
                    mainTracksNeedUpdate = true;
                }
            });
            
            // If we added tracks to the main collection, save it
            if (mainTracksNeedUpdate) {
                this.saveToLocalStorage('tracks', mainTracks);
                console.log(`Updated main tracks collection with ${sanitizedData.length} approved tracks`);
            }
        }
        
        // Always try to save to Gist if we have valid settings, regardless of isGitHub flag
        if (this.hasValidGistSettings) {
            try {
                saveSuccess = await this.saveToGist(key, sanitizedData);
                console.log(`Saved ${key} to Gist:`, saveSuccess);
                
                // After successful Gist save, sync from Gist to local to ensure consistency
                if (saveSuccess) {
                    try {
                        await this.syncFromGistToLocal();
                    } catch (syncError) {
                        console.error("Error during post-save sync:", syncError);
                    }
                }
            } catch (error) {
                console.error(`Error saving ${key} to Gist:`, error);
                saveSuccess = localSaveSuccess;
            }
        } else {
            saveSuccess = localSaveSuccess;
            console.warn("No valid Gist settings. Data saved to localStorage only.");
        }
        
        return saveSuccess;
    }

    async loadData(key) {
        let data = null;
        
        // If we have valid Gist settings, always try to load from Gist first
        if (this.hasValidGistSettings) {
            try {
                console.log(`Attempting to load ${key} from Gist...`);
                data = await this.loadFromGist(key);
                
                // If found in Gist, update localStorage for next time
                if (data !== null) {
                    console.log(`Found ${key} in Gist, updating localStorage`);
                    this.saveToLocalStorage(key, data);
                    return data;
                }
            } catch (error) {
                console.error(`Error loading ${key} from Gist:`, error);
            }
        }
        
        // If we couldn't load from Gist, fall back to localStorage
        data = this.loadFromLocalStorage(key);
        
        // Special handling for 'tracks' when empty - try to load from approvedTracks
        if ((data === null || (Array.isArray(data) && data.length === 0)) && key === 'tracks') {
            const approvedTracks = this.loadFromLocalStorage('approvedTracks');
            if (approvedTracks && Array.isArray(approvedTracks) && approvedTracks.length > 0) {
                console.log(`No tracks found in main collection, using ${approvedTracks.length} tracks from approvedTracks`);
                data = approvedTracks;
                // Save these to tracks for next time
                this.saveToLocalStorage('tracks', approvedTracks);
                
                // Also save to Gist if possible
                if (this.hasValidGistSettings) {
                    this.saveToGist('tracks', approvedTracks).catch(error => {
                        console.error("Error saving fallback tracks to Gist:", error);
                    });
                }
            }
        }
        
        return data;
    }

    // LocalStorage methods
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    // GitHub Gist methods
    async saveToGist(key, data) {
        try {
            console.log(`Saving ${key} to Gist with ${Array.isArray(data) ? data.length : 'unknown'} items...`);
            
            // Use the waitForSync helper to ensure proper completion
            return await this.waitForSync(async () => {
                // First, get the current gist content
                const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                    headers: this.getGitHubHeaders()
                });
                
                if (!response.ok) {
                    // Special case: if 404 and we have a token, try to create the Gist
                    if (response.status === 404 && this.GITHUB_TOKEN) {
                        console.log("Gist not found, attempting to create one...");
                        const created = await this.initializeGist();
                        
                        // If successfully created, try saving again
                        if (created) {
                            return await this.saveToGist(key, data);
                        }
                    }
                    
                    throw this.handleGitHubApiError(response, 'getting Gist content');
                }
                
                const gist = await response.json();

                // Get the current data or initialize new
                let allData = {};
                if (gist.files && gist.files['tildeplayer_data.json']) {
                    allData = JSON.parse(gist.files['tildeplayer_data.json'].content);
                }

                // Update the specific key
                allData[key] = data;
                allData.lastUpdated = new Date().toISOString();

                // Prepare the update
                const files = {
                    'tildeplayer_data.json': {
                        content: JSON.stringify(allData, null, 2)
                    }
                };

                // Update the gist
                const updateResponse = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                    method: 'PATCH',
                    headers: this.getGitHubHeaders(),
                    body: JSON.stringify({ files })
                });

                if (!updateResponse.ok) {
                    throw this.handleGitHubApiError(updateResponse, 'updating Gist');
                }
                
                console.log(`Successfully saved ${key} to Gist with ${Array.isArray(data) ? data.length : 'unknown'} items`);
                return true;
            });
        } catch (error) {
            console.error('Error saving to Gist:', error);
            
            // Show error notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Save Failed', 
                    `Failed to save to GitHub Gist: ${error.message}`,
                    'error',
                    5000
                );
            }
            
            // Fallback to localStorage if Gist save fails
            console.log('Falling back to localStorage for save operation');
            return this.saveToLocalStorage(key, data);
        }
    }

    async loadFromGist(key) {
        try {
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                headers: this.getGitHubHeaders()
            });
            
            if (!response.ok) {
                throw this.handleGitHubApiError(response, 'loading from Gist');
            }

            const gist = await response.json();

            if (gist.files && gist.files['tildeplayer_data.json']) {
                const allData = JSON.parse(gist.files['tildeplayer_data.json'].content);
                return allData[key] || null;
            }
            return null;
        } catch (error) {
            console.error('Error loading from Gist:', error);
            
            // Show error notification if this was a direct load attempt (not just a check)
            if (key) {
                if (window.notificationService) {
                    window.notificationService.show(
                        'Load Failed', 
                        `Failed to load from GitHub Gist: ${error.message}`,
                        'error',
                        5000
                    );
                }
            }
            
            // Fallback to localStorage if Gist load fails
            return this.loadFromLocalStorage(key);
        }
    }

    // Helper method to check if running on GitHub Pages
    isRunningOnGitHub() {
        return this.isGitHub;
    }
    
    // Helper method to explicitly sync between storage types
    async syncAllData() {
        if (this.isGitHub) {
            await this.syncFromGistToLocal();
        }
        
        // Also sync track collections
        await this.syncTrackCollections();
        
        return true;
    }

    // Create or initialize a Gist if it doesn't exist
    async initializeGist() {
        // Check if the Gist exists first
        try {
            // If we don't have a token, we can't create a Gist
            if (!this.GITHUB_TOKEN) {
                console.error('Cannot create or initialize Gist without a GitHub token');
                
                if (window.notificationService) {
                    window.notificationService.show(
                        'GitHub Token Required', 
                        'A GitHub Personal Access Token is required to create or initialize a Gist. Please add a token in the settings.',
                        'error',
                        8000,
                        // Add callback for direct navigation to the token setup
                        () => {
                            // Toggle the Gist setup panel to open
                            const toggleButton = document.querySelector('.gist-setup-toggle');
                            if (toggleButton) {
                                toggleButton.click();
                                
                                // Focus on the token input
                                setTimeout(() => {
                                    const tokenInput = document.getElementById('github-token-input');
                                    if (tokenInput) {
                                        tokenInput.focus();
                                        // Highlight the field
                                        tokenInput.style.border = '2px solid #f44336';
                                        setTimeout(() => {
                                            tokenInput.style.border = '';
                                        }, 3000);
                                    }
                                }, 500);
                            }
                        }
                    );
                }
                
                return false;
            }
            
            // First validate the token
            const isTokenValid = await this.validateToken(this.GITHUB_TOKEN);
            
            if (!isTokenValid) {
                console.warn('The GitHub token may not have the required permissions');
                
                if (window.notificationService) {
                    window.notificationService.show(
                        'Token Permissions Issue', 
                        'Your GitHub token may not have the required gist permissions. Please validate it in settings.',
                        'warning',
                        8000
                    );
                }
                
                // We'll still try to proceed, but warn the user
            }
            
            // Check if the Gist exists
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                headers: this.getGitHubHeaders()
            });
            
            // If the Gist exists
            if (response.ok) {
                const gist = await response.json();
                
                // Check if it has our data file
                if (gist.files && gist.files['tildeplayer_data.json']) {
                    console.log('Gist exists and contains tildeplayer_data.json');
                    return true;
                } else {
                    console.log('Gist exists but does not contain tildeplayer_data.json, updating it...');
                    // Initialize with empty data structure
                    const initialContent = {
                        tracks: [],
                        approvedTracks: [],
                        pendingTracks: [],
                        playlist: [],
                        lastUpdated: new Date().toISOString()
                    };
                    
                    // Update the existing Gist to add our file
                    const updateResponse = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                        method: 'PATCH',
                        headers: this.getGitHubHeaders(),
                        body: JSON.stringify({
                            description: 'TildePlayer Data Storage',
                            files: {
                                'tildeplayer_data.json': {
                                    content: JSON.stringify(initialContent, null, 2)
                                }
                            }
                        })
                    });
                    
                    if (updateResponse.ok) {
                        console.log('Successfully added tildeplayer_data.json to existing Gist');
                        
                        if (window.notificationService) {
                            window.notificationService.show(
                                'Gist Initialized', 
                                'Successfully initialized the Gist with TildePlayer data structure.',
                                'success',
                                5000
                            );
                        }
                        
                        return true;
                    } else {
                        const error = this.handleGitHubApiError(updateResponse, 'adding file to Gist');
                        console.error(error);
                        
                        if (window.notificationService) {
                            window.notificationService.show(
                                'Gist Update Failed', 
                                `Failed to update Gist: ${error.message}`,
                                'error',
                                8000
                            );
                        }
                        
                        throw error;
                    }
                }
            }
            
            // If the Gist doesn't exist or we have a default ID, create a new one
            if (response.status === 404 || this.GIST_ID === 'YOUR_GIST_ID_HERE') {
                console.log('Gist not found or using default ID, creating a new one...');
                
                if (window.notificationService) {
                    window.notificationService.show(
                        'Creating New Gist', 
                        'Creating a new GitHub Gist for TildePlayer data...',
                        'info',
                        5000
                    );
                }
                
                // Initialize with empty data structure
                const initialContent = {
                    tracks: [],
                    approvedTracks: [],
                    pendingTracks: [],
                    playlist: [],
                    lastUpdated: new Date().toISOString()
                };
                
                const createResponse = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: this.getGitHubHeaders(),
                    body: JSON.stringify({
                        description: 'TildePlayer Data Storage',
                        public: true, // Making it public by default, user can change in GitHub if needed
                        files: {
                            'tildeplayer_data.json': {
                                content: JSON.stringify(initialContent, null, 2)
                            }
                        }
                    })
                });
                
                if (createResponse.ok) {
                    const data = await createResponse.json();
                    // Update the Gist ID to the newly created one
                    this.GIST_ID = data.id;
                    localStorage.setItem('gistId', data.id);
                    console.log('Created new Gist with ID:', data.id);
                    
                    // Update the Gist ID in the settings panel if open
                    const gistIdInput = document.getElementById('gist-id-input');
                    if (gistIdInput) {
                        gistIdInput.value = data.id;
                        // Update the status indicator
                        const statusElement = document.querySelector('.gist-id-status');
                        if (statusElement) {
                            statusElement.className = 'gist-id-status valid';
                            statusElement.textContent = 'New Gist created successfully';
                        }
                    }
                    
                    if (window.notificationService) {
                        window.notificationService.show(
                            'Gist Created', 
                            `Successfully created a new GitHub Gist with ID: ${data.id}`,
                            'success',
                            8000,
                            // Add a copy button callback
                            () => {
                                navigator.clipboard.writeText(data.id)
                                    .then(() => {
                                        window.notificationService.show(
                                            'Copied!', 
                                            'Gist ID copied to clipboard',
                                            'success',
                                            2000
                                        );
                                    })
                                    .catch(err => {
                                        console.error('Could not copy text: ', err);
                                    });
                            },
                            'Copy Gist ID' // Custom button text
                        );
                    }
                    
                    return true;
                } else {
                    const error = this.handleGitHubApiError(createResponse, 'creating new Gist');
                    console.error(error);
                    
                    if (window.notificationService) {
                        window.notificationService.show(
                            'Gist Creation Failed', 
                            `Failed to create a new Gist: ${error.message}`,
                            'error',
                            8000
                        );
                    }
                    
                    throw error;
                }
            }
            
            // Any other error response
            const error = this.handleGitHubApiError(response, 'checking Gist existence');
            throw error;
        } catch (error) {
            console.error('Error initializing Gist:', error);
            
            // Provide specific guidance based on error type
            let errorMessage = `Failed to initialize GitHub Gist: ${error.message}`;
            let actionText = null;
            let actionCallback = null;
            
            if (error.message.includes('401')) {
                errorMessage = 'GitHub authentication failed. Your token is invalid or expired.';
                actionText = 'Update Token';
                actionCallback = () => {
                    // Open the Gist setup panel
                    const toggleButton = document.querySelector('.gist-setup-toggle');
                    if (toggleButton) {
                        toggleButton.click();
                        
                        // Focus on the token input
                        setTimeout(() => {
                            const tokenInput = document.getElementById('github-token-input');
                            if (tokenInput) {
                                tokenInput.focus();
                                // Clear the current token to encourage replacement
                                tokenInput.value = '';
                            }
                        }, 500);
                    }
                };
            } else if (error.message.includes('403')) {
                if (error.message.includes('rate limit')) {
                    errorMessage = 'GitHub API rate limit exceeded. Please try again later.';
                } else {
                    errorMessage = 'GitHub API access denied. Your token may not have the correct permissions.';
                    actionText = 'Validate Token';
                    actionCallback = () => {
                        // Open the Gist setup panel and trigger token validation
                        const toggleButton = document.querySelector('.gist-setup-toggle');
                        if (toggleButton) {
                            toggleButton.click();
                            
                            // Click the validate button
                            setTimeout(() => {
                                const validateButton = document.getElementById('validate-token-btn');
                                if (validateButton) {
                                    validateButton.click();
                                }
                            }, 500);
                        }
                    };
                }
            }
            
            if (window.notificationService) {
                window.notificationService.show(
                    'Gist Initialization Failed', 
                    errorMessage,
                    'error',
                    8000,
                    actionCallback,
                    actionText
                );
            }
            
            return false;
        }
    }

    // Add a new method for comprehensive Gist to localStorage sync
    async forceSyncAll() {
        try {
            console.log("Performing comprehensive data synchronization...");
            
            if (!this.hasValidGistSettings) {
                console.log("No valid Gist settings available, skipping Gist sync");
                return await this.syncTrackCollections();
            }
            
            // First, ensure the Gist exists and is properly initialized
            await this.initializeGist();
            
            // First sync from local to Gist to ensure remote has our latest changes
            const localTracks = this.loadFromLocalStorage('tracks') || [];
            const localApprovedTracks = this.loadFromLocalStorage('approvedTracks') || [];
            const localPendingTracks = this.loadFromLocalStorage('pendingTracks') || [];
            
            console.log(`Local data before sync - Tracks: ${localTracks.length}, Approved: ${localApprovedTracks.length}, Pending: ${localPendingTracks.length}`);
            
            // Save all local collections to Gist first
            if (localTracks.length > 0) {
                await this.saveToGist('tracks', localTracks);
            }
            
            if (localApprovedTracks.length > 0) {
                await this.saveToGist('approvedTracks', localApprovedTracks);
            }
            
            if (localPendingTracks.length > 0) {
                await this.saveToGist('pendingTracks', localPendingTracks);
            }
            
            // Then sync from Gist to local to ensure the latest is in both places
            await this.syncFromGistToLocal();
            
            // Finally sync track collections to ensure consistency
            await this.syncTrackCollections();
            
            // Load the synchronized data to verify
            const tracksAfterSync = this.loadFromLocalStorage('tracks') || [];
            const approvedTracksAfterSync = this.loadFromLocalStorage('approvedTracks') || [];
            
            console.log(`Data after sync - Tracks: ${tracksAfterSync.length}, Approved: ${approvedTracksAfterSync.length}`);
            
            // Show a success notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Sync Complete', 
                    `Successfully synchronized all data. Tracks: ${tracksAfterSync.length}, Approved: ${approvedTracksAfterSync.length}`,
                    'success',
                    5000
                );
            }
            
            return {
                success: true,
                tracks: tracksAfterSync,
                approvedTracks: approvedTracksAfterSync,
                pendingTracks: this.loadFromLocalStorage('pendingTracks') || []
            };
        } catch (error) {
            console.error("Error during comprehensive sync:", error);
            
            // Show error notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Sync Failed', 
                    `Failed to synchronize data: ${error.message}`,
                    'error',
                    5000
                );
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Helper method to wait for a Gist sync operation to complete
    async waitForSync(operation) {
        try {
            // Execute the operation
            const result = await operation();
            
            // Add a small delay to ensure GitHub API has processed the request
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return result;
        } catch (error) {
            console.error("Error during sync operation:", error);
            throw error;
        }
    }

    // Add an accessor to check if we have valid Gist settings
    get hasValidGistSettings() {
        return this.GIST_ID && this.GIST_ID !== 'YOUR_GIST_ID_HERE' && this.GITHUB_TOKEN;
    }

    /**
     * Set the callback function to be called after successful sync
     * @param {Function} callback - The callback function
     */
    setRefreshCallback(callback) {
        if (typeof callback === 'function') {
            this.forceRefreshAfterSync = callback;
            console.log('Refresh callback set on storage service');
        } else {
            console.warn('Invalid refresh callback provided to storage service');
        }
    }

    /**
     * Set the Gist ID for the storage service
     * @param {string} gistId - The GitHub Gist ID
     */
    setGistId(gistId) {
        if (gistId && gistId.trim() !== '') {
            this.GIST_ID = gistId.trim();
            localStorage.setItem('gistId', this.GIST_ID);
            this.STORAGE_MODE = 'GIST';
            console.log(`Storage mode set to gist with ID: ${this.GIST_ID}`);
        } else {
            this.GIST_ID = null;
            localStorage.removeItem('gistId');
            this.STORAGE_MODE = 'LOCAL';
            console.log('Storage mode set to local (no Gist ID)');
        }
    }

    /**
     * Set the GitHub token for the storage service
     * @param {string} token - The GitHub token
     */
    setGitHubToken(token) {
        if (token && token.trim() !== '') {
            this.GITHUB_TOKEN = token.trim();
            localStorage.setItem('githubToken', this.GITHUB_TOKEN);
            console.log('GitHub token set for storage service');
        } else {
            this.GITHUB_TOKEN = null;
            localStorage.removeItem('githubToken');
            console.log('GitHub token removed from storage service');
        }
    }
}

// Create and make the singleton instance globally available
const storageService = new StorageService();

// Make it available globally instead of using exports
if (typeof window !== 'undefined') {
    window.storageService = storageService;
} 