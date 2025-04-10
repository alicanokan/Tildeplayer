// Music Player App
(function() {
// Add API service functions at the top of the file
const API_URL = 'http://localhost:3000/api';

// Constants
const MAX_RETRY_ATTEMPTS = 3;

// The storageService is now globally available from storage-service.js
// import storageService from './storage-service.js';

// API Service functions
const api = {
    async getAllTracks() {
        const response = await fetch(`${API_URL}/tracks`);
        return response.json();
    }
};

// Initial track list before loading any tracks
let allTracks = [];

// Track data loaded from JSON
let tracksData = [];

// A filtered subset of tracks based on user filters
let filteredTracks = [];

// Add this near the top of the file, before any other code that uses tracksData or filteredTracks
// Global variables for tracks
window.tracksData = window.tracksData || [];
window.filteredTracks = window.filteredTracks || [...window.tracksData];

// Initialize sample tracks
const sampleTracks = [
    {
        id: 1,
        title: "ID Music 1 - TOGG ID MEDIA",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID Music 1 - (TOGG_ID MEDIA _padfuturebass 2).mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["energetic", "intense"],
        genre: ["electronic"],
        duration: "medium"
    },
    {
        id: 2,
        title: "ID Music 2 - Technology F1",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID Music 2 - (17c-Technology_F1).mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["focus", "energetic"],
        genre: ["electronic"],
        duration: "medium"
    },
    {
        id: 3,
        title: "ID Music 3 - TOGG ID MEDIA Piano",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID Music 3 - (14. TOGG_ID MEDIA _Piano3).mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["chill", "focus"],
        genre: ["classical"],
        duration: "medium"
    },
    {
        id: 4,
        title: "ID Music 4 - Lofi",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID Music 4 - (9c-Lofi_F1).mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["chill", "relaxed"],
        genre: ["lofi"],
        duration: "medium"
    },
    {
        id: 5,
        title: "ID Music 5 - StompRock",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID Music 5 - (16c-StompRock_F1).mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["energetic", "intense"],
        genre: ["rock"],
        duration: "medium"
    },
    {
        id: 6,
        title: "ID Music 6 - Synthpop",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID Music 6 - (ID_SYNTHPOP_60) 1.mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["energetic", "happy"],
        genre: ["electronic", "pop"],
        duration: "medium"
    },
    {
        id: 7,
        title: "ID Music 7 - TOGG ID MEDIA Funk", 
        artist: "TildeSoundArt",
        src: "assets/tracks/ID Music 7 - (TOGG_ID MEDIA _Funk).mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["energetic", "happy"],
        genre: ["funk"],
        duration: "medium"
    }
];

// A very short audio file encoded as base64 data URI (for embedded audio)
const embeddedAudioData = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

// Add new functions to manage the loading UI
function showTrackLoadingUI(show = true) {
    const loadingContainer = document.getElementById('track-loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = show ? 'block' : 'none';
    }
}

function updateTrackLoadingProgress(percent, status, details) {
    const progressBar = document.getElementById('track-loading-progress');
    const statusEl = document.getElementById('loading-status');
    const detailsEl = document.getElementById('track-loading-details');
    
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (statusEl) statusEl.textContent = status || 'Loading...';
    if (detailsEl) detailsEl.textContent = details || '';
    
    // Add pulse effect when loading
    if (percent < 100 && statusEl) {
        statusEl.classList.add('loading-pulse');
    } else if (statusEl) {
        statusEl.classList.remove('loading-pulse');
    }
}

// Find the loadUploadedTracks function and update it
async function loadUploadedTracks() {
    console.log('Loading uploaded tracks...');
    
    // Ensure tracksData is defined globally
    if (typeof window.tracksData === 'undefined') {
        window.tracksData = [];
        console.log('Created global tracksData array');
    }
    
    // Clear existing tracks
    window.tracksData.length = 0;
    
    // Try to load from storage first
    let storageTracksFound = false;
    
    try {
        if (window.storageService && typeof window.storageService.isAvailable === 'function' && window.storageService.isAvailable()) {
            console.log('Storage service is available, attempting to load tracks...');
            
            // Define safeStorageOperation locally if it doesn't exist in this scope
            const localSafeStorageOperation = async (operation, fallbackValue) => {
                try {
                    const result = await operation();
                    return result !== null && result !== undefined ? result : fallbackValue;
                } catch (error) {
                    console.error('Storage operation failed:', error);
                    return fallbackValue;
                }
            };
            
            const storageTracks = await localSafeStorageOperation(
                async () => await window.storageService.loadData('tracks'),
                []
            );
            
            if (storageTracks && storageTracks.length > 0) {
                console.log(`Loaded ${storageTracks.length} tracks from storage`);
                window.tracksData = storageTracks;
                storageTracksFound = true;
            } else {
                console.log('No tracks found in storage');
            }
            
            // If no tracks found and running on GitHub, try to sync from Gist
            if (!storageTracksFound && window.storageService && 
                typeof window.storageService.isRunningOnGitHub === 'function' && 
                window.storageService.isRunningOnGitHub()) {
                console.log('Running on GitHub Pages with no local tracks, attempting to sync from Gist...');
                
                await localSafeStorageOperation(
                    async () => await window.storageService.syncFromGistToLocal(),
                    false
                );
                
                // Try to load again after sync
                const syncedTracks = await localSafeStorageOperation(
                    async () => await window.storageService.loadData('tracks'),
                    []
                );
                
                if (syncedTracks && syncedTracks.length > 0) {
                    console.log(`Loaded ${syncedTracks.length} tracks after syncing from Gist`);
                    window.tracksData = syncedTracks;
                    storageTracksFound = true;
                }
            }
        } else {
            console.log('Storage service not available or isAvailable method missing, trying local storage directly...');
            
            // Try loading directly from localStorage as fallback
            try {
                const localTracks = localStorage.getItem('tracks');
                if (localTracks) {
                    const parsedTracks = JSON.parse(localTracks);
                    const tracksArray = Array.isArray(parsedTracks) ? parsedTracks : 
                                        (parsedTracks.tracks && Array.isArray(parsedTracks.tracks) ? parsedTracks.tracks : []);
                    
                    if (tracksArray.length > 0) {
                        console.log(`Loaded ${tracksArray.length} tracks directly from localStorage`);
                        window.tracksData = tracksArray;
                        storageTracksFound = true;
                    }
                }
            } catch (localError) {
                console.error('Error loading tracks from localStorage:', localError);
            }
        }
    } catch (error) {
        console.error('Error loading tracks from storage:', error);
        if (window.notificationService) {
            window.notificationService.show(
                'Storage Error', 
                'Failed to load tracks from storage. Using default tracks.',
                'warning',
                5000
            );
        }
    }
    
    // If no tracks found from any source, load from assets directory
    if (!storageTracksFound || window.tracksData.length === 0) {
        console.log('No tracks found from storage, attempting to scan assets directory...');
        const assetTracks = await scanAssetsDirectoryForTracks();
        if (assetTracks && assetTracks.length > 0) {
            window.tracksData = assetTracks;
            console.log(`Loaded ${assetTracks.length} tracks from assets directory`);
        } else {
            // If still no tracks, use sample tracks as absolute fallback
            console.log('No tracks found from any source, using sample tracks...');
            window.tracksData = [...sampleTracks];
            if (window.notificationService) {
                window.notificationService.show(
                    'Using Sample Tracks', 
                    'No tracks found from any source. Using sample tracks as fallback.',
                    'info',
                    5000
                );
            }
        }
    }
    
    // Set up global filteredTracks variable if it doesn't exist
    if (typeof window.filteredTracks === 'undefined') {
        window.filteredTracks = [...window.tracksData];
        console.log('Created global filteredTracks array');
    } else {
        window.filteredTracks.length = 0;
        window.tracksData.forEach(track => window.filteredTracks.push(track));
    }
    
    console.log(`Track loading complete. ${window.tracksData.length} tracks loaded.`);
    return window.tracksData;
}

// Update the scanAssetsDirectoryForTracks function to include progress updates
async function scanAssetsDirectoryForTracks() {
    console.log('Scanning assets/tracks directory for MP3 files...');
    updateTrackLoadingProgress(25, 'Scanning audio files', 'Checking for track files...');
    
    // Start with an empty array (not sample tracks)
    allTracks = []; 
    
    // Create a list of potential track filenames based on naming patterns we see in the directory
    const potentialTracks = [];
    
    // Add tracks for ID Music 1-16 based on the pattern seen in the assets directory
    for (let i = 1; i <= 16; i++) {
        potentialTracks.push({
            id: 100 + i, // Use IDs starting at 101 to avoid conflicts
            title: `ID Music ${i}`,
            artist: "TildeSoundArt",
            // We'll use the discovered filename patterns
            src: `assets/tracks/ID Music ${i}- (NEED_SCAN).mp3`,
            albumArt: "assets/images/Tilde_Logo.png",
            mood: ["energetic", "intense"],
            genre: ["electronic"],
            duration: "medium",
            needsFileDiscovery: true,
            index: i
        });
    }
    
    try {
        // Load known files from localStorage or JSON file
        updateTrackLoadingProgress(30, 'Loading known files', 'Checking for known audio files...');
        const knownFiles = await loadKnownFiles();
        
        // Create proper track entries for all known files
        knownFiles.forEach((file, index) => {
            // Show progress in batches to avoid too many updates
            if (index % 5 === 0) {
                const percent = 30 + Math.min(15, Math.floor((index / knownFiles.length) * 15));
                updateTrackLoadingProgress(percent, 'Processing known files', `Processing file ${index+1}/${knownFiles.length}: ${file.filename}`);
            }
            
            // Find any matching potential track
            const matchingTrack = potentialTracks.find(track => track.index === file.index);
            if (matchingTrack) {
                matchingTrack.src = `assets/tracks/${file.filename}`;
                matchingTrack.title = `ID Music ${file.index}- ${getTrackTitle(file.filename)}`;
                matchingTrack.needsFileDiscovery = false;
                
                // Assign appropriate mood and genre based on filename
                const trackInfo = assignMoodAndGenreFromFilename(file.filename);
                matchingTrack.mood = trackInfo.mood;
                matchingTrack.genre = trackInfo.genre;
                matchingTrack.duration = trackInfo.duration;
            }
        });
        
        // Add all discovered tracks to our list
        potentialTracks.forEach(track => {
            if (!track.needsFileDiscovery) {
                allTracks.push(track);
            }
        });
        
        console.log(`Found ${allTracks.length} tracks in the assets directory`);
        updateTrackLoadingProgress(45, 'Tracks discovered', `Found ${allTracks.length} tracks in assets directory`);
        
        // Test each track by trying to load it
        for (let i = 0; i < allTracks.length; i++) {
            if (i % 3 === 0) { // Update progress every 3 tracks
                const percent = 45 + Math.min(10, Math.floor((i / allTracks.length) * 10));
                updateTrackLoadingProgress(percent, 'Testing audio files', `Testing track ${i+1}/${allTracks.length}: ${allTracks[i].title}`);
            }
            await testTrackExists(allTracks[i]);
        }
    } catch (error) {
        console.error('Error loading known files:', error);
        updateTrackLoadingProgress(55, 'Error in track discovery', `Error: ${error.message}`);
        return [];
    }
}

// Function to test if a track file actually exists
async function testTrackExists(track) {
    if (!track.src) return;
    
    return new Promise(resolve => {
        const audio = new Audio();
        
        // Set a short timeout to avoid hanging if the file doesn't exist
        const timeout = setTimeout(() => {
            console.log(`Track file not found: ${track.src}`);
            track.fileExists = false;
            resolve(false);
        }, 500);
        
        audio.oncanplaythrough = () => {
            clearTimeout(timeout);
            console.log(`Track file exists: ${track.src}`);
            track.fileExists = true;
            resolve(true);
        };
        
        audio.onerror = () => {
            clearTimeout(timeout);
            console.log(`Track file load error: ${track.src}`);
            track.fileExists = false;
            resolve(false);
        };
        
        // Try to load the audio file
        try {
            audio.src = track.src;
            audio.load();
        }catch (e) {
            clearTimeout(timeout);
            console.error(`Error testing track: ${e}`);
            track.fileExists = false;
            resolve(false);
        }
    });
}

// Function to use sample tracks as a last resort
function useSampleTracksAsFallback() {
    console.log('No tracks found from any source, using sample tracks as fallback');
    
    // Use sample tracks
    allTracks = [...sampleTracks];
    
    // Also update tracksData directly
    tracksData = [...sampleTracks];
    
    showNotification('Using sample tracks as fallback', 'info');
}

// Extract a user-friendly title from the filename
function getTrackTitle(filename) {
    // Extract the part in parentheses
    const matches = filename.match(/\(([^)]+)\)/);
    if (matches && matches[1]) {
        return matches[1].replace(/_/g, ' ').trim();
    }
    return filename.split(' - ')[1] || filename;
}

// Assign mood and genre based on filename patterns
function assignMoodAndGenreFromFilename(filename) {
    const lowerFilename = filename.toLowerCase();
    const result = { 
        mood: ["energetic"],
        genre: ["electronic"],
        duration: "medium" 
    };
    
    // Detect mood
    if (lowerFilename.includes('chill') || lowerFilename.includes('lofi')) {
        result.mood = ["chill", "relaxed"];
    }else if (lowerFilename.includes('rock')) {
        result.mood = ["energetic", "intense"];
        result.genre = ["rock"];
    }else if (lowerFilename.includes('optimistic')) {
        result.mood = ["happy", "energetic"];
    }else if (lowerFilename.includes('funk')) {
        result.mood = ["energetic", "happy"];
        result.genre = ["funk"];
    }else if (lowerFilename.includes('piano')) {
        result.mood = ["chill", "focus"];
        result.genre = ["classical"];
    }else if (lowerFilename.includes('corporate')) {
        result.mood = ["focus", "energetic"];
        result.genre = ["electronic"];
    }else if (lowerFilename.includes('future') || lowerFilename.includes('futuristic')) {
        result.mood = ["focus", "energetic"];
        result.genre = ["electronic"];
    }else if (lowerFilename.includes('synthwave') || lowerFilename.includes('synthpop')) {
        result.mood = ["intense", "energetic"];
        result.genre = ["electronic"];
    }else if (lowerFilename.includes('hiphop')) {
        result.mood = ["energetic"];
        result.genre = ["hiphop"];
    }
    
    // Estimate duration based on typical song lengths
    result.duration = "medium"; // Default to 30 sec
    
    return result;
}

// Merge tracks without creating duplicates
function mergeTracksWithoutDuplicates(newTracks) {
    if (!newTracks || !Array.isArray(newTracks)) return;
    
    newTracks.forEach(newTrack => {
        // Check if this track already exists in our list
        const exists = allTracks.some(track => 
            track.id === newTrack.id || 
            (track.title === newTrack.title && track.artist === newTrack.artist)
        );
        
        if (!exists) {
            allTracks.push(newTrack);
        }
    });
}

// Process all tracks we've discovered and use them
function processAndUseDiscoveredTracks() {
    if (allTracks.length === 0) {
        console.log('No tracks discovered, using sample tracks as fallback');
        useSampleTracksAsFallback();
        return;
    }
    
    // Clean up any problematic src paths
    allTracks = cleanupTrackSrcPaths(allTracks);
    
    // Validate each track
    const validatedTracks = allTracks.filter(track => {
        const isValid = track && 
                       typeof track === 'object' && 
                       track.id && 
                       track.title && 
                       track.artist;
        
        if (!isValid) {
            console.error('Invalid track found:', track);
        }
        
        return isValid;
    });
    
    if (validatedTracks.length > 0) {
        tracksData = validatedTracks;
        console.log('Successfully loaded', validatedTracks.length, 'valid tracks');
        
        // Save these tracks back to storage to ensure consistency
        storageService.saveData('tracks', validatedTracks);
        
        // Also save as approvedTracks to ensure they're visible in the upload page
        storageService.saveData('approvedTracks', validatedTracks);
        
        // Show notification about the loaded tracks
        const newTrackCount = validatedTracks.length - tracksData.length;
        if (newTrackCount > 0) {
            showNotification(`Loaded ${validatedTracks.length}tracks (${newTrackCount} new)`);
        }else {
            showNotification(`Loaded ${validatedTracks.length}tracks from all sources`);
        }
    }else {
        console.error('No valid tracks found in loaded data');
        useSampleTracksAsFallback();
    }
}

// Function to clean up track src paths with problematic formats
function cleanupTrackSrcPaths(tracks) {
    if (!tracks || !Array.isArray(tracks)) return tracks;
    
    // Create a mapping of known tracks with their exact filenames
    const exactFilenameMappings = {
        "ID Music 2 - Technology F1": "ID Music 2 - (17c-Technology_F1).mp3",
        "ID Music 7 - TOGG ID MEDIA Funk": "ID Music 7 - (TOGG_ID MEDIA _Funk).mp3"
    };
    
    return tracks.map(track => {
        // Clone the track to avoid modifying the original
        const cleanTrack = {...track};
        
        // Special case for tracks with known exact filenames
        if (exactFilenameMappings[track.title]) {
            console.log(`Special handling for track: "${track.title}"`);
            const baseDir = cleanTrack.src ? cleanTrack.src.substring(0, cleanTrack.src.lastIndexOf('/') + 1) : 'assets/tracks/';
            cleanTrack.src = `${baseDir}${exactFilenameMappings[track.title]}`;
            console.log(`Updated track src to exact original filename: ${cleanTrack.src}`);
            return cleanTrack;
        }
        
        // Special case for the ID Music 2 track - always use the original filename with spaces and parentheses
        if (cleanTrack.title === "ID Music 2 - Technology F1" || 
            (cleanTrack.src && cleanTrack.src.includes("ID_Music_2_17cTechnology_F1"))) {
            
            console.log(`Special handling for ID Music 2 track`);
            const baseDir = cleanTrack.src ? cleanTrack.src.substring(0, cleanTrack.src.lastIndexOf('/') + 1) : 'assets/tracks/';
            cleanTrack.src = `${baseDir}ID Music 2 - (17c-Technology_F1).mp3`;
            console.log(`Updated track src to exact original filename: ${cleanTrack.src}`);
            return cleanTrack;
        }
        
        // Special case for ID Music 7 track
        if (cleanTrack.title === "ID Music 7 - TOGG ID MEDIA Funk" || 
            (cleanTrack.src && cleanTrack.src.includes("ID_Music_7_TOGG_ID_MEDIA__Funk"))) {
            
            console.log(`Special handling for ID Music 7 track`);
            const baseDir = cleanTrack.src ? cleanTrack.src.substring(0, cleanTrack.src.lastIndexOf('/') + 1) : 'assets/tracks/';
            cleanTrack.src = `${baseDir}ID Music 7 - (TOGG_ID MEDIA _Funk).mp3`;
            console.log(`Updated track src to exact original filename: ${cleanTrack.src}`);
            return cleanTrack;
        }
        
        // Check if the src has the problematic pattern
        if (cleanTrack.src && cleanTrack.src.includes('_Unknown_Artist_')) {
            console.log(`Cleaning up problematic track src: ${cleanTrack.src}`);
            
            // Extract the base name and directory
            const srcParts = cleanTrack.src.split('/');
            const fileName = srcParts[srcParts.length - 1];
            
            // Get the base directory (everything before the filename)
            const baseDir = srcParts.slice(0, -1).join('/');
            
            // Get the title part before _Unknown_Artist_
            const titlePart = fileName.split('_Unknown_Artist_')[0];
            
            // Create clean src path
            cleanTrack.src = `${baseDir}/${titlePart}.mp3`;
            console.log(`Updated track src to: ${cleanTrack.src}`);
        }
        
        return cleanTrack;
    });
}

// Add function to save tracks
async function saveTracksData() {
    try {
        // Use the storage service saveApprovedTracks method instead
        // This ensures tracks are saved to both tracks and approvedTracks collections
        await storageService.saveApprovedTracks(tracksData);
        console.log('Tracks saved successfully to both collections');
    }catch (error) {
        console.error('Error saving tracks:', error);
        
        // Fallback to direct localStorage save
        try {
            localStorage.setItem('tracks', JSON.stringify(tracksData));
            localStorage.setItem('approvedTracks', JSON.stringify(tracksData));
            console.log('Tracks saved to localStorage as fallback');
        } catch (localStorageError) {
            console.error('Failed to save tracks to any storage:', localStorageError);
        }
    }
}

// DOM Elements
// Player Controls
const albumArt = document.getElementById('album-art');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const prevBtn = document.getElementById('prev-btn');
const playBtn = document.getElementById('play-btn');
const nextBtn = document.getElementById('next-btn');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBar = document.querySelector('.progress');
const volumeSlider = document.getElementById('volume');

// Track Catalog
const tracksContainer = document.getElementById('tracks-container');

// Playlist
const playlistContainer = document.getElementById('playlist-container');
const clearPlaylistBtn = document.getElementById('clear-playlist-btn');
const downloadPlaylistBtn = document.getElementById('download-playlist-btn');

// Filters
const moodButtons = document.querySelectorAll('.mood-btn');
const genreButtons = document.querySelectorAll('.genre-btn');
const durationButtons = document.querySelectorAll('.duration-btn');

// Audio Object
let audio = new Audio();

// App State
let currentTrack = null;
let currentTrackIndex = 0;
let isPlaying = false;
let playlist = [];
// Will be populated in initPlayer - reusing the variable declared at line 27
filteredTracks = []; 

// Initialize player with embedded audio only when needed as fallback
function initializeWithEmbeddedAudio() {
    console.log("Setting up embedded audio fallbacks");
    
    // Don't replace the sources upfront, just save the embedded audio for fallback use later
    tracksData.forEach(track => {
        // Set a fallback property instead of replacing the src
        track.fallbackSrc = embeddedAudioData;
    });
}

/**
 * Initialize the player
 */
function initPlayer() {
    console.log('Initializing player...');

    // Get DOM references
    let playerAudioElement = document.getElementById('audio');
    let playerProgressSlider = document.querySelector('.progress-slider');
    let playerVolumeSlider = document.querySelector('.volume-slider');
    let playerCurrentTimeElement = document.querySelector('.current-time');
    let playerDurationElement = document.querySelector('.duration');
    
    // Check if audio element exists
    if (!playerAudioElement) {
        console.error('Audio element not found');
        return;
    }
    
    // Connect our audio variable to the audio element
    audio = playerAudioElement;
    
    // Set initial volume
    if (playerVolumeSlider) {
        const savedVolume = parseFloat(localStorage.getItem('volume') || '0.7');
        audio.volume = savedVolume;
        playerVolumeSlider.value = savedVolume;
    }
    
    // Add event listeners
    if (audio) {
        // Playback events
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleTrackEnd);
        audio.addEventListener('play', () => updatePlayPauseState(true));
        audio.addEventListener('pause', () => updatePlayPauseState(false));
        audio.addEventListener('error', handleAudioError);
        
        // Loading events
        audio.addEventListener('loadstart', () => console.log('Audio loading started'));
        audio.addEventListener('canplay', () => {
            console.log('Audio can start playing');
            updateDuration();
        });
        audio.addEventListener('waiting', () => console.log('Audio buffering...'));
    }

    // Progress slider
    if (playerProgressSlider) {
        playerProgressSlider.addEventListener('input', seekTrack);
        playerProgressSlider.addEventListener('change', seekTrack);
    }

    // Volume slider 
    if (playerVolumeSlider) {
        playerVolumeSlider.addEventListener('input', () => {
            setVolume(parseFloat(playerVolumeSlider.value));
        });
    }

    // Play/Pause button
    const playPauseBtn = document.querySelector('.play-pause-btn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    // Next/Previous buttons
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) prevBtn.addEventListener('click', playPreviousTrack);
    if (nextBtn) nextBtn.addEventListener('click', playNextTrack);
    
    // Check for any currently playing track
    const lastPlayedTrackId = localStorage.getItem('currentTrackId');
    const lastPlayedPosition = parseFloat(localStorage.getItem('currentTrackPosition') || '0');
    
    if (lastPlayedTrackId) {
        // Find the track in our data
        const trackIndex = tracksData.findIndex(track => track.id === lastPlayedTrackId);
        if (trackIndex !== -1) {
            console.log('Resuming last played track:', tracksData[trackIndex].title);
            loadTrack(trackIndex);
            
            // Set the playback position
            audio.currentTime = lastPlayedPosition;
        }else {
            // If track not found, load the first track
            if (tracksData.length > 0) {
                loadTrack(0);
            }
        }
    }else if (tracksData.length > 0) {
        // Load the first track if no last played track
        loadTrack(0);
    }
    
    // Update track list UI
    renderTrackList();
    
    console.log('Player initialization complete');
}

/**
 * Handles the end of track playback, moves to next track
 */
function handleTrackEnd() {
    console.log('Track ended, playing next track');
    playNextTrack();
}

// Display retry attempt information to the user
function showRetryAttempt(track, attemptNumber, maxRetries) {
    const message = `Retry ${attemptNumber}/${maxRetries}: Attempting to load "${track.title}"`;
    console.log(message);
    
    const playerNotification = document.getElementById('player-notification');
    if (playerNotification) {
        playerNotification.textContent = message;
        playerNotification.classList.add('show');
        
        // Hide the notification after 3 seconds
        setTimeout(() => {
            playerNotification.classList.remove('show');
        }, 3000);
    }else {
        // Create notification element if it doesn't exist
        const notification = document.createElement('div');
        notification.id = 'player-notification';
        notification.className = 'player-notification show';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Add styles if they don't exist
        if (!document.getElementById('player-notification-style')) {
            const style = document.createElement('style');
            style.id = 'player-notification-style';
            style.textContent = `
                .player-notification {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 30px;
                    font-size: 14px;
                    max-width: 80%;
                    text-align: center;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                
                .player-notification.show {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Hide the notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

/**
 * Handles audio playback errors by implementing retry logic and fallback
 * to embedded audio when available
 */
function handleAudioError(error) {
    const currentTrack = tracksData[currentTrackIndex];
    
    if (!currentTrack) {
        console.error('Cannot handle audio error: No current track');
        showNotification('Error playing track', 'error');
        return;
    }
    
    console.error(`Error playing track "${currentTrack.title}":`, error);
    
    // Create a mapping of track titles to their exact filenames
    const trackMappings = {
        "ID Music 2 - Technology F1": {
            exact: "ID Music 2 - (17c-Technology_F1).mp3",
            simplified: "ID_Music_2_17cTechnology_F1.mp3"
        },
        "ID Music 7 - TOGG ID MEDIA Funk": {
            exact: "ID Music 7 - (TOGG_ID MEDIA _Funk).mp3",
            simplified: "ID_Music_7_TOGG_ID_MEDIA__Funk.mp3"
        }
    };
    
    // Special case for known tracks with exact filenames
    if (currentTrack.title in trackMappings) {
        console.log(`Special handling for track "${currentTrack.title}" error`);
        
        // Get base directory from current src
        const baseDir = currentTrack.src.substring(0, currentTrack.src.lastIndexOf('/') + 1);
        const mapping = trackMappings[currentTrack.title];
        
        // Determine which filename format to try
        let newSrc;
        if (currentTrack.src.includes(mapping.exact)) {
            // Currently using exact filename, try simplified
            newSrc = `${baseDir}${mapping.simplified}`;
            console.log(`Trying simplified filename: ${newSrc}`);
        }else {
            // Try the exact filename with spaces and parentheses
            newSrc = `${baseDir}${mapping.exact}`;
            console.log(`Trying exact filename: ${newSrc}`);
        }
        
        // Update the track's src
        currentTrack.src = newSrc;
        setAudioSource(currentTrack);
        playTrack();
        return;
    }
    
    // Initialize retry count if it doesn't exist
    if (typeof currentTrack.retryCount === 'undefined') {
        currentTrack.retryCount = 0;
    }
    
    // Try again a few times before giving up
    if (currentTrack.retryCount < MAX_RETRY_ATTEMPTS) {
        currentTrack.retryCount++;
        console.log(`Retry attempt ${currentTrack.retryCount}for track "${currentTrack.title}"`);
        
        // Short delay before retrying
        setTimeout(() => {
            if (!currentTrack.usingFallback && currentTrack.embeddedAudio) {
                // Try fallback to embedded audio if available
                console.log(`Switching to embedded audio for "${currentTrack.title}"`);
                currentTrack.usingFallback = true;
                setAudioSource(currentTrack);
                playTrack();
            }else if (currentTrack.filePath) {
                // Just retry with the same source
                console.log(`Retrying same source for "${currentTrack.title}"`);
                setAudioSource(currentTrack);
                playTrack();
            }else {
                showNotification('Unable to play track', 'error');
                console.error('No valid audio source available for track');
            }
        }, 1000);
    }else {
        // Give up after MAX_RETRY_ATTEMPTS
        console.error(`Failed to play track "${currentTrack.title}" after ${MAX_RETRY_ATTEMPTS}attempts`);
        showNotification(`Unable to play "${currentTrack.title}" after multiple attempts`, 'error');
        
        // Move to next track
        nextTrack();
    }
}

/**
 * Sets the audio source based on available track data
 */
function setAudioSource(track) {
    if (!track) return false;
    
    try {
        // Log the track information for debugging
        console.log(`Setting audio source for track: "${track.title}" with src: ${track.src}`);
        
        // Create a mapping of track titles to their exact filenames
        const exactFilenameMappings = {
            "ID Music 2 - Technology F1": "ID Music 2 - (17c-Technology_F1).mp3",
            "ID Music 7 - TOGG ID MEDIA Funk": "ID Music 7 - (TOGG_ID MEDIA _Funk).mp3"
        };
        
        // Create a mapping of incorrect src patterns to their correct replacements
        const srcPatternMappings = {
            "ID_Music_2_17cTechnology_F1": "ID Music 2 - (17c-Technology_F1)",
            "ID_Music_7_TOGG_ID_MEDIA__Funk": "ID Music 7 - (TOGG_ID MEDIA _Funk)"
        };
        
        // Special case for ID Music tracks - check if files exist in the assets directory
        if (track.title && track.title.startsWith("ID Music ")) {
            const trackNumber = parseInt(track.title.split(" ")[2]);
            if (!isNaN(trackNumber) && trackNumber >= 1 && trackNumber <= 16) {
                // We know this is one of our ID Music tracks, try to set its source correctly
                const baseDir = "assets/tracks/";
                
                // Try to find the correct filename based on the list of known files
                const knownFiles = [
                    { index: 1, filename: "ID Music 1 - (TOGG_ID MEDIA _padfuturebass 2).mp3" },
                    { index: 2, filename: "ID Music 2 - (17c-Technology_F1).mp3" },
                    { index: 3, filename: "ID Music 3 - (14. TOGG_ID MEDIA _Piano3).mp3" },
                    { index: 4, filename: "ID Music 4 - (9c-Lofi_F1).mp3" },
                    { index: 5, filename: "ID Music 5 - (16c-StompRock_F1).mp3" },
                    { index: 6, filename: "ID Music 6 - (ID_SYNTHPOP_60) 1.mp3" },
                    { index: 7, filename: "ID Music 7 - (TOGG_ID MEDIA _Funk).mp3" },
                    { index: 8, filename: "ID Music 8 - (1c-Corporate_F1).mp3" },
                    { index: 9, filename: "ID Music 9 - (5c-Optimistic_F1).mp3" },
                    { index: 10, filename: "ID Music 10 - (ID_FUTURISTIC_SPACEY) 1.mp3" },
                    { index: 11, filename: "ID Music 11 - (10c-Logo Synth_Ney_F1).mp3" },
                    { index: 12, filename: "ID Music 12 - (2c-Future Bass_F1).mp3" },
                    { index: 13, filename: "ID Music 13 - (Rock1).mp3" },
                    { index: 14, filename: "ID Music 14 - (Synthwave_1).mp3" },
                    { index: 15, filename: "ID Music 15 - (Corp.Hiphop1).mp3" },
                    { index: 16, filename: "ID Music 16 - (Corp.Hiphop2).mp3" }
                ];
                
                const knownFile = knownFiles.find(file => file.index === trackNumber);
                if (knownFile) {
                    const exactFilename = `${baseDir}${knownFile.filename}`;
                    console.log(`Setting exact filename for ID Music ${trackNumber}: ${exactFilename}`);
                    
                    // Update the track's src to the exact filename
                    track.src = exactFilename;
                    audio.src = exactFilename;
                    return true;
                }
            }
        }
        
        // Continue with the normal logic for other tracks
        if (track.usingFallback && track.embeddedAudio) {
            // Use embedded audio as fallback
            audio.src = track.embeddedAudio;
            console.log(`Using embedded audio for track "${track.title}"`);
            return true;
        }else if (track.usingFallback && track.fallbackSrc) {
            // Use fallback source
            audio.src = track.fallbackSrc;
            console.log(`Using fallback source for track "${track.title}"`);
            return true;
        }else if (track.filePath) {
            // Use file path as primary source
            audio.src = track.filePath;
            console.log(`Using file path for track "${track.title}": ${track.filePath}`);
            return true;
        }else if (track.src) {
            // Check if the src contains any potential issues
            if (track.src.includes('_Unknown_Artist_')) {
                // Fix the src path on the fly
                const srcParts = track.src.split('/');
                const fileName = srcParts[srcParts.length - 1];
                const baseDir = srcParts.slice(0, -1).join('/');
                const titlePart = fileName.split('_Unknown_Artist_')[0];
                
                // Update the track's src to the fixed version
                track.src = `${baseDir}/${titlePart}.mp3`;
                console.log(`Fixed track src path on the fly to: ${track.src}`);
            }
            
            // Check if track title has a known exact filename mapping
            if (exactFilenameMappings[track.title]) {
                const baseDir = track.src.substring(0, track.src.lastIndexOf('/') + 1);
                const correctedSrc = `${baseDir}${exactFilenameMappings[track.title]}`;
                console.log(`Trying mapped filename: ${correctedSrc}`);
                
                // Save original src in case we need to revert
                track.originalSrc = track.src;
                track.src = correctedSrc;
            }else {
                // Check if src contains any known incorrect patterns
                for (const [pattern, replacement] of Object.entries(srcPatternMappings)) {
                    if (track.src.includes(pattern)) {
                        const baseDir = track.src.substring(0, track.src.lastIndexOf('/') + 1);
                        const correctedSrc = `${baseDir}${replacement}.mp3`;
                        console.log(`Correcting src pattern from ${pattern}to ${replacement}: ${correctedSrc}`);
                        
                        // Save original src
                        track.originalSrc = track.src;
                        track.src = correctedSrc;
                        break;
                    }
                }
            }
            
            // Use the src property
            audio.src = track.src;
            console.log(`Using src for track "${track.title}": ${track.src}`);
            
            // For specific tracks, also set up an error handler to try alternative paths
            const knownTracks = ["ID Music 2 - Technology F1", "ID Music 7 - TOGG ID MEDIA Funk"];
            if (knownTracks.includes(track.title) || 
                Object.values(srcPatternMappings).some(pattern => track.src.includes(pattern))) {
                
                // Add one-time error listener to try alternative src if this one fails
                const errorHandler = function() {
                    console.log("Track load failed, trying alternative filename...");
                    
                    // Remove this listener to avoid loops
                    audio.removeEventListener('error', errorHandler);
                    
                    // Try the alternative filename
                    const baseDir = track.src.substring(0, track.src.lastIndexOf('/') + 1);
                    let alternativeSrc;
                    
                    // If the track has a simplified name pattern, try the original with spaces and parentheses
                    const isSimplified = Object.keys(srcPatternMappings).some(pattern => track.src.includes(pattern));
                    const isExact = Object.values(srcPatternMappings).some(pattern => track.src.includes(pattern));
                    
                    if (isExact) {
                        // Currently using exact name with spaces and parentheses, try simplified
                        for (const [simplified, exact] of Object.entries(srcPatternMappings)) {
                            if (track.src.includes(exact)) {
                                alternativeSrc = `${baseDir}${simplified}.mp3`;
                                break;
                            }
                        }
                    }else if (isSimplified) {
                        // Currently using simplified, try exact with spaces and parentheses
                        for (const [simplified, exact] of Object.entries(srcPatternMappings)) {
                            if (track.src.includes(simplified)) {
                                alternativeSrc = `${baseDir}${exact}.mp3`;
                                break;
                            }
                        }
                    }else if (track.title in exactFilenameMappings) {
                        // Use known mapping from title
                        alternativeSrc = `${baseDir}${exactFilenameMappings[track.title]}`;
                    }
                    
                    if (!alternativeSrc) {
                        console.log("No alternative src found, giving up");
                        return;
                    }
                    
                    console.log(`Trying alternative src: ${alternativeSrc}`);
                    audio.src = alternativeSrc;
                    audio.load();
                };
                
                audio.addEventListener('error', errorHandler, { once: true });
            }
            
            return true;
        }else if (track.embeddedAudio) {
            // Use embedded audio as primary if no file path
            track.usingFallback = true;
            audio.src = track.embeddedAudio;
            console.log(`Using embedded audio for track "${track.title}" (no file path available)`);
            return true;
        }else if (track.fallbackSrc) {
            // Use fallback src as last resort
            track.usingFallback = true;
            audio.src = track.fallbackSrc;
            console.log(`Using fallback source for track "${track.title}" (no other source available)`);
            return true;
        }
        
        console.error(`No valid audio source found for track: ${track.title}`);
        return false;
    }catch (error) {
        console.error('Error setting audio source:', error);
        return false;
    }
}

// Update the visual indicator for the currently playing track
function updateCurrentTrackIndicator() {
    // Remove 'now-playing' class from all track items
    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('now-playing');
        
        // Also update the play button icon
        const playBtn = item.querySelector('.play-track-btn i');
        if (playBtn) {
            playBtn.className = 'fas fa-play';
        }
    });
    
    // Add 'now-playing' class to current track
    if (currentTrack) {
        const currentTrackItem = document.querySelector(`.track-item[data-track-id="${currentTrack.id}"]`);
        if (currentTrackItem) {
            currentTrackItem.classList.add('now-playing');
            
            // Update the play button to show pause icon if playing
            if (isPlaying) {
                const playBtn = currentTrackItem.querySelector('.play-track-btn i');
                if (playBtn) {
                    playBtn.className = 'fas fa-pause';
                }
            }
        }
    }
}

// Display a notification when fallback audio is used
function showFallbackIndicator(message = 'Using embedded audio') {
    const fallbackIndicator = document.getElementById('fallback-indicator');
    
    if (!fallbackIndicator) {
        // Create the indicator if it doesn't exist
        const indicator = document.createElement('div');
        indicator.id = 'fallback-indicator';
        indicator.className = 'fallback-indicator';
        
        const content = document.createElement('div');
        content.className = 'fallback-content';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-triangle';
        content.appendChild(icon);
        
        const text = document.createElement('span');
        text.className = 'fallback-text';
        text.textContent = message;
        content.appendChild(text);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'fallback-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(indicator);
        });
        content.appendChild(closeBtn);
        
        indicator.appendChild(content);
        document.body.appendChild(indicator);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                indicator.classList.add('fade-out');
                setTimeout(() => {
                    if (document.body.contains(indicator)) {
                        document.body.removeChild(indicator);
                    }
                }, 1000);
            }
        }, 5000);
    }else {
        // Update existing indicator
        const textElement = fallbackIndicator.querySelector('.fallback-text');
        if (textElement) {
            textElement.textContent = message;
        }
        
        // Reset the auto-hide timer
        fallbackIndicator.classList.remove('fade-out');
        clearTimeout(fallbackIndicator.hideTimeout);
        fallbackIndicator.hideTimeout = setTimeout(() => {
            fallbackIndicator.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(fallbackIndicator)) {
                    document.body.removeChild(fallbackIndicator);
                }
            }, 1000);
        }, 5000);
    }
    
    // Add CSS if it doesn't exist
    if (!document.getElementById('fallback-indicator-style')) {
        const style = document.createElement('style');
        style.id = 'fallback-indicator-style';
        style.textContent = `
            .fallback-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                z-index: 1000;
                max-width: 300px;
                animation: slide-in 0.3s ease-out;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .fallback-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .fallback-text {
                flex: 1;
                font-size: 14px;
            }
            
            .fallback-close {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 0 5px;
            }
            
            .fallback-indicator.fade-out {
                opacity: 0;
                transition: opacity 1s;
            }
            
            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Find a suitable fallback track if the current one fails to load
 * @returns {number|null}- The index of a fallback track or null if none available
 */
function findFallbackTrack() {
    // First try sample tracks with embedded audio
    for (let i = 0; i < tracksData.length; i++) {
        const track = tracksData[i];
        // Skip the current track since it's already failing
        if (currentTrackIndex === i) continue;
        
        // Look for a track with a src that's not starting with @audio/ 
        // and has a fallbackSrc
        if (track.src && 
            !track.src.startsWith('@audio/') && 
            track.fallbackSrc) {
            return i;
        }
    }
    
    // If no suitable track with embedded audio, try any track
    for (let i = 0; i < tracksData.length; i++) {
        if (currentTrackIndex === i) continue;
        return i;
    }
    
    // If still nothing, just return 0 if it's not the current track
    return currentTrackIndex === 0 ? 1 : 0;
}

// Play the current track
function playTrack() {
    if (!currentTrack) {
        console.error('No track loaded');
        return;
    }
    
    console.log(`Attempting to play track: ${currentTrack.title}by ${currentTrack.artist}`);
    
    // Check if the audio is loaded
    if (audio.readyState === 0) {
        console.log('Audio not loaded yet, loading first...');
        loadTrack(currentTrackIndex);
    }
    
    // Play the audio with error handling
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Playback started successfully
            console.log('Playback started successfully');
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            updateCurrentTrackIndicator();
        }).catch(error => {
            // Playback failed for some reason
            console.error('Error during playback:', error);
            
            // If the error is related to the audio source, try the fallback
            if (error.name === 'NotSupportedError' || error.name === 'NotFoundError' || 
                error.message.includes('source') || error.message.includes('load')) {
                
                // Try using fallback if available
                if (currentTrack.fallbackSrc) {
                    console.log('Using fallback audio source');
                    audio.src = currentTrack.fallbackSrc;
                    audio.load();
                    
                    // Try playing again
                    setTimeout(() => {
                        audio.play().catch(err => {
                            console.error('Fallback playback failed:', err);
                            showFallbackIndicator('Failed to play audio even with fallback');
                        });
                    }, 500);
                }else {
                    // Try a different track
                    const fallbackTrack = findFallbackTrack();
                    if (fallbackTrack) {
                        console.log('Trying a different track as fallback');
                        loadTrack(fallbackTrack);
                        playTrack();
                    }else {
                        console.error('No fallback track available');
                        showFallbackIndicator('Unable to play any tracks. Check your audio files.');
                    }
                }
            }
        });
    }
}

// Pause the current track
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateCurrentTrackIndicator(); // Update indicator when paused
}

// Toggle play/pause
function togglePlayPause() {
    if (isPlaying) {
        pauseTrack();
    }else {
        playTrack();
    }
}

// Scroll to the currently playing track
function scrollToCurrentTrack() {
    // Find the currently playing track element
    const currentTrackItem = document.querySelector('.track-item.now-playing');
    
    if (currentTrackItem) {
        // Scroll the track into view with smooth behavior
        currentTrackItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Add a brief highlight effect
        currentTrackItem.classList.add('highlight-scroll');
        setTimeout(() => {
            currentTrackItem.classList.remove('highlight-scroll');
        }, 1000);
    }
}

// Play the next track
function playNext() {
    if (filteredTracks.length > 0) {
        let currentIndex = filteredTracks.findIndex(track => track.id === currentTrack?.id);
        
        if (currentIndex === -1 || currentIndex === filteredTracks.length - 1) {
            // If track not in filtered tracks or last track, play first
            loadTrack(filteredTracks[0]);
        }else {
            // Play next track
            loadTrack(filteredTracks[currentIndex + 1]);
        }
        
        playTrack();
        
        // Scroll to the track after a short delay to ensure the UI has updated
        setTimeout(scrollToCurrentTrack, 300);
    }else {
        console.error('No tracks available to play');
    }
}

// Play the previous track
function playPrevious() {
    if (filteredTracks.length > 0) {
        let currentIndex = filteredTracks.findIndex(track => track.id === currentTrack?.id);
        
        if (currentIndex === -1 || currentIndex === 0) {
            // If track not in filtered tracks or first track, play last
            loadTrack(filteredTracks[filteredTracks.length - 1]);
        }else {
            // Play previous track
            loadTrack(filteredTracks[currentIndex - 1]);
        }
        
        playTrack();
        
        // Scroll to the track after a short delay to ensure the UI has updated
        setTimeout(scrollToCurrentTrack, 300);
    }else {
        console.error('No tracks available to play');
    }
}

// Update progress bar
function updateProgress() {
    const currentTime = audio.currentTime;
    const duration = audio.duration || 0;
    
    // Update progress bar width
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    // Update current time display
    currentTimeEl.textContent = formatTime(currentTime);
}

// Update duration display
function updateDuration() {
    durationEl.textContent = formatTime(audio.duration);
}

// Format time in MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Update volume
function updateVolume() {
    audio.volume = volumeSlider.value;
}

// Add to playlist
function addToPlaylist(track) {
    // Check if the track is already in the playlist
    const isInPlaylist = playlist.some(item => item.id === track.id);
    if (isInPlaylist) {
        showNotification("Track is already in your collection");
        return;
    }
    
    playlist.push(track);
    renderPlaylist();
    savePlaylist();
    
    showNotification(`Added "${track.title}" to your collection`);
}

// Remove from playlist
function removeFromPlaylist(index) {
    playlist.splice(index, 1);
    renderPlaylist();
    savePlaylist();
    
    showNotification("Track removed from your collection");
}

// Clear playlist
function clearPlaylist() {
    if (confirm("Are you sure you want to clear your entire collection?")) {
        playlist = [];
        renderPlaylist();
        savePlaylist();
        
        showNotification("Collection cleared");
    }
}

// Save playlist to storage
async function savePlaylist() {
    try {
        await storageService.saveData('playlist', playlist);
        console.log('Playlist saved to storage');
    }catch (error) {
        console.error('Error saving playlist:', error);
    }
}

// Load playlist from storage
async function loadPlaylist() {
    try {
        const savedPlaylist = await storageService.loadData('playlist');
        if (savedPlaylist && Array.isArray(savedPlaylist)) {
            playlist = savedPlaylist;
            console.log('Loaded playlist from storage:', playlist.length, 'tracks');
        }
    }catch (error) {
        console.error('Error loading playlist:', error);
    }
}

// Download playlist as a text file
function downloadPlaylist() {
    if (playlist.length === 0) return;
    
    // Create a dialog to confirm download
    const dialog = document.createElement('div');
    dialog.className = 'download-dialog';
    
    // Create track listing
    let trackListing = '';
    playlist.forEach((track, index) => {
        trackListing += `<div class="dialog-track-item">
            <span class="dialog-track-number">${index + 1}.</span>
            <span class="dialog-track-title">${track.title}</span>
            <span class="dialog-track-artist">by ${track.artist}</span>
        </div>`;
    });
    
    // Build the dialog content
    dialog.innerHTML = `
        <div class="download-dialog-content">
            <h3>Are you ready to download?</h3>
            <div class="dialog-track-listing">
                <h4>Track listing:</h4>
                <div class="dialog-tracks-container">
                    ${trackListing}
                </div>
            </div>
            <div class="dialog-buttons">
                <button id="cancel-download-btn">Cancel</button>
                <button id="download-list-btn">Download List</button>
                <button id="download-tracks-btn">Download Tracks</button>
            </div>
        </div>
    `;
    
    // Add the dialog to the document
    document.body.appendChild(dialog);
    
    // Add event listeners to buttons
    document.getElementById('cancel-download-btn').addEventListener('click', () => {
        dialog.remove();
    });
    
    // Download List button - downloads a text file with track information
    document.getElementById('download-list-btn').addEventListener('click', () => {
        // Proceed with download of the track list
        const playlistText = playlist.map((track, index) => 
            `${index + 1}. ${track.title}- ${track.artist}`
        ).join('\n');
        
        const blob = new Blob([playlistText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_collection_list.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show a notification
        showNotification('Collection list downloaded successfully');
    });
    
    // Download Tracks button - prepares tracks for download
    document.getElementById('download-tracks-btn').addEventListener('click', () => {
        // Show loading notification
        showNotification('Preparing tracks for download...');
        
        // Create a more interactive panel for downloading tracks
        const notification = document.createElement('div');
        notification.className = 'notification-large track-download-panel';
        
        // Generate track download buttons HTML
        let trackDownloadButtons = '';
        playlist.forEach((track, index) => {
            const downloadableTrack = track.src && !track.src.startsWith('data:') ? track : null;
            const buttonClass = downloadableTrack ? 'track-download-btn' : 'track-download-btn disabled';
            const buttonTitle = downloadableTrack ? 'Click to download this track' : 'This track cannot be downloaded directly';
            
            trackDownloadButtons += `
                <div class="downloadable-track-item">
                    <div class="downloadable-track-info">
                        <span class="dialog-track-number">${index + 1}.</span>
                        <span class="dialog-track-title">${track.title}</span>
                        <span class="dialog-track-artist">by ${track.artist}</span>
                    </div>
                    <button class="${buttonClass}" 
                        data-track-id="${track.id}" 
                        data-src="${downloadableTrack ? track.src : ''}"
                        data-filename="${track.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3"
                        title="${buttonTitle}">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
        });
        
        // Build the download panel content
        notification.innerHTML = `
            <h4>Track Download</h4>
            <p>Click on the download buttons next to each track to download them individually:</p>
            
            <div class="downloadable-tracks-container">
                ${trackDownloadButtons}
            </div>
            
            <div class="download-panel-info">
                <p><i class="fas fa-info-circle"></i> Due to browser limitations, tracks must be downloaded one at a time.</p>
            </div>
            
            <div class="download-panel-buttons">
                <button id="close-download-panel-btn">Close</button>
            </div>
        `;
        
        // Add the panel to the document
        document.body.appendChild(notification);
        
        // Add event listener to close button
        document.getElementById('close-download-panel-btn').addEventListener('click', () => {
            notification.remove();
        });
        
        // Add event listeners to track download buttons
        const downloadButtons = notification.querySelectorAll('.track-download-btn:not(.disabled)');
        downloadButtons.forEach(button => {
            button.addEventListener('click', () => {
                const trackId = button.dataset.trackId;
                const filename = button.dataset.filename;
                const src = button.dataset.src;
                
                // Find the track from the playlist
                const track = playlist.find(t => t.id.toString() === trackId);
                
                if (track) {
                    downloadTrack(track, filename);
                    button.classList.add('downloaded');
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.title = 'Track downloaded';
                }
            });
        });
        
        // Remove the dialog
        dialog.remove();
    });
}

// Function to download a single track
function downloadTrack(track, filename) {
    // Check what type of source we have
    if (!track.src) {
        showNotification('Track has no audio source available', 5000);
        return;
    }
    
    // For @audio paths, we need to handle differently due to CORS restrictions
    if (track.src.startsWith('@audio/')) {
        // Get the clean path without the @audio prefix
        const localPath = track.src.replace('@audio/', '');
        
        // Create a notification with file location details
        const notification = document.createElement('div');
        notification.className = 'notification-large';
        
        // Get the full path for display
        const fullPath = window.location.pathname.replace('index.html', '@audio/' + localPath);
        
        notification.innerHTML = `
            <h4>File Location</h4>
            <p>Due to browser security restrictions, this file cannot be downloaded directly through JavaScript.</p>
            
            <div class="manual-access-instructions">
                <p><strong>To access this file:</strong></p>
                <ol>
                    <li>Navigate to your music player folder at:<br>
                    <code>${window.location.pathname.replace('index.html', '')}</code></li>
                    <li>Open the <code>@audio</code> directory</li>
                    <li>Find and use the file: <code>${localPath}</code></li>
                </ol>
                
                <div class="file-path-box">
                    <p>Full path:</p>
                    <code>${fullPath}</code>
                </div>
            </div>
            
            <button id="close-instructions-btn">Close</button>
        `;
        
        document.body.appendChild(notification);
        
        // Add event listener to close button
        document.getElementById('close-instructions-btn').addEventListener('click', () => {
            notification.remove();
        });
        
        console.log(`File path for manual access: ${fullPath}`);
        return;
    }
    
    // Check if we're dealing with a blob URL, regular URL, or data URI
    if (track.src.startsWith('blob:')) {
        // For blob URLs, we need to fetch the blob and then create a download
        fetch(track.src)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                triggerDownload(url, filename);
                URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error downloading blob track:', error);
                showNotification('Failed to download track. Try accessing it from the file system.', 5000);
            });
    }
    else if (track.src.startsWith('data:')) {
        // For data URIs, we can download directly
        triggerDownload(track.src, filename);
    }
    else {
        // For regular URLs, try to download directly
        triggerDownload(track.src, filename);
    }
}

// Helper function to trigger a download
function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification(`Downloading: ${filename}`);
}

// Toggle filter button active state
function toggleFilterButton(button, filterType) {
    button.classList.toggle('active');
    
    // If user is deselecting the last active filter, remove active class from all
    const activeFilters = document.querySelectorAll(`.${filterType}-btn.active`);
    if (activeFilters.length === 0) {
        document.querySelectorAll(`.${filterType}-btn`).forEach(btn => {
            btn.classList.remove('active');
        });
    }
}

// Apply filters to tracks
function applyFilters() {
    const activeMoodFilters = Array.from(document.querySelectorAll('.mood-btn.active'))
        .map(btn => btn.dataset.mood);
    
    const activeGenreFilters = Array.from(document.querySelectorAll('.genre-btn.active'))
        .map(btn => btn.dataset.genre);
    
    const activeDurationFilters = Array.from(document.querySelectorAll('.duration-btn.active'))
        .map(btn => btn.dataset.duration);
    
    filteredTracks = tracksData.filter(track => {
        // If no mood filters selected, pass mood check
        const passMoodFilter = activeMoodFilters.length === 0 || 
            track.mood.some(mood => activeMoodFilters.includes(mood));
        
        // If no genre filters selected, pass genre check
        const passGenreFilter = activeGenreFilters.length === 0 || 
            track.genre.some(genre => activeGenreFilters.includes(genre));
        
        // If no duration filters selected, pass duration check
        const passDurationFilter = activeDurationFilters.length === 0 || 
            activeDurationFilters.includes(track.duration);
        
        return passMoodFilter && passGenreFilter && passDurationFilter;
    });
    
    renderTracks(filteredTracks);
    
    // Update current track indicator after rendering tracks
    if (currentTrack) {
        updateCurrentTrackIndicator();
    }
}

// Set up drag and drop for playlist
function setupDragAndDrop() {
    const playlistItems = document.querySelectorAll('.playlist-item');
    
    playlistItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    
    if (draggedItem !== this) {
        // Get indices of items
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        
        // Reorder playlist array
        const movedItem = playlist[fromIndex];
        playlist.splice(fromIndex, 1);
        playlist.splice(toIndex, 0, movedItem);
        
        // Re-render playlist
        renderPlaylist();
    }
    
    return false;
}

function handleDragEnd(e) {
    playlistItems.forEach(item => {
        item.classList.remove('drag-over', 'dragging');
    });
}

// Show a notification message
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Make the notification visible
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove the notification after a delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize the player when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('TildeSoundArt Player v2 - Initializing...');
    
    // Verify all required DOM elements exist before proceeding
    const requiredElements = {
        albumArt: document.getElementById('album-art'),
        trackTitle: document.getElementById('track-title'),
        trackArtist: document.getElementById('track-artist'),
        prevBtn: document.getElementById('prev-btn'),
        playBtn: document.getElementById('play-btn'),
        nextBtn: document.getElementById('next-btn'),
        tracksContainer: document.getElementById('tracks-container'),
        playlistContainer: document.getElementById('playlist-container'),
        progressBar: document.querySelector('.progress'),
        volumeSlider: document.getElementById('volume')
    };
    
    // Log DOM elements to check if they're found
    console.log('Player DOM elements:', requiredElements);
    
    // Check if any required elements are missing
    const missingElements = Object.entries(requiredElements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);
    
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        alert('Error: Some UI elements are missing. The player may not work correctly.');
    }
    
    // Ensure the storage service is properly initialized
    if (window.storageService) {
        console.log('Storage service found, synchronizing track collections...');
        try {
            await window.storageService.syncTrackCollections();
        } catch (error) {
            console.error('Error synchronizing track collections:', error);
        }
    } else {
        console.warn('Storage service not found, track synchronization may not work properly');
    }
    
    // First try to load tracks from storage and directory
    await loadUploadedTracks();
    
    // Make sure filteredTracks is populated with all available tracks
    if (filteredTracks.length === 0 && tracksData.length > 0) {
        filteredTracks = [...tracksData];
        console.log(`Populated filteredTracks with ${filteredTracks.length} tracks`);
    }
    
    // Initialize the player
    await initPlayer();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add upload page link to header if not already there
    addUploadPageLink();
    
    // Setup password protection for the upload link
    setupUploadLinkPasswordProtection();
    
    // Initialize with embedded audio for sample tracks if needed
    initializeWithEmbeddedAudio();
    
    // Save the tracks to storage to ensure everything is in sync
    const trackCount = tracksData.length || 0;
    console.log(`Player initialized with ${trackCount} tracks.`);
    
    // Always save tracks to storage to ensure they'll be available next time
    if (trackCount > 0) {
        console.log('Saving tracks to storage for future use');
        await saveTracksData();
        
        // Also synchronize with approvedTracks to ensure they appear in the upload page
        await storageService.saveApprovedTracks(tracksData);
        
        // Final sync to ensure everything is consistent
        await storageService.syncTrackCollections();
    }
    
    console.log('Initialization complete. Try clicking on UI elements now.');
});

function handlePlaylistClick(event) {
    const target = event.target;
    
    // Check if a track item was clicked
    if (target.closest('.playlist-item')) {
        const trackIndex = parseInt(target.closest('.playlist-item').dataset.index);
        if (!isNaN(trackIndex) && trackIndex >= 0 && trackIndex < tracksData.length) {
            console.log('Playlist item clicked, loading track at index:', trackIndex);
            loadTrack(trackIndex);
            playTrack();
        }
    }
}

function nextTrack() {
    if (tracksData.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % tracksData.length;
    loadTrack(nextIndex);
    playTrack();
}

function prevTrack() {
    if (tracksData.length === 0) return;
    
    const prevIndex = (currentTrackIndex - 1 + tracksData.length) % tracksData.length;
    loadTrack(prevIndex);
    playTrack();
}

/**
 * Load a track into the player by index or track object
 * @param {number|Object}trackOrIndex - The track index or track object to load
 */
function loadTrack(trackOrIndex) {
    // Determine if we received a track index or a track object
    let track;
    let trackIndex;

    if (typeof trackOrIndex === 'number') {
        // It's an index into tracksData
        trackIndex = trackOrIndex;
        track = tracksData[trackIndex];
    }else {
        // It's a track object
        track = trackOrIndex;
        trackIndex = tracksData.findIndex(t => t.id === track.id);
    }

    if (!track) {
        console.error('Cannot load track: Invalid track or index provided', trackOrIndex);
        return;
    }

    console.log('Loading track:', track.title, 'by', track.artist);
    
    // Store the current track index for later use
    currentTrackIndex = trackIndex;
    
    // Set the current track
    currentTrack = track;
    
    // Update UI elements
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    // Update album art if available
    if (track.albumArt) {
        albumArt.src = track.albumArt;
    }else {
        albumArt.src = 'assets/images/Tilde_Logo.png';
    }
    
    // Reset any previous play error flags
    track.retryCount = 0;
    track.usingFallback = false;
    
    // Set audio source based on track data
    if (!setAudioSource(track)) {
        console.error('Failed to set audio source for track:', track.title);
        
        // Try fallback if available
        if (track.fallbackSrc) {
            console.log('Using fallback audio source for track');
            audio.src = track.fallbackSrc;
            track.usingFallback = true;
            showFallbackIndicator(`Using embedded audio for "${track.title}"`);
        }else {
            showNotification('Error: Could not load audio for this track', 'error');
        }
    }
    
    // Load the audio
    audio.load();
    
    // Save current track ID to localStorage
    localStorage.setItem('currentTrackId', track.id.toString());
    
    // Update the current track indicator in the UI
    updateCurrentTrackIndicator();
    
    return true;
}

/**
 * Update the play/pause button state
 * @param {boolean}isPlaying - Whether the audio is currently playing
 */
function updatePlayPauseState(playing) {
    isPlaying = playing;
    
    if (playing) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }else {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    // Update the visual indicator for the current track
    updateCurrentTrackIndicator();
}

// Add this function near the other rendering functions
/**
 * Render the list of tracks in the track catalog
 */
function renderTrackList() {
    // Make function globally available
    window.renderTrackList = renderTrackList;
    
    // Reference global variables
    const tracksData = window.tracksData || [];
    let filteredTracks = window.filteredTracks || [];
    
    // Get the tracks container
    const tracksContainer = document.getElementById('tracks-container');
    
    if (!tracksContainer) {
        console.error('Track container not found (element with ID "tracks-container")');
        return;
    }
    
    console.log(`Rendering track list with ${tracksData.length} total tracks and ${filteredTracks.length} filtered tracks`);
    
    // Debug info about the global tracksData and filteredTracks
    console.log(`Global tracksData: ${window.tracksData ? window.tracksData.length : 'undefined'} tracks`);
    console.log(`Global filteredTracks: ${window.filteredTracks ? window.filteredTracks.length : 'undefined'} tracks`);
    
    // Clear any existing tracks
    tracksContainer.innerHTML = '';
    
    // Set filteredTracks to all tracks initially if it's empty
    if (filteredTracks.length === 0 && tracksData.length > 0) {
        console.log('filteredTracks is empty, using all tracks');
        filteredTracks = [...tracksData];
        window.filteredTracks = filteredTracks; // Update global
    }
    
    // If we still don't have tracks to display, show a message
    if (filteredTracks.length === 0) {
        console.warn('No tracks to display');
        tracksContainer.innerHTML = `
            <div class="no-tracks-message">
                <p>No tracks available to display.</p>
                <p>Try refreshing or adding some tracks.</p>
                <button id="force-refresh-btn" class="primary-button">Force Refresh</button>
            </div>
        `;
        
        // Add event listener to force refresh button
        const forceRefreshBtn = document.getElementById('force-refresh-btn');
        if (forceRefreshBtn) {
            forceRefreshBtn.addEventListener('click', () => {
                // Try to use uploadHandler if available
                if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
                    console.log('Forcing refresh using uploadHandler.forceRefresh()');
                    window.uploadHandler.forceRefresh();
                } else if (window.storageService && typeof window.storageService.syncFromGistToLocal === 'function') {
                    console.log('Forcing refresh using storageService.syncFromGistToLocal()');
                    window.storageService.syncFromGistToLocal().then(() => {
                        // Reload the page to ensure everything is fresh
                        window.location.reload();
                    });
                } else {
                    console.log('No refresh method available, reloading page');
                    window.location.reload();
                }
            });
        }
        
        return;
    }
    
    // Render each track
    filteredTracks.forEach(track => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.dataset.trackId = track.id;
        
        // Create mood and genre tags HTML
        let moodTags = '';
        if (track.mood && track.mood.length > 0) {
            moodTags = track.mood.map(mood => 
                `<span class="tag mood">${mood}</span>`
            ).join('');
        }
        
        let genreTags = '';
        if (track.genre && track.genre.length > 0) {
            genreTags = track.genre.map(genre => 
                `<span class="tag genre">${genre}</span>`
            ).join('');
        }
        
        // Set the track item HTML
        trackItem.innerHTML = `
            <div class="track-info">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
                <div class="track-tags">
                    ${moodTags}
                    ${genreTags}
                    ${track.duration ? `<span class="tag duration">${track.duration}</span>` : ''}
                </div>
            </div>
            <div class="track-actions">
                <button class="play-track-btn"><i class="fas fa-play"></i></button>
                <button class="add-to-playlist-btn"><i class="fas fa-plus"></i></button>
                <button class="edit-track-btn" title="Edit track"><i class="fas fa-edit"></i></button>
            </div>
        `;
        
        // Add event listeners
        const playButton = trackItem.querySelector('.play-track-btn');
        playButton.addEventListener('click', () => {
            loadTrack(track);
            playTrack();
        });
        
        const addToPlaylistButton = trackItem.querySelector('.add-to-playlist-btn');
        addToPlaylistButton.addEventListener('click', () => {
            addToPlaylist(track);
        });
        
        // Add the track item to the container
        tracksContainer.appendChild(trackItem);
    });
    
    // Update current track indicator
    if (currentTrack) {
        updateCurrentTrackIndicator();
    }
}

/**
 * Render a specific list of tracks in the catalog
 * @param {Array}tracks - The tracks to render
 */
function renderTracks(tracks) {
    if (!tracksContainer) {
        console.error('Track container not found');
        return;
    }
    
    console.log('Rendering filtered track list with', tracks.length, 'tracks');
    
    // Clear any existing tracks
    tracksContainer.innerHTML = '';
    
    if (tracks.length === 0) {
        // Show a message if no tracks match the filters
        tracksContainer.innerHTML = `
            <div class="no-tracks-message">
                <p>No tracks match your filter criteria.</p>
                <button id="reset-filters-btn">Reset Filters</button>
            </div>
        `;
        
        // Add event listener to reset filters button
        const resetFiltersBtn = document.getElementById('reset-filters-btn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                // Reset all filter buttons
                document.querySelectorAll('.mood-btn, .genre-btn, .duration-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Reset filteredTracks to all tracks
                filteredTracks = [...tracksData];
                
                // Render all tracks
                renderTrackList();
            });
        }
        
        return;
    }
    
    // Render each track
    tracks.forEach(track => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.dataset.trackId = track.id;
        
        // Create mood and genre tags HTML
        let moodTags = '';
        if (track.mood && track.mood.length > 0) {
            moodTags = track.mood.map(mood => 
                `<span class="tag mood">${mood}</span>`
            ).join('');
        }
        
        let genreTags = '';
        if (track.genre && track.genre.length > 0) {
            genreTags = track.genre.map(genre => 
                `<span class="tag genre">${genre}</span>`
            ).join('');
        }
        
        // Set the track item HTML
        trackItem.innerHTML = `
            <div class="track-info">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
                <div class="track-tags">
                    ${moodTags}
                    ${genreTags}
                    ${track.duration ? `<span class="tag duration">${track.duration}</span>` : ''}
                </div>
            </div>
            <div class="track-actions">
                <button class="play-track-btn"><i class="fas fa-play"></i></button>
                <button class="add-to-playlist-btn"><i class="fas fa-plus"></i></button>
                <button class="edit-track-btn" title="Edit track"><i class="fas fa-edit"></i></button>
            </div>
        `;
        
        // Add event listeners
        const playButton = trackItem.querySelector('.play-track-btn');
        playButton.addEventListener('click', () => {
            loadTrack(track);
            playTrack();
        });
        
        const addToPlaylistButton = trackItem.querySelector('.add-to-playlist-btn');
        addToPlaylistButton.addEventListener('click', () => {
            addToPlaylist(track);
        });
        
        // Add the track item to the container
        tracksContainer.appendChild(trackItem);
    });
}

/**
 * Seek to a position in the track
 * @param {Event}event - The input event from the progress slider
 */
function seekTrack(event) {
    if (!audio.duration) return;
    const seekPosition = parseFloat(event.target.value);
    audio.currentTime = (seekPosition / 100) * audio.duration;
    updateProgress();
}

/**
 * Set the volume level
 * @param {number}volume - Volume level between 0 and 1
 */
function setVolume(volume) {
    if (volume < 0) volume = 0;
    if (volume > 1) volume = 1;
    
    audio.volume = volume;
    
    // Save the volume setting to localStorage
    localStorage.setItem('volume', volume.toString());
    
    // Update volume icon based on level
    const volumeIcon = document.querySelector('.volume-container i');
    if (volumeIcon) {
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        }else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        }else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
}

/**
 * Play the next track in the list
 */
function playNextTrack() {
    console.log('Playing next track');
    nextTrack();
}

/**
 * Play the previous track in the list
 */
function playPreviousTrack() {
    console.log('Playing previous track');
    prevTrack();
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Play/Pause button
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayPause);
    }
    
    // Next/Previous buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousTrack);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextTrack);
    }
    
    // Add listener for the force refresh button
    const forceRefreshBtn = document.getElementById('force-refresh-button');
    if (forceRefreshBtn) {
        forceRefreshBtn.addEventListener('click', function() {
            console.log('Force refresh button clicked');
            if (window.uploadHandler && typeof window.uploadHandler.forceRefresh === 'function') {
                window.uploadHandler.forceRefresh();
            } else {
                console.warn('Upload handler or forceRefresh method not available');
                showNotification('Refresh function not available', 'error');
            }
        });
    }
    
    // Add listener for the Gist settings button
    const gistSettingsBtn = document.getElementById('gist-settings-btn');
    if (gistSettingsBtn) {
        gistSettingsBtn.addEventListener('click', function() {
            console.log('Gist settings button clicked');
            // Find and show the Gist setup container
            const gistSetupContainer = document.querySelector('.gist-setup-container');
            if (gistSetupContainer) {
                gistSetupContainer.classList.remove('hidden');
            } else {
                console.warn('Gist setup container not found');
                showNotification('Gist setup UI not available', 'error');
            }
        });
    }
    
    // Add event listeners to track items
    tracksContainer.addEventListener('click', handleTrackClick);
    
    // Volume slider
    if (volumeSlider) {
        volumeSlider.addEventListener('input', updateVolume);
    }
    
    // Progress bar clicks
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
        progressContainer.addEventListener('click', function(e) {
            const width = this.clientWidth;
            const clickX = e.offsetX;
            const duration = audio.duration;
            
            if (duration) {
                audio.currentTime = (clickX / width) * duration;
                updateProgress();
            }
        });
    }
    
    // Mood filter buttons
    if (moodButtons) {
        moodButtons.forEach(button => {
            button.addEventListener('click', () => {
                toggleFilterButton(button, 'mood');
                applyFilters();
            });
        });
    }
    
    // Genre filter buttons
    if (genreButtons) {
        genreButtons.forEach(button => {
            button.addEventListener('click', () => {
                toggleFilterButton(button, 'genre');
                applyFilters();
            });
        });
    }
    
    // Duration filter buttons
    if (durationButtons) {
        durationButtons.forEach(button => {
            button.addEventListener('click', () => {
                toggleFilterButton(button, 'duration');
                applyFilters();
            });
        });
    }
    
    // Save current position when page unloads
    window.addEventListener('beforeunload', () => {
        if (currentTrack && audio) {
            localStorage.setItem('currentTrackPosition', audio.currentTime.toString());
        }
    });
    
    // Playlist related events
    if (playlistContainer) {
        playlistContainer.addEventListener('click', handlePlaylistClick);
    }
    
    if (clearPlaylistBtn) {
        clearPlaylistBtn.addEventListener('click', clearPlaylist);
    }
    
    if (downloadPlaylistBtn) {
        downloadPlaylistBtn.addEventListener('click', downloadPlaylist);
    }
}

/**
 * Add upload page link to header
 */
function addUploadPageLink() {
    const uploadLink = document.getElementById('upload-tracks-link');
    if (uploadLink) {
        uploadLink.addEventListener('click', () => {
            window.location.href = 'upload.html';
        });
    }
}

/**
 * Setup password protection for the upload link
 */
function setupUploadLinkPasswordProtection() {
    const uploadLink = document.getElementById('upload-tracks-link');
    if (uploadLink) {
        uploadLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Create a simple password prompt
            const password = prompt('Enter password to access the upload page:');
            
            // Super simple password check - in a real app, use proper authentication
            if (password === 'tilde') {
                window.location.href = 'upload.html';
            }else {
                alert('Incorrect password');
            }
        });
    }
}

/**
 * Render the playlist in the UI
 */
function renderPlaylist() {
    if (!playlistContainer) {
        console.error('Playlist container not found');
        return;
    }
    
    // Clear existing items
    playlistContainer.innerHTML = '';
    
    if (playlist.length === 0) {
        // Show empty state
        playlistContainer.innerHTML = `
            <div class="empty-playlist">
                <p>Your collection is empty.</p>
                <p>Add tracks from the catalog to start building your collection.</p>
            </div>
        `;
        return;
    }
    
    // Render each playlist item
    playlist.forEach((track, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.dataset.index = index;
        playlistItem.dataset.trackId = track.id;
        playlistItem.draggable = true;
        
        playlistItem.innerHTML = `
            <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
            <div class="playlist-item-info">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
            </div>
            <div class="playlist-item-actions">
                <button class="play-playlist-item-btn"><i class="fas fa-play"></i></button>
                <button class="remove-from-playlist-btn"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        // Add event listeners
        const playButton = playlistItem.querySelector('.play-playlist-item-btn');
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.stopPropagation();
                loadTrack(track);
                playTrack();
            });
        }
        
        const removeButton = playlistItem.querySelector('.remove-from-playlist-btn');
        if (removeButton) {
            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromPlaylist(index);
            });
        }
        
        // Add the item to the container
        playlistContainer.appendChild(playlistItem);
    });
    
    // Set up drag and drop functionality
    setupDragAndDrop();
}

// Close the module/script
})();
