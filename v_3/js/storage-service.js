// Storage Service for TildeSoundArt Player
class StorageService {
    constructor() {
        // First check if a Gist ID is saved in localStorage (from gist-setup.js)
        const savedGistId = localStorage.getItem('gistId');
        
        // Use saved Gist ID if available, otherwise use the default/placeholder
        this.GIST_ID = savedGistId || 'YOUR_GIST_ID_HERE'; // Replace with your own Gist ID
        console.log('Using Gist ID:', this.GIST_ID);
        
        // Get GitHub token if available
        this.GITHUB_TOKEN = localStorage.getItem('githubToken');
        if (this.GITHUB_TOKEN) {
            console.log('GitHub token loaded (token value hidden for security)');
        } else {
            console.log('No GitHub token provided - using unauthenticated requests');
        }
        
        // Always assume we're using GitHub when we have valid settings
        this.isGitHub = true; // Force GitHub mode
        
        // Add initialization to check if we need to perform initial sync
        this.initializeStorage();
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
        if (response.status === 403) {
            // Could be rate limit or permissions
            if (response.headers.get('X-RateLimit-Remaining') === '0') {
                return new Error(`GitHub API rate limit exceeded. Try again later or add a Personal Access Token.`);
            } else {
                return new Error(`GitHub API access forbidden (403). Check that your token has the correct permissions.`);
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
        try {
            console.log("Syncing data from Gist to localStorage...");
            
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                headers: this.getGitHubHeaders()
            });
            
            if (!response.ok) {
                throw this.handleGitHubApiError(response, 'Gist sync');
            }
            
            const gist = await response.json();
            
            if (gist.files && gist.files['tildeplayer_data.json']) {
                const allData = JSON.parse(gist.files['tildeplayer_data.json'].content);
                console.log("Data from Gist:", Object.keys(allData));
                
                // Sync each key to localStorage
                for (const [key, value] of Object.entries(allData)) {
                    this.saveToLocalStorage(key, value);
                    console.log(`Synced ${key} from Gist to localStorage`);
                }
                
                // Show a success notification
                if (window.notificationService) {
                    window.notificationService.show(
                        'Sync Complete', 
                        'Successfully synced data from GitHub Gist',
                        'success',
                        3000
                    );
                }
                
                return true;
            } else {
                console.warn("Gist doesn't contain tildeplayer_data.json file");
                
                // If we have token access, attempt to create the file
                if (this.GITHUB_TOKEN) {
                    console.log("Attempting to initialize the Gist with default structure");
                    return await this.initializeGist();
                }
                
                return false;
            }
        } catch (error) {
            console.error("Error syncing from Gist to localStorage:", error);
            
            // Show error notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Sync Failed', 
                    `Failed to sync from GitHub Gist: ${error.message}`,
                    'error',
                    5000
                );
            }
            
            throw error; // Re-throw to allow caller to handle it
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
                        8000
                    );
                }
                
                return false;
            }
            
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
                        return true;
                    } else {
                        throw this.handleGitHubApiError(updateResponse, 'adding file to Gist');
                    }
                }
            }
            
            // If the Gist doesn't exist or we have a default ID, create a new one
            if (response.status === 404 || this.GIST_ID === 'YOUR_GIST_ID_HERE') {
                console.log('Gist not found or using default ID, creating a new one...');
                
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
                    
                    if (window.notificationService) {
                        window.notificationService.show(
                            'Gist Created', 
                            `Successfully created a new GitHub Gist with ID: ${data.id}`,
                            'success',
                            5000
                        );
                    }
                    
                    return true;
                } else {
                    throw this.handleGitHubApiError(createResponse, 'creating new Gist');
                }
            }
            
            // Any other error response
            throw this.handleGitHubApiError(response, 'checking Gist existence');
        } catch (error) {
            console.error('Error initializing Gist:', error);
            
            if (window.notificationService) {
                window.notificationService.show(
                    'Gist Initialization Failed', 
                    `Failed to initialize GitHub Gist: ${error.message}`,
                    'error',
                    8000
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
}

// Create and make the singleton instance globally available
const storageService = new StorageService();

// Make it available globally instead of using exports
if (typeof window !== 'undefined') {
    window.storageService = storageService;
} 