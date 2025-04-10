/**
 * Tildeplayer Refresh Helper
 * This script provides direct console access to refresh functionality
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tildeplayer Refresh Helper loaded');
    
    // Define our global refresh function
    window._forceRefreshTracks = function() {
        console.log('Force refresh initiated from console...');
        
        // Try multiple possible refresh methods
        if (window.forceRefresh && typeof window.forceRefresh === 'function') {
            console.log('Using global forceRefresh function');
            window.forceRefresh();
            return true;
        }
        
        if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
            console.log('Using uploadHandler.forceRefresh function');
            window.uploadHandler.forceRefresh();
            return true;
        }
        
        // Direct implementation if other methods fail
        console.log('Using direct implementation');
        try {
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
                        console.log(`Found ${tracks.length} tracks in data.tracks property`);
                    } else if (Array.isArray(data)) {
                        tracks = data;
                        console.log(`Found ${tracks.length} tracks in array format`);
                    } else {
                        console.warn('Unexpected tracks data format:', data);
                        return false;
                    }
                    
                    console.log(`Fetched ${tracks.length} tracks from server with cache busting`);
                    
                    // Update localStorage
                    localStorage.setItem('tracks', JSON.stringify(tracks));
                    console.log('Updated localStorage with tracks data');
                    
                    // Update tracksData global if it exists
                    if (typeof tracksData !== 'undefined') {
                        // Clear existing tracks array
                        tracksData.length = 0;
                        
                        // Add new tracks
                        tracks.forEach(track => tracksData.push(track));
                        console.log(`Updated global tracksData with ${tracksData.length} tracks`);
                    }
                    
                    // Update filteredTracks if it exists
                    if (typeof filteredTracks !== 'undefined') {
                        filteredTracks = [...tracks];
                        console.log(`Updated filteredTracks with ${filteredTracks.length} tracks`);
                    }
                    
                    // Call renderTrackList if it exists
                    if (typeof renderTrackList === 'function') {
                        console.log('Calling renderTrackList function');
                        renderTrackList();
                    } else {
                        // Try to trigger a custom event as fallback
                        console.log('Dispatching tracks-loaded event');
                        document.dispatchEvent(new CustomEvent('tracks-loaded', { 
                            detail: { tracks },
                            bubbles: true 
                        }));
                    }
                    
                    // Show a success alert
                    alert(`Successfully loaded ${tracks.length} tracks from server`);
                    
                    console.log('Force refresh completed successfully');
                    return true;
                })
                .catch(error => {
                    console.error('Error fetching tracks:', error);
                    alert(`Error refreshing tracks: ${error.message}`);
                    return false;
                });
        } catch (error) {
            console.error('Error in direct implementation:', error);
            return false;
        }
    };
    
    // Add a debug helper to check track data state
    window._debugTracks = function() {
        console.log('--- Tildeplayer Tracks Debug ---');
        
        // Check localStorage tracks
        try {
            const lsTracks = localStorage.getItem('tracks');
            if (lsTracks) {
                const parsed = JSON.parse(lsTracks);
                if (Array.isArray(parsed)) {
                    console.log(`localStorage: ${parsed.length} tracks (array format)`);
                } else if (parsed && parsed.tracks && Array.isArray(parsed.tracks)) {
                    console.log(`localStorage: ${parsed.tracks.length} tracks (object format)`);
                } else {
                    console.log('localStorage: Unknown format', parsed);
                }
            } else {
                console.log('localStorage: No tracks data found');
            }
        } catch (e) {
            console.error('Error reading localStorage:', e);
        }
        
        // Check global variables
        console.log(`Global tracksData: ${typeof tracksData !== 'undefined' ? (Array.isArray(tracksData) ? tracksData.length + ' tracks' : 'Not an array') : 'Not defined'}`);
        console.log(`Global filteredTracks: ${typeof filteredTracks !== 'undefined' ? (Array.isArray(filteredTracks) ? filteredTracks.length + ' tracks' : 'Not an array') : 'Not defined'}`);
        
        // Check function availability
        console.log(`window.forceRefresh: ${typeof window.forceRefresh === 'function' ? 'Available' : 'Not available'}`);
        console.log(`window.uploadHandler: ${typeof window.uploadHandler !== 'undefined' ? 'Available' : 'Not available'}`);
        if (window.uploadHandler) {
            console.log(`uploadHandler.forceRefresh: ${typeof window.uploadHandler.forceRefresh === 'function' ? 'Available' : 'Not available'}`);
        }
        console.log(`renderTrackList: ${typeof renderTrackList === 'function' ? 'Available' : 'Not available'}`);
        
        console.log('--- Debug Complete ---');
    };
    
    console.log('Refresh helper ready. Use window._forceRefreshTracks() to force refresh tracks data.');
    console.log('Use window._debugTracks() to check tracks data state.');
}); 