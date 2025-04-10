// Music Player App

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

// Sample tracks data with embedded audio
let tracksData = [
    {
        id: 1,
        title: "ID Music 2 - Technology F1",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID_Music_2_Technology_F1.mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["energetic", "intense"],
        genre: ["electronic", "rock"],
        duration: "medium"
    },
    {
        id: 2,
        title: "ID Music 7 - TOGG ID MEDIA Funk",
        artist: "TildeSoundArt",
        src: "assets/tracks/ID_Music_7_TOGG_ID_MEDIA_Funk.mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["energetic", "happy"],
        genre: ["funk", "electronic"],
        duration: "medium"
    },
    {
        id: 3,
        title: "Chill Summer Vibes",
        artist: "SoundScape",
        src: "assets/tracks/sample1.mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["chill", "happy"],
        genre: ["electronic", "pop"],
        duration: "short" // 15 sec
    },
    {
        id: 4,
        title: "Urban Dreams",
        artist: "City Nights",
        src: "assets/tracks/sample2.mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["energetic", "focus"],
        genre: ["electronic"],
        duration: "medium" // 30 sec
    },
    {
        id: 5,
        title: "Tranquil Mind",
        artist: "Oceanic Waves",
        src: "assets/tracks/sample3.mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["chill", "focus"],
        genre: ["classical", "jazz"],
        duration: "short" // 15 sec
    },
    {
        id: 6,
        title: "Retro Funk",
        artist: "Groove Masters",
        src: "assets/tracks/sample4.mp3",
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["happy", "energetic"],
        genre: ["pop", "rock"],
        duration: "medium" // 15-30 min
    },
    {
        id: 7,
        title: "Melancholic Rain",
        artist: "Blue Notes",
        src: "assets/audio/sample5.mp3", // Will be replaced with embedded audio if missing
        albumArt: "assets/images/Tilde_Logo.png",
        mood: ["sad"],
        genre: ["jazz", "classical"],
        duration: "long" // 30-60 min
    }
];

// A very short audio file encoded as base64 data URI (for embedded audio)
const embeddedAudioData = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

// Modify loadUploadedTracks to use storage service
async function loadUploadedTracks() {
    console.log('Loading tracks from storage...');
    
    try {
        // Try loading from storage service first
        const tracks = await storageService.loadData('tracks');
        console.log('Loaded tracks from storage service:', tracks);
        
        // If no tracks from storage service, try localStorage directly
        if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
            console.log('No tracks found in storage service, checking localStorage directly...');
            
            try {
                const localStorageTracks = JSON.parse(localStorage.getItem('tracks'));
                if (localStorageTracks && Array.isArray(localStorageTracks) && localStorageTracks.length > 0) {
                    console.log('Found tracks in localStorage:', localStorageTracks.length);
                    processLoadedTracks(localStorageTracks);
                    return;
                }
            } catch (localStorageError) {
                console.error('Error parsing tracks from localStorage:', localStorageError);
            }
            
            console.log('No tracks found in localStorage either, using sample tracks');
            return; // Keep the default sample tracks
        }
        
        processLoadedTracks(tracks);
    } catch (error) {
        console.error('Error loading tracks:', error);
        // Try localStorage as fallback
        try {
            const localStorageTracks = JSON.parse(localStorage.getItem('tracks'));
            if (localStorageTracks && Array.isArray(localStorageTracks) && localStorageTracks.length > 0) {
                console.log('Using localStorage fallback for tracks:', localStorageTracks.length);
                processLoadedTracks(localStorageTracks);
            }
        } catch (fallbackError) {
            console.error('Complete failure loading tracks, using sample tracks:', fallbackError);
        }
    }
    
    // Helper function to process and validate tracks
    function processLoadedTracks(tracks) {
        if (!tracks || !Array.isArray(tracks)) {
            console.log('No valid tracks array, using sample tracks');
            return;
        }
        
        // Validate each track
        const validatedTracks = tracks.filter(track => {
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
        } else {
            console.error('No valid tracks found in loaded data');
        }
    }
}

// Add function to save tracks
async function saveTracksData() {
    try {
        await storageService.saveData('tracks', tracksData);
        console.log('Tracks saved successfully');
    } catch (error) {
        console.error('Error saving tracks:', error);
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
let filteredTracks = []; // Will be populated in initPlayer

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
        } else {
            // If track not found, load the first track
            if (tracksData.length > 0) {
                loadTrack(0);
            }
        }
    } else if (tracksData.length > 0) {
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
    } else {
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
    
    // Initialize retry count if it doesn't exist
    if (typeof currentTrack.retryCount === 'undefined') {
        currentTrack.retryCount = 0;
    }
    
    // Try again a few times before giving up
    if (currentTrack.retryCount < MAX_RETRY_ATTEMPTS) {
        currentTrack.retryCount++;
        console.log(`Retry attempt ${currentTrack.retryCount} for track "${currentTrack.title}"`);
        
        // Short delay before retrying
        setTimeout(() => {
            if (!currentTrack.usingFallback && currentTrack.embeddedAudio) {
                // Try fallback to embedded audio if available
                console.log(`Switching to embedded audio for "${currentTrack.title}"`);
                currentTrack.usingFallback = true;
                setAudioSource(currentTrack);
                playTrack();
            } else if (currentTrack.filePath) {
                // Just retry with the same source
                console.log(`Retrying same source for "${currentTrack.title}"`);
                setAudioSource(currentTrack);
                playTrack();
            } else {
                showNotification('Unable to play track', 'error');
                console.error('No valid audio source available for track');
            }
        }, 1000);
    } else {
        // Give up after MAX_RETRY_ATTEMPTS
        console.error(`Failed to play track "${currentTrack.title}" after ${MAX_RETRY_ATTEMPTS} attempts`);
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
        if (track.usingFallback && track.embeddedAudio) {
            // Use embedded audio as fallback
            audio.src = track.embeddedAudio;
            console.log(`Using embedded audio for track "${track.title}"`);
            return true;
        } else if (track.usingFallback && track.fallbackSrc) {
            // Use fallback source
            audio.src = track.fallbackSrc;
            console.log(`Using fallback source for track "${track.title}"`);
            return true;
        } else if (track.filePath) {
            // Use file path as primary source
            audio.src = track.filePath;
            console.log(`Using file path for track "${track.title}": ${track.filePath}`);
            return true;
        } else if (track.src) {
            // Use the src property
            audio.src = track.src;
            console.log(`Using src for track "${track.title}": ${track.src}`);
            return true;
        } else if (track.embeddedAudio) {
            // Use embedded audio as primary if no file path
            track.usingFallback = true;
            audio.src = track.embeddedAudio;
            console.log(`Using embedded audio for track "${track.title}" (no file path available)`);
            return true;
        } else if (track.fallbackSrc) {
            // Use fallback src as last resort
            track.usingFallback = true;
            audio.src = track.fallbackSrc;
            console.log(`Using fallback source for track "${track.title}" (no other source available)`);
            return true;
        }
        
        console.error(`No valid audio source found for track: ${track.title}`);
        return false;
    } catch (error) {
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
    } else {
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
 * @returns {number|null} - The index of a fallback track or null if none available
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
    
    console.log(`Attempting to play track: ${currentTrack.title} by ${currentTrack.artist}`);
    
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
                } else {
                    // Try a different track
                    const fallbackTrack = findFallbackTrack();
                    if (fallbackTrack) {
                        console.log('Trying a different track as fallback');
                        loadTrack(fallbackTrack);
                        playTrack();
                    } else {
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
    } else {
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
        } else {
            // Play next track
            loadTrack(filteredTracks[currentIndex + 1]);
        }
        
        playTrack();
        
        // Scroll to the track after a short delay to ensure the UI has updated
        setTimeout(scrollToCurrentTrack, 300);
    } else {
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
        } else {
            // Play previous track
            loadTrack(filteredTracks[currentIndex - 1]);
        }
        
        playTrack();
        
        // Scroll to the track after a short delay to ensure the UI has updated
        setTimeout(scrollToCurrentTrack, 300);
    } else {
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
    } catch (error) {
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
    } catch (error) {
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
            `${index + 1}. ${track.title} - ${track.artist}`
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
    
    // First try to load tracks from storage
    await loadUploadedTracks();
    
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
    
    // Save the default sample tracks to storage if no tracks were loaded
    // This ensures there's always something in storage
    const trackCount = filteredTracks.length || 0;
    console.log(`Player initialized with ${trackCount} tracks.`);
    
    if (trackCount <= 7 && trackCount > 0) {
        // If we just have the sample tracks, save them to storage
        // This ensures they'll be available as fallbacks
        console.log('Saving sample tracks to storage for future use');
        await saveTracksData();
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
 * @param {number|Object} trackOrIndex - The track index or track object to load
 */
function loadTrack(trackOrIndex) {
    // Determine if we received a track index or a track object
    let track;
    let trackIndex;

    if (typeof trackOrIndex === 'number') {
        // It's an index into tracksData
        trackIndex = trackOrIndex;
        track = tracksData[trackIndex];
    } else {
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
    } else {
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
        } else {
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
 * @param {boolean} isPlaying - Whether the audio is currently playing
 */
function updatePlayPauseState(playing) {
    isPlaying = playing;
    
    if (playing) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
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
    if (!tracksContainer) {
        console.error('Track container not found');
        return;
    }
    
    console.log('Rendering track list with', tracksData.length, 'tracks');
    
    // Clear any existing tracks
    tracksContainer.innerHTML = '';
    
    // Set filteredTracks to all tracks initially if it's empty
    if (filteredTracks.length === 0) {
        filteredTracks = [...tracksData];
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
 * @param {Array} tracks - The tracks to render
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
 * @param {Event} event - The input event from the progress slider
 */
function seekTrack(event) {
    if (!audio.duration) return;
    const seekPosition = parseFloat(event.target.value);
    audio.currentTime = (seekPosition / 100) * audio.duration;
    updateProgress();
}

/**
 * Set the volume level
 * @param {number} volume - Volume level between 0 and 1
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
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
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
            } else {
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