// Storage Service for TildeSoundArt Player
class StorageService {
    constructor() {
        // First check if a Gist ID is saved in localStorage (from gist-setup.js)
        const savedGistId = localStorage.getItem('gistId');
        
        // Use saved Gist ID if available, otherwise use the default/placeholder
        this.GIST_ID = savedGistId || 'YOUR_GIST_ID_HERE'; // Replace with your own Gist ID
        console.log('Using Gist ID:', this.GIST_ID);
        
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
                // This will help ensure localStorage is synced with Gist data
                await this.syncFromGistToLocal();
            } catch (error) {
                console.error("Error during initial Gist-to-Local sync:", error);
            }
        }
        
        // Always sync track collections to ensure consistency
        try {
            await this.syncTrackCollections();
        } catch (error) {
            console.error("Error during initial track collections sync:", error);
        }
    }
    
    // New method to sync data from Gist to localStorage
    async syncFromGistToLocal() {
        try {
            console.log("Syncing data from Gist to localStorage...");
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`);
            const gist = await response.json();
            
            if (gist.files && gist.files['tildeplayer_data.json']) {
                const allData = JSON.parse(gist.files['tildeplayer_data.json'].content);
                console.log("Data from Gist:", Object.keys(allData));
                
                // Sync each key to localStorage
                for (const [key, value] of Object.entries(allData)) {
                    this.saveToLocalStorage(key, value);
                    console.log(`Synced ${key} from Gist to localStorage`);
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error syncing from Gist to localStorage:", error);
            return false;
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
}/**
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
 