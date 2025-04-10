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
 