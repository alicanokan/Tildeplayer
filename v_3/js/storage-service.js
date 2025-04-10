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
        
        this.isGitHub = window.location.hostname.includes('github.io');
        
        // Add initialization to check if we need to perform initial sync
        this.initializeStorage();
    }
    
    // Initialize storage and perform any needed syncing
    async initializeStorage() {
        console.log("Initializing storage service");
        console.log("Storage mode:", this.isGitHub ? "GitHub Gist" : "Local Storage");
        
        // If running on GitHub, try to get data from Gist and sync to localStorage
        if (this.isGitHub) {
            try {
                // Check if the Gist needs to be created first
                if (this.GIST_ID === 'YOUR_GIST_ID_HERE' && this.GITHUB_TOKEN) {
                    console.log("No Gist ID configured, attempting to create a new Gist");
                    await this.initializeGist();
                }
                
                // This will help ensure localStorage is synced with Gist data
                await this.syncFromGistToLocal();
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
    
    /**
     * Special method to properly save approved tracks
     * This ensures they get added to both approvedTracks and tracks collections
     */
    async saveApprovedTracks(tracks) {
        if (!tracks || !Array.isArray(tracks)) {
            console.error("Invalid tracks data for saveApprovedTracks");
            return false;
        }
        
        try {
            console.log(`Saving ${tracks.length} approved tracks`);
            
            // First, save to approved tracks collection
            await this.saveData('approvedTracks', tracks);
            
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
        
        // Always try to save to localStorage first for performance
        const localSaveSuccess = this.saveToLocalStorage(key, data);
        
        // Special handling for tracks and approvedTracks
        if (key === 'approvedTracks' && Array.isArray(data)) {
            // When saving approved tracks, also ensure they're in the main tracks collection
            // But don't trigger a sync yet - we'll do that after both saves complete
            const mainTracks = this.loadFromLocalStorage('tracks') || [];
            let mainTracksNeedUpdate = false;
            
            data.forEach(approvedTrack => {
                if (!mainTracks.some(track => track.id === approvedTrack.id || 
                    (track.title === approvedTrack.title && track.artist === approvedTrack.artist))) {
                    mainTracks.push(approvedTrack);
                    mainTracksNeedUpdate = true;
                }
            });
            
            // If we added tracks to the main collection, save it
            if (mainTracksNeedUpdate) {
                this.saveToLocalStorage('tracks', mainTracks);
                console.log(`Updated main tracks collection with ${data.length} approved tracks`);
            }
        }
        
        // If on GitHub, also save to Gist
        if (this.isGitHub) {
            try {
                saveSuccess = await this.saveToGist(key, data);
                console.log(`Saved ${key} to Gist:`, saveSuccess);
            } catch (error) {
                console.error(`Error saving ${key} to Gist:`, error);
                saveSuccess = localSaveSuccess;
            }
        } else {
            saveSuccess = localSaveSuccess;
        }
        
        return saveSuccess;
    }

    async loadData(key) {
        let data = null;
        
        // Always try localStorage first for performance
        data = this.loadFromLocalStorage(key);
        
        // If not found in localStorage and on GitHub, try Gist
        if (data === null && this.isGitHub) {
            try {
                console.log(`Data for ${key} not found in localStorage, trying Gist...`);
                data = await this.loadFromGist(key);
                
                // If found in Gist, update localStorage for next time
                if (data !== null) {
                    console.log(`Found ${key} in Gist, updating localStorage`);
                    this.saveToLocalStorage(key, data);
                }
            } catch (error) {
                console.error(`Error loading ${key} from Gist:`, error);
            }
        }
        
        // Special handling for 'tracks' when empty - try to load from approvedTracks
        if ((data === null || (Array.isArray(data) && data.length === 0)) && key === 'tracks') {
            const approvedTracks = this.loadFromLocalStorage('approvedTracks');
            if (approvedTracks && Array.isArray(approvedTracks) && approvedTracks.length > 0) {
                console.log(`No tracks found in main collection, using ${approvedTracks.length} tracks from approvedTracks`);
                data = approvedTracks;
                // Save these to tracks for next time
                this.saveToLocalStorage('tracks', approvedTracks);
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

            return true;
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
            
            if (!this.isGitHub || !this.GITHUB_TOKEN) {
                console.log("Not running on GitHub or no token available, skipping Gist sync");
                return await this.syncTrackCollections();
            }
            
            // First, ensure the Gist exists and is properly initialized
            await this.initializeGist();
            
            // Then sync from Gist to local
            const syncResult = await this.syncFromGistToLocal();
            
            // Finally sync track collections
            await this.syncTrackCollections();
            
            // Show a success notification
            if (window.notificationService) {
                window.notificationService.show(
                    'Sync Complete', 
                    'Successfully synchronized all data between GitHub Gist and local storage',
                    'success',
                    3000
                );
            }
            
            return true;
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
            
            return false;
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