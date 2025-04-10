// Music Player App

// Add API service functions at the top of the file
const API_URL = 'http://localhost:3000/api';

// Import storage service
import storageService from './storage-service.js';

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
        const tracks = await storageService.loadData('tracks');
        console.log('Loaded tracks:', tracks);
        
        if (tracks && Array.isArray(tracks) && tracks.length > 0) {
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
                console.log('Loaded', validatedTracks.length, 'valid tracks');
            } else {
                console.error('No valid tracks found');
            }
        } else {
            console.log('No tracks found, using sample tracks');
        }
    } catch (error) {
        console.error('Error loading tracks:', error);
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
const audio = new Audio();

// App State
let currentTrack = null;
let isPlaying = false;
let playlist = [];
let filteredTracks = []; // Will be populated in initPlayer

// Initialize player with embedded audio for all tracks
function initializeWithEmbeddedAudio() {
    console.log("Initializing with embedded audio");
    
    // Replace all sample tracks with embedded audio upfront
    tracksData.forEach(track => {
        // Check if the source is a file path (not a blob or data URI)
        if (track.src && !track.src.startsWith('blob:') && !track.src.startsWith('data:')) {
            console.log(`Using embedded audio for sample track: ${track.title}`);
            track.originalSrc = track.src;
            track.src = embeddedAudioData;
        }
    });
}

// Initialize the player
async function initPlayer() {
    console.log('Initializing player...');
    
    // Create audio element
    audio = new Audio();
    
    // Set up audio event listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', playNext);
    audio.addEventListener('error', handleAudioError);
    
    // Set initial volume
    audio.volume = volumeSlider.value;
    
    // Create filtered tracks array
    filteredTracks = [...tracksData];
    
    // Try to load saved playlist
    await loadPlaylist();
    
    // Render tracks and playlist
    renderTracks(filteredTracks);
    renderPlaylist();
    
    // Load first track
    if (filteredTracks.length > 0) {
        loadTrack(filteredTracks[0]);
    }
    
    console.log('Player initialized with', filteredTracks.length, 'tracks and', playlist.length, 'playlist items');
}

// Handle audio loading errors
function handleAudioError(e) {
    console.error('Audio error:', e);
    
    // Try to find a fallback track
    console.log('Attempting to find fallback for current track');
    const fallbackTrack = findFallbackTrack();
    
    if (fallbackTrack) {
        console.log('Fallback found, loading alternative track');
        loadTrack(fallbackTrack);
        showFallbackIndicator('Audio file not found. Playing a fallback track.');
    } else {
        console.error('No fallback track available');
        showFallbackIndicator('Audio file not found and no fallbacks available.');
    }
}

// Add upload page link to the header
function addUploadPageLink() {
    // Check if we already have a navigation
    let nav = document.querySelector('header nav');
    
    if (!nav) {
        // Create new navigation
        nav = document.createElement('nav');
        const ul = document.createElement('ul');
        
        // Create player link
        const playerLi = document.createElement('li');
        const playerLink = document.createElement('a');
        playerLink.href = 'index.html';
        playerLink.textContent = 'Player';
        playerLink.classList.add('active');
        playerLi.appendChild(playerLink);
        
        // Create upload link with password protection
        const uploadLi = document.createElement('li');
        const uploadLink = document.createElement('a');
        uploadLink.href = 'javascript:void(0)'; // Change to JavaScript void to intercept the click
        uploadLink.textContent = 'Upload Tracks';
        uploadLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Prompt for password
            const password = prompt('Please enter password to access upload page:');
            
            // Check if password is correct (tilde)
            if (password === 'tilde') {
                // Password correct, navigate to upload page
                window.location.href = 'upload.html';
            } else if (password !== null) {
                // Wrong password
                alert('Incorrect password. Access denied.');
            }
            // If password is null (user clicked Cancel), do nothing
        });
        uploadLi.appendChild(uploadLink);
        
        // Append to DOM
        ul.appendChild(playerLi);
        ul.appendChild(uploadLi);
        nav.appendChild(ul);
        document.querySelector('header').appendChild(nav);
    } else {
        // Navigation already exists, just update the upload link
        const uploadLink = document.querySelector('header nav a[href="upload.html"]');
        if (uploadLink) {
            uploadLink.href = 'javascript:void(0)';
            uploadLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Prompt for password
                const password = prompt('Please enter password to access upload page:');
                
                // Check if password is correct (tilde)
                if (password === 'tilde') {
                    // Password correct, navigate to upload page
                    window.location.href = 'upload.html';
                } else if (password !== null) {
                    // Wrong password
                    alert('Incorrect password. Access denied.');
                }
                // If password is null (user clicked Cancel), do nothing
            });
        }
    }
}

// Setup password protection for the Upload Tracks link
function setupUploadLinkPasswordProtection() {
    const uploadLink = document.getElementById('upload-tracks-link');
    if (uploadLink) {
        uploadLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Prompt for password
            const password = prompt('Please enter password to access upload page:');
            
            // Check if password is correct (tilde)
            if (password === 'tilde') {
                // Password correct, navigate to upload page
                window.location.href = 'upload.html';
            } else if (password !== null) {
                // Wrong password
                alert('Incorrect password. Access denied.');
            }
            // If password is null (user clicked Cancel), do nothing
        });
    }
}

// Render tracks in the catalog
function renderTracks(tracks) {
    tracksContainer.innerHTML = '';
    
    if (tracks.length === 0) {
        tracksContainer.innerHTML = '<p class="no-tracks">No tracks match your filters.</p>';
        return;
    }
    
    tracks.forEach(track => {
        const trackElement = document.createElement('div');
        trackElement.classList.add('track-item');
        trackElement.dataset.trackId = track.id;
        
        const trackInfo = document.createElement('div');
        trackInfo.classList.add('track-info');
        
        // Convert duration code to readable text
        let durationText = '';
        switch(track.duration) {
            case 'short':
                durationText = '15 sec';
                break;
            case 'medium':
                durationText = '30 sec';
                break;
            case 'long':
                durationText = '60 sec';
                break;
            case 'extended':
                durationText = '60+ sec';
                break;
            default:
                durationText = 'Unknown';
        }
        
        trackInfo.innerHTML = `
            <h4>${track.title}</h4>
            <p>${track.artist}</p>
            <div class="track-tags">
                ${track.mood.map(mood => `<span class="tag mood">${mood}</span>`).join('')}
                ${track.genre.map(genre => `<span class="tag genre">${genre}</span>`).join('')}
                <span class="tag duration">${durationText}</span>
            </div>
        `;
        
        const trackActions = document.createElement('div');
        trackActions.classList.add('track-actions');
        
        trackActions.innerHTML = `
            <button class="play-track-btn"><i class="fas fa-play"></i></button>
            <button class="add-to-collection-btn"><i class="fas fa-plus"></i></button>
        `;
        
        trackElement.appendChild(trackInfo);
        trackElement.appendChild(trackActions);
        tracksContainer.appendChild(trackElement);
    });
}

// Render playlist items
function renderPlaylist() {
    playlistContainer.innerHTML = '';
    
    if (playlist.length === 0) {
        playlistContainer.innerHTML = '<p class="empty-playlist">Your collection is empty. Add tracks from the catalog!</p>';
        return;
    }
    
    playlist.forEach((track, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.classList.add('playlist-item');
        playlistItem.draggable = true;
        playlistItem.dataset.index = index;
        
        playlistItem.innerHTML = `
            <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
            <div class="playlist-item-info">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
            </div>
            <div class="playlist-item-actions">
                <button class="remove-from-playlist-btn" data-index="${index}"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        playlistContainer.appendChild(playlistItem);
    });
    
    setupDragAndDrop();
}

// Set up all event listeners
function setupEventListeners() {
    // Player control buttons
    playBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrevious);
    
    // Add to collection button in player controls
    document.getElementById('add-to-collection-btn').addEventListener('click', function() {
        if (currentTrack) {
            addToPlaylist(currentTrack);
            showNotification('Track added to collection');
        }
    });
    
    // Audio events
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', playNext);
    audio.addEventListener('loadedmetadata', updateDuration);
    
    // Volume control
    volumeSlider.addEventListener('input', updateVolume);
    
    // Filter buttons
    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleFilterButton(btn, 'mood');
            applyFilters();
        });
    });
    
    genreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleFilterButton(btn, 'genre');
            applyFilters();
        });
    });
    
    // Duration filter buttons
    durationButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleFilterButton(btn, 'duration');
            applyFilters();
        });
    });
    
    // Playlist actions
    clearPlaylistBtn.addEventListener('click', clearPlaylist);
    downloadPlaylistBtn.addEventListener('click', downloadPlaylist);
    
    // Track item actions
    tracksContainer.addEventListener('click', function(e) {
        if (!e.target.closest('.track-item')) return;
        
        const trackItem = e.target.closest('.track-item');
        const trackId = parseInt(trackItem.dataset.trackId);
        const track = filteredTracks.find(t => t.id === trackId);
        
        if (!track) {
            console.error('Track not found with ID:', trackId);
            return;
        }
        
        if (e.target.closest('.play-track-btn')) {
            if (currentTrack && currentTrack.id === track.id && isPlaying) {
                pauseTrack();
            } else {
                loadTrack(track);
                playTrack();
                
                // Scroll to the track after a short delay
                setTimeout(scrollToCurrentTrack, 300);
            }
        } else if (e.target.closest('.add-to-collection-btn')) {
            addToPlaylist(track);
            showNotification('Track added to collection');
        }
    });
    
    // Playlist item actions
    playlistContainer.addEventListener('click', function(e) {
        if (e.target.closest('.remove-from-playlist-btn')) {
            const index = parseInt(e.target.closest('.remove-from-playlist-btn').dataset.index);
            removeFromPlaylist(index);
        } else if (e.target.closest('.playlist-item')) {
            const index = parseInt(e.target.closest('.playlist-item').dataset.index);
            loadTrack(playlist[index]);
            playTrack();
        }
    });
    
    // Progress bar click
    document.querySelector('.progress-bar').addEventListener('click', function(e) {
        const progressBarWidth = this.clientWidth;
        const clickPosition = e.offsetX;
        const seekTime = (clickPosition / progressBarWidth) * audio.duration;
        audio.currentTime = seekTime;
    });
}

// Find a fallback track based on genre/mood if possible
function findFallbackTrack() {
    // Create fallback track data with embedded audio
    const fallbackTrack = {
        id: 999,
        title: "TildeSoundArt Sample",
        artist: "TildeSoundArt",
        src: embeddedAudioData,
        albumArt: "assets/images/Tilde_Logo.png",
        mood: currentTrack ? [...currentTrack.mood] : ["chill"],
        genre: currentTrack ? [...currentTrack.genre] : ["electronic"]
    };
    
    // If current track exists, preserve its metadata
    if (currentTrack) {
        fallbackTrack.title = currentTrack.title;
        fallbackTrack.artist = currentTrack.artist;
        fallbackTrack.albumArt = currentTrack.albumArt;
    }
    
    console.log("Created fallback track with embedded audio data");
    return fallbackTrack;
}

// Load a track into the player
function loadTrack(track) {
    if (!track) {
        console.error('Cannot load track: track is undefined');
        return;
    }
    
    console.log('Loading track:', track);
    currentTrack = track;
    
    // Check if the track data is valid
    if (!track.title || !track.artist) {
        console.error('Invalid track data:', track);
        return;
    }
    
    // Update the UI with track information
    document.getElementById('track-title').textContent = track.title;
    document.getElementById('track-artist').textContent = track.artist;
    
    // Update album art if available
    if (track.albumArt) {
        document.getElementById('album-art').src = track.albumArt;
    } else {
        document.getElementById('album-art').src = 'assets/images/Tilde_Logo.png';
    }
    
    // Update the audio source
    let embeddedAudioData = null;
    if (track.audio) {
        embeddedAudioData = track.audio;
        console.log('Track has embedded audio data');
    }
    
    // First priority: @audio directory
    if (track.src && track.src.startsWith('@audio/')) {
        console.log('Track has @audio path:', track.src);
        
        // Check if the file exists in the @audio directory
        const filename = getFilenameFromPath(track.src);
        const fullPath = convertAudioPathToUrl(track.src);
        
        console.log(`Checking if file exists: ${fullPath}`);
        
        // We'll attempt to load this in playTrack, and fallback if needed
        audio.src = fullPath;
    } 
    // Second priority: embedded audio
    else if (embeddedAudioData) {
        console.log('Using embedded audio data');
        audio.src = embeddedAudioData;
    } 
    // Third priority: external URL
    else if (track.src) {
        console.log('Using external URL:', track.src);
        audio.src = track.src;
    } else {
        console.error('No audio source found for track:', track);
        alert('This track does not have audio. Please upload an audio file.');
        return;
    }
    
    audio.load();
    
    // Update the progress bar
    updateProgress();
    
    // Update the visual indicator for the current track in tracks list
    updateCurrentTrackIndicator();
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

// Show fallback indicator for placeholder audio
function showFallbackIndicator(reason) {
    const fallbackIndicator = document.createElement('div');
    fallbackIndicator.className = 'fallback-indicator';
    fallbackIndicator.textContent = 'Playing with placeholder audio';
    
    if (reason) {
        // Add a more detailed tooltip
        fallbackIndicator.title = `Reason: ${reason}`;
    }
    
    // Remove any existing fallback indicator
    const existingIndicator = document.querySelector('.fallback-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add the indicator after the track info
    const trackInfo = document.querySelector('.track-info');
    if (trackInfo && trackInfo.parentNode) {
        trackInfo.parentNode.insertBefore(fallbackIndicator, trackInfo.nextSibling);
        
        // Hide after 5 seconds
        setTimeout(() => {
            fallbackIndicator.style.opacity = '0';
            setTimeout(() => fallbackIndicator.remove(), 1000);
        }, 5000);
    } else {
        // Fallback position if track info container is not found
        const playerContainer = document.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.appendChild(fallbackIndicator);
            
            // Hide after 5 seconds
            setTimeout(() => {
                fallbackIndicator.style.opacity = '0';
                setTimeout(() => fallbackIndicator.remove(), 1000);
            }, 5000);
        }
    }
}

// Play the current track
function playTrack() {
    if (!currentTrack) {
        if (filteredTracks.length > 0) {
            loadTrack(filteredTracks[0]);
        } else {
            console.error('No tracks available to play');
            return; // No tracks available
        }
    }
    
    console.log('Attempting to play track:', currentTrack.title, 'by', currentTrack.artist);
    
    let playAttempted = false;
    
    // Special handling for @audio paths
    if (currentTrack.src && currentTrack.src.startsWith('@audio/')) {
        console.log('Playing track from @audio directory:', currentTrack.src);
        
        // Convert the @audio/ path to a real URL using the common.js utility
        const filename = getFilenameFromPath(currentTrack.src);
        const fullAudioPath = convertAudioPathToUrl(currentTrack.src);
        
        console.log(`Converted audio path: ${fullAudioPath}`);
        
        // Update the audio source to the full path
        audio.src = fullAudioPath;
        
        audio.play()
            .then(() => {
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                console.log('Playback started successfully from @audio path');
                updateCurrentTrackIndicator(); // Update indicator when play starts
            })
            .catch(error => {
                console.error('Error playing audio from @audio path:', error);
                
                // If the file doesn't exist or can't be accessed, use embedded audio
                console.log('Falling back to embedded audio');
                audio.src = embeddedAudioData;
                audio.load();
                
                // Try again with embedded audio
                audio.play()
                    .then(() => {
                        isPlaying = true;
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        console.log('Playback started with embedded audio');
                        updateCurrentTrackIndicator(); // Update indicator when play starts
                        
                        // Show fallback indicator
                        showFallbackIndicator(`Audio file "${filename}" not found. Please place it in the @audio directory.`);
                    })
                    .catch(innerError => {
                        console.error('Error playing embedded audio:', innerError);
                    });
            });
        
        return;
    }
    
    // Function to try playing with embedded audio if needed
    const attemptPlay = (useEmbedded = false) => {
        if (useEmbedded) {
            console.log('Using embedded audio for playback');
            // Use the embedded audio
            audio.src = embeddedAudioData;
            audio.load();
        }
        
        audio.play()
            .then(() => {
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                console.log('Playback started successfully');
                updateCurrentTrackIndicator(); // Update indicator when play starts
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                
                // Check if the error is related to format or access
                if (error.name === 'NotSupportedError' || error.name === 'NetworkError') {
                    if (!useEmbedded && !playAttempted) {
                        playAttempted = true;
                        console.log('Trying with embedded audio...');
                        attemptPlay(true);
                    } else {
                        // If we already tried embedded audio and it still failed
                        console.error('All fallback attempts failed. Unable to play audio.');
                        alert('Unable to play audio. There might be an issue with your browser\'s audio support.');
                    }
                } else if (error.name === 'NotAllowedError') {
                    console.error('Playback not allowed. User interaction may be required');
                    alert('Playback not allowed. Please interact with the page first.');
                } else if (error.name === 'AbortError') {
                    console.error('Playback aborted');
                }
            });
    };
    
    // Start the first play attempt
    attemptPlay();
}

// Pause the current track
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateCurrentTrackIndicator(); // Update indicator when paused
}

// Toggle play/pause
function togglePlay() {
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
}); 