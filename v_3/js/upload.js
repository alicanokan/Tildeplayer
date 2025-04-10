// Upload Page Functionality

// DOM Elements
// Upload Section
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadProgressContainer = document.getElementById('upload-progress-container');

// Pending Tracks Section
const pendingTracksList = document.getElementById('pending-tracks');
const trackTitleInput = document.getElementById('track-title');
const trackArtistInput = document.getElementById('track-artist');
const moodCheckboxes = document.querySelectorAll('input[name="mood"]');
const genreCheckboxes = document.querySelectorAll('input[name="genre"]');
const durationRadios = document.querySelectorAll('input[name="duration"]');
const saveTagsBtn = document.getElementById('save-tags-btn');
const approveTrackBtn = document.getElementById('approve-track-btn');
const deleteTrackBtn = document.getElementById('delete-track-btn');

// Audio Preview Section
const previewAudio = document.getElementById('preview-audio');
const previewPlayBtn = document.getElementById('preview-play-btn');
const previewProgress = document.getElementById('preview-progress');
const previewCurrentTime = document.getElementById('preview-current-time');
const previewDuration = document.getElementById('preview-duration');

// Approved Tracks Section
const approvedTracksList = document.getElementById('approved-tracks');
const applyToPlayerBtn = document.getElementById('apply-to-player-btn');

// App State
let pendingTracks = [];
let approvedTracks = [];
let selectedTrackIndex = -1;
let isPreviewPlaying = false;

// Add these API service functions at the top of the file
const API_URL = 'http://localhost:3000/api';

// The storageService is now globally available from storage-service.js
// import storageService from './storage-service.js';

// API Service functions
const api = {
    async getAllTracks() {
        const response = await fetch(`${API_URL}/tracks`);
        return response.json();
    },

    async uploadTrack(file, metadata) {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('metadata', JSON.stringify(metadata));

        const response = await fetch(`${API_URL}/tracks`, {
            method: 'POST',
            body: formData
        });
        return response.json();
    },

    async updateTrack(id, data) {
        const response = await fetch(`${API_URL}/tracks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async deleteTrack(id) {
        const response = await fetch(`${API_URL}/tracks/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// Initialize the upload page
async function initUploadPage() {
    console.log("Initializing upload page...");
    
    try {
        // First, explicitly sync data from all available sources
        await storageService.syncAllData();
        console.log("Storage sync complete");
        
        // Load data from storage (this will check all sources)
        await loadData();
        
        // Check if we have approved tracks, and if not, check for player tracks
        if (!approvedTracks || approvedTracks.length === 0) {
            console.log("No approved tracks found. Checking player tracks...");
            await reloadTracksFromPlayer(false); // Don't show alert
        }
        
        // Cleanup any problematic track filenames in approved tracks
        cleanupTrackFilenames();
        
        // Render the tracks
        renderPendingTracks();
        renderApprovedTracks();
        
        // Set up event listeners
        setupEventListeners();
        
        // Add batch copy button to instructions
        addBatchCopyButton();
        
        // Add Global Sync button for syncing between browsers
        addGlobalSyncButton();
        
        console.log("Upload page initialization complete");
    } catch (error) {
        console.error("Error initializing upload page:", error);
        // Try to recover by loading from localStorage
        pendingTracks = JSON.parse(localStorage.getItem('pendingTracks')) || [];
        approvedTracks = JSON.parse(localStorage.getItem('approvedTracks')) || [];
        
        // As a last resort, try to get tracks directly
        if (approvedTracks.length === 0) {
            const tracks = JSON.parse(localStorage.getItem('tracks')) || [];
            if (tracks.length > 0) {
                approvedTracks = tracks;
                console.log("Loaded tracks directly from localStorage as fallback");
            }
        }
        
        // Render whatever we have
        renderPendingTracks();
        renderApprovedTracks();
        setupEventListeners();
        
        // Still try to add the sync button even in error state
        addGlobalSyncButton();
    }
}

// Add a Global Sync button to the UI for syncing between browsers
function addGlobalSyncButton() {
    // Check if button already exists
    if (document.getElementById('global-sync-btn')) return;

    const button = document.createElement('button');
    button.id = 'global-sync-btn';
    button.className = 'global-sync-btn';
    button.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Global Sync';
    button.title = 'Synchronize data with GitHub Gist to share between browsers';
    
    // Add event listener
    button.addEventListener('click', () => {
        performGlobalSync();
    });
    
    // Add to the document - placing it near the other controls
    const playerContainer = document.querySelector('.player-container');
    const controlsArea = document.querySelector('.controls-area') || playerContainer;
    
    if (controlsArea) {
        controlsArea.appendChild(button);
        
        // Add CSS for the button if not already in stylesheet
        if (!document.getElementById('global-sync-styles')) {
            const styles = document.createElement('style');
            styles.id = 'global-sync-styles';
            styles.textContent = `
                .global-sync-btn {
                    background-color: #4a90e2;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 8px 12px;
                    margin: 5px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 14px;
                }
                .global-sync-btn:hover {
                    background-color: #357bd8;
                }
                .global-sync-btn.syncing {
                    background-color: #65a5e6;
                    pointer-events: none;
                }
                .global-sync-btn i {
                    font-size: 16px;
                }
            `;
            document.head.appendChild(styles);
        }
    }
}

// Function to perform a global sync with GitHub Gist
async function performGlobalSync() {
    const syncButton = document.getElementById('global-sync-btn');
    
    // Check if storageService is available and has valid Gist settings
    if (!window.storageService) {
        alert('Storage service not available. Cannot perform global sync.');
        return;
    }
    
    if (!window.storageService.hasValidGistSettings) {
        alert('GitHub Gist settings not configured properly. Please set up your Gist ID and GitHub token in the settings.');
        return;
    }
    
    // Update button state
    if (syncButton) {
        syncButton.classList.add('syncing');
        syncButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Syncing...';
        syncButton.disabled = true;
    }
    
    try {
        // Perform a comprehensive sync
        await window.storageService.forceSyncAll();
        
        // After sync, reload the data
        await loadData();
        
        // Update UI with new data
        renderPendingTracks();
        renderApprovedTracks();
        
        // Show success notification
        showNotification('Global sync completed successfully! Data has been synchronized with GitHub Gist.', 5000);
    } catch (error) {
        console.error('Error during global sync:', error);
        alert(`Global sync failed: ${error.message}`);
    } finally {
        // Reset button state
        if (syncButton) {
            syncButton.classList.remove('syncing');
            syncButton.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Global Sync';
            syncButton.disabled = false;
        }
    }
}

// Function to clean up track filenames for existing approved tracks
function cleanupTrackFilenames() {
    let hasChanges = false;
    
    // Loop through approved tracks and clean up their filenames
    if (approvedTracks && approvedTracks.length > 0) {
        approvedTracks.forEach(track => {
            if (track.src && track.src.includes('_Unknown_Artist_')) {
                console.log(`Cleaning up problematic track filename: ${track.src}`);
                
                // Extract the base title from the src
                const srcParts = track.src.split('/');
                const filename = srcParts[srcParts.length - 1];
                
                // Get the clean title before any _Unknown_Artist_ part
                const cleanTitle = filename.split('_Unknown_Artist_')[0];
                
                // Create a clean src path
                const cleanSrc = `assets/tracks/${cleanTitle}.mp3`;
                
                // Update the track
                track.src = cleanSrc;
                track.uniqueFileName = `${cleanTitle}.mp3`;
                console.log(`Updated track src to: ${track.src}`);
                
                hasChanges = true;
            }
        });
        
        // Save changes if any were made
        if (hasChanges) {
            console.log("Saving cleaned up track filenames");
            saveData();
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Upload area click handler
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change handler
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Pending tracks selection
    pendingTracksList.addEventListener('click', handlePendingTrackSelect);
    
    // Tagging actions
    saveTagsBtn.addEventListener('click', saveTrackTags);
    approveTrackBtn.addEventListener('click', approveTrack);
    deleteTrackBtn.addEventListener('click', deleteTrack);
    
    // Audio preview actions
    previewPlayBtn.addEventListener('click', togglePreviewPlayback);
    previewAudio.addEventListener('timeupdate', updatePreviewProgress);
    previewAudio.addEventListener('loadedmetadata', updatePreviewDuration);
    previewAudio.addEventListener('ended', handlePreviewEnded);
    
    // Clickable progress bar
    document.querySelector('.preview-progress-bar').addEventListener('click', seekPreviewAudio);
    
    // Approved tracks actions
    approvedTracksList.addEventListener('click', handleApprovedTrackActions);
    applyToPlayerBtn.addEventListener('click', applyToPlayer);
    
    // New: Reload from player button
    const reloadFromPlayerBtn = document.getElementById('reload-from-player-btn');
    if (reloadFromPlayerBtn) {
        reloadFromPlayerBtn.addEventListener('click', () => reloadTracksFromPlayer(true));
    }
    
    // New: Reset storage button
    const resetStorageBtn = document.getElementById('reset-storage-btn');
    if (resetStorageBtn) {
        resetStorageBtn.addEventListener('click', resetStorage);
    }
}

// Function to reset all storage
async function resetStorage() {
    const confirmReset = confirm(
        "WARNING: This will delete all your track data!\n\n" +
        "This action cannot be undone. All your tracks data will be cleared from storage.\n\n" +
        "Do you want to continue?"
    );
    
    if (!confirmReset) {
        return;
    }
    
    try {
        console.log("Clearing all track storage...");
        
        // Clear storage service data
        await storageService.saveData('tracks', []);
        await storageService.saveData('approvedTracks', []);
        await storageService.saveData('pendingTracks', []);
        
        // Clear localStorage as well
        localStorage.removeItem('tracks');
        localStorage.removeItem('approvedTracks');
        localStorage.removeItem('pendingTracks');
        
        // Clear local arrays
        approvedTracks = [];
        pendingTracks = [];
        
        // Re-render the lists
        renderPendingTracks();
        renderApprovedTracks();
        
        // Show confirmation
        showNotification("All track data has been reset", 5000);
        
        // Reload the page after a delay to ensure clean state
        setTimeout(() => {
            location.reload();
        }, 1500);
    } catch (error) {
        console.error("Error resetting storage:", error);
        alert("There was an error resetting storage. Please try again.");
    }
}

// Handler for file selection via the file input
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFiles(files);
    }
}

// Handler for drag over event
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('active');
}

// Handler for drag leave event
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('active');
}

// Handler for drop event
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('active');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFiles(files);
    }
}

// Process the uploaded files
function processFiles(files) {
    // First, try to create the @audio directory if it doesn't exist
    ensureAudioDirectoryExists();
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if it's an audio file
        if (!file.type.startsWith('audio/')) {
            continue;
        }
        
        // Create a progress element
        const progressItemId = `progress-${Date.now()}-${i}`;
        const progressItem = createProgressElement(file.name, progressItemId);
        uploadProgressContainer.appendChild(progressItem);
        
        // Process the file (simulate upload)
        simulateFileUpload(file, progressItemId);
    }
    
    // Clear the file input
    fileInput.value = '';
}

// Ensure the @audio directory exists
function ensureAudioDirectoryExists() {
    // This will only work in Electron or similar environments with Node.js access
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Get the application path
            const appPath = process.cwd();
            const audioDir = path.join(appPath, '@audio');
            
            // Create the directory if it doesn't exist
            if (!fs.existsSync(audioDir)) {
                fs.mkdirSync(audioDir, { recursive: true });
                console.log('Created @audio directory at:', audioDir);
            } else {
                console.log('@audio directory already exists at:', audioDir);
            }
            return true;
        } catch (error) {
            console.error('Error ensuring @audio directory exists:', error);
            return false;
        }
    }
    return false; // Not in Node.js environment
}

// Function to copy a file to the @audio directory
// This function was missing and causing the ReferenceError
function copyFileToAudioDirectory(file, targetFilename) {
    return new Promise((resolve, reject) => {
        // Check if we're in an Electron/Node.js environment
        if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
            try {
                const fs = require('fs');
                const path = require('path');
                
                // Get the application path
                const appPath = process.cwd();
                const audioDir = path.join(appPath, '@audio');
                
                // Ensure the directory exists
                if (!fs.existsSync(audioDir)) {
                    fs.mkdirSync(audioDir, { recursive: true });
                }
                
                // Create a FileReader to read the file
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        // Write the file using Buffer
                        const buffer = Buffer.from(e.target.result);
                        fs.writeFileSync(path.join(audioDir, targetFilename), buffer);
                        console.log(`Successfully copied ${file.name} to @audio directory as ${targetFilename}`);
                        resolve(true);
                    } catch (error) {
                        console.error(`Error writing file to @audio directory: ${error.message}`);
                        reject(error);
                    }
                };
                
                reader.onerror = function(error) {
                    console.error(`Error reading file: ${error}`);
                    reject(error);
                };
                
                // Read the file as an ArrayBuffer
                reader.readAsArrayBuffer(file);
                
            } catch (error) {
                console.error('Error in copy process:', error);
                reject(error);
            }
        } else {
            console.log('Direct file copy not available in browser environment.');
            resolve(false); // Resolve with false to indicate copy didn't happen
        }
    });
}

// Create a progress element for a file upload
function createProgressElement(fileName, id) {
    const progressItem = document.createElement('div');
    progressItem.className = 'progress-item';
    progressItem.id = id;
    
    progressItem.innerHTML = `
        <div class="file-name">${fileName}</div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
        <div class="progress-percentage">0%</div>
    `;
    
    return progressItem;
}

// Simulate file upload with progress
function simulateFileUpload(file, progressItemId) {
    let progress = 0;
    const progressItem = document.getElementById(progressItemId);
    const progressBarFill = progressItem.querySelector('.progress-bar-fill');
    const progressPercentage = progressItem.querySelector('.progress-percentage');
    
    console.log(`Processing file: ${file.name}, size: ${formatFileSize(file.size)}, type: ${file.type}`);
    
    // Prefer using original filename for the audioFilePath
    const audioFilePath = `@audio/${file.name}`;
    
    console.log(`Generated audio file path: ${audioFilePath}`);
    
    // Generate a blob URL for preview purposes
    const fileUrl = URL.createObjectURL(file);
    
    // For small files, store in localStorage, for large ones, try to copy directly
    const shouldStoreAudio = file.size < 5 * 1024 * 1024; // Only store files smaller than 5MB in localStorage
    let fileCopied = false;
    
    // Try to copy the file directly to the @audio directory for large files
    if (!shouldStoreAudio) {
        console.log(`File ${file.name} is too large for localStorage. Attempting direct copy...`);
        
        // Start a direct copy attempt (will work only in Electron)
        copyFileToAudioDirectory(file, file.name) // Use original filename
            .then(success => {
                fileCopied = success;
                if (success) {
                    console.log(`Successfully copied ${file.name} to @audio directory as ${file.name}`);
                    
                    // Show a success notification
                    showNotification(`File ${file.name} was directly copied to the @audio directory.`);
                } else {
                    console.log(`Could not directly copy ${file.name}. Manual placement will be required.`);
                }
            })
            .catch(error => {
                console.error(`Error during direct copy of ${file.name}:`, error);
            });
    }
    
    // For small files, still store in localStorage
    if (shouldStoreAudio) {
        // Read the file as data URL for storage of small files
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const dataUrl = event.target.result;
            
            // Save the audio data to localStorage
            try {
                // Store the audio file data in localStorage with the filename as key
                localStorage.setItem(`audioFile_${file.name}`, dataUrl);
                console.log(`Audio data saved for ${file.name}`);
            } catch (error) {
                console.error(`Error saving audio data to localStorage: ${error.message}`);
                console.warn(`File ${file.name} is too large for localStorage. Only metadata will be saved.`);
                // Continue with the blob URL for preview
            }
        };
        
        reader.onerror = function() {
            console.error(`Error reading file as data URL: ${file.name}`);
        };
        
        // Start reading the file as data URL
        reader.readAsDataURL(file);
    } else {
        console.log(`File ${file.name} is too large for localStorage. Only metadata will be saved.`);
    }
    
    // Create new pending track object
    const newTrack = {
        id: Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        fileUrl: fileUrl, // Blob URL for previewing
        audioFilePath: audioFilePath, // Use original filename
        uniqueFileName: `track_${Date.now()}_${Math.floor(Math.random() * 1000)}.${file.name.split('.').pop().toLowerCase()}`, // Still store the unique filename as backup
        title: file.name.replace(/\.[^/.]+$/, ""), // Use filename as default title
        artist: "Unknown Artist",
        mood: [],
        genre: [],
        uploadDate: new Date().toISOString(),
        originalFileName: file.name, // Keep the original filename for reference
        tooLargeForLocalStorage: !shouldStoreAudio, // Flag to indicate if the file was too large
        directlyCopied: false, // Will be updated when copy process completes
        previewUnavailable: false, // Added for preview handling
        useOriginalFilename: true // Default to using original filename
    };
    
    // Start the progress simulation
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Mark as complete
            progressItem.classList.add('complete');
            
            // Update the track with copy status
            newTrack.directlyCopied = fileCopied;
            
            // Add to pending tracks
            pendingTracks.push(newTrack);
            saveData();
            renderPendingTracks();
            
            // Remove progress item after a delay
            setTimeout(() => {
                progressItem.remove();
            }, 2000);
        }
        
        // Update the progress bar
        progressBarFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${Math.round(progress)}%`;
    }, 200);
}

// Show a notification to the user
function showNotification(message, duration = 5000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            notification.remove();
        }, 500); // Wait for fade-out animation
    }, duration);
}

// Handle pending track selection
function handlePendingTrackSelect(e) {
    const trackItem = e.target.closest('.pending-track-item');
    if (!trackItem) return;
    
    // Stop audio playback when switching tracks
    stopPreviewPlayback();
    
    const trackId = parseInt(trackItem.dataset.trackId);
    selectedTrackIndex = pendingTracks.findIndex(track => track.id === trackId);
    
    // Update the UI to show selected track
    const allTrackItems = document.querySelectorAll('.pending-track-item');
    allTrackItems.forEach(item => item.classList.remove('selected'));
    trackItem.classList.add('selected');
    
    // Populate the form with track data
    populateTrackForm();
    
    // Load audio for preview
    loadAudioPreview();
    
    // Enable the action buttons
    saveTagsBtn.disabled = false;
    approveTrackBtn.disabled = false;
    deleteTrackBtn.disabled = false;
    previewPlayBtn.disabled = false;
}

// Populate the track form with the selected track's data
function populateTrackForm() {
    if (selectedTrackIndex === -1) return;
    
    const track = pendingTracks[selectedTrackIndex];
    
    // Set the title and artist
    trackTitleInput.value = track.title || '';
    trackArtistInput.value = track.artist || '';
    
    // Clear all checkboxes first
    moodCheckboxes.forEach(checkbox => checkbox.checked = false);
    genreCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // Set the mood checkboxes
    if (track.mood && track.mood.length > 0) {
        moodCheckboxes.forEach(checkbox => {
            if (track.mood.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }
    
    // Set the genre checkboxes
    if (track.genre && track.genre.length > 0) {
        genreCheckboxes.forEach(checkbox => {
            if (track.genre.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }
    
    // Set the duration radio (default to 'short' if not set)
    const duration = track.duration || 'short';
    durationRadios.forEach(radio => {
        radio.checked = (radio.value === duration);
    });
}

// Load audio for preview
function loadAudioPreview() {
    if (selectedTrackIndex === -1) return;
    
    const track = pendingTracks[selectedTrackIndex];
    
    // Reset preview UI first
    previewCurrentTime.textContent = '0:00';
    previewDuration.textContent = '0:00';
    previewProgress.style.width = '0%';
    previewPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    isPreviewPlaying = false;
    
    // Check if we have a valid file URL
    if (!track.fileUrl || track.previewUnavailable) {
        // Show a message in the audio preview area
        const previewArea = document.querySelector('.track-preview');
        if (previewArea) {
            const messageElement = document.createElement('div');
            messageElement.className = 'preview-unavailable-message';
            messageElement.innerHTML = `
                <p>Preview unavailable for this track. The original file is needed for preview.</p>
                <p>File: ${track.fileName}</p>
                <button id="reload-preview-btn" class="btn">Upload File for Preview</button>
            `;
            
            // Clear any existing messages
            const existingMsg = previewArea.querySelector('.preview-unavailable-message');
            if (existingMsg) existingMsg.remove();
            
            // Add the message after the audio element
            const audioElement = previewArea.querySelector('audio');
            if (audioElement) {
                audioElement.insertAdjacentElement('afterend', messageElement);
                
                // Add event listener to the reload button
                const reloadBtn = document.getElementById('reload-preview-btn');
                if (reloadBtn) {
                    reloadBtn.addEventListener('click', function() {
                        uploadFileForPreview(track);
                    });
                }
            }
        }
        
        // Disable the play button
        previewPlayBtn.disabled = true;
        return;
    }
    
    // We have a valid file URL
    previewAudio.src = track.fileUrl;
    previewPlayBtn.disabled = false;
}

// Function to upload a file specifically for preview
function uploadFileForPreview(track) {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Check if the filename matches
            if (file.name !== track.fileName) {
                if (!confirm(`Selected file "${file.name}" doesn't match expected file "${track.fileName}". Use anyway?`)) {
                    return;
                }
            }
            
            // Generate a new blob URL for preview
            const newFileUrl = URL.createObjectURL(file);
            
            // Update the track
            const index = pendingTracks.findIndex(t => t.id === track.id);
            if (index !== -1) {
                pendingTracks[index].fileUrl = newFileUrl;
                pendingTracks[index].previewUnavailable = false;
                
                // Save and reload preview
                saveData();
                loadAudioPreview();
                
                // Remove any preview unavailable message
                const message = document.querySelector('.preview-unavailable-message');
                if (message) message.remove();
            }
        }
    });
    
    // Trigger file selection
    fileInput.click();
}

// Toggle preview playback
function togglePreviewPlayback() {
    if (selectedTrackIndex === -1) return;
    
    if (isPreviewPlaying) {
        previewAudio.pause();
        previewPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPreviewPlaying = false;
    } else {
        previewAudio.play()
            .then(() => {
                previewPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                isPreviewPlaying = true;
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                // Handle AbortError (which is not a real error, just a result of user interaction)
                if (error.name === 'AbortError') {
                    console.log('Audio playback was aborted, likely due to user interaction.');
                    // Reset play button state to be safe
                    previewPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
                    isPreviewPlaying = false;
                } else {
                    // For other errors, show a user-friendly message
                    showNotification('Could not play audio: ' + (error.message || 'Unknown error'), 3000);
                }
            });
    }
}

// Stop preview playback
function stopPreviewPlayback() {
    previewAudio.pause();
    previewAudio.currentTime = 0;
    previewPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    isPreviewPlaying = false;
}

// Update preview progress
function updatePreviewProgress() {
    const currentTime = previewAudio.currentTime;
    const duration = previewAudio.duration || 0;
    
    // Update progress bar width
    const progressPercent = (currentTime / duration) * 100;
    previewProgress.style.width = `${progressPercent}%`;
    
    // Update current time display
    previewCurrentTime.textContent = formatTime(currentTime);
}

// Update preview duration
function updatePreviewDuration() {
    previewDuration.textContent = formatTime(previewAudio.duration);
}

// Handle preview ended
function handlePreviewEnded() {
    previewPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    isPreviewPlaying = false;
    previewAudio.currentTime = 0;
}

// Format time in MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Save the track tags
function saveTrackTags() {
    if (selectedTrackIndex === -1) return;
    
    // Get the form values
    const title = trackTitleInput.value.trim();
    const artist = trackArtistInput.value.trim();
    
    // Get the selected moods
    const selectedMoods = [];
    moodCheckboxes.forEach(checkbox => {
        console.log("Mood checkbox in save:", checkbox.value, "Checked:", checkbox.checked);
        if (checkbox.checked) {
            selectedMoods.push(checkbox.value);
        }
    });
    
    // Get the selected genres
    const selectedGenres = [];
    genreCheckboxes.forEach(checkbox => {
        console.log("Genre checkbox in save:", checkbox.value, "Checked:", checkbox.checked);
        if (checkbox.checked) {
            selectedGenres.push(checkbox.value);
        }
    });
    
    // Get the selected duration
    let selectedDuration = 'short'; // Default
    durationRadios.forEach(radio => {
        if (radio.checked) {
            selectedDuration = radio.value;
        }
    });
    
    console.log("Before update - Track mood:", pendingTracks[selectedTrackIndex].mood);
    console.log("Before update - Track genre:", pendingTracks[selectedTrackIndex].genre);
    console.log("Before update - Track duration:", pendingTracks[selectedTrackIndex].duration);
    console.log("Selected moods to save:", selectedMoods);
    console.log("Selected genres to save:", selectedGenres);
    console.log("Selected duration to save:", selectedDuration);
    
    // Update the track
    pendingTracks[selectedTrackIndex].title = title;
    pendingTracks[selectedTrackIndex].artist = artist;
    pendingTracks[selectedTrackIndex].mood = selectedMoods;
    pendingTracks[selectedTrackIndex].genre = selectedGenres;
    pendingTracks[selectedTrackIndex].duration = selectedDuration;
    
    console.log("After update - Track object:", pendingTracks[selectedTrackIndex]);
    
    // Save the data and refresh the UI
    saveData();
    renderPendingTracks();
    
    // Show a success message
    alert('Track tags saved successfully!');
}

// Function to approve a track
function approveTrack() {
    if (selectedTrackIndex === -1) return;
    
    const track = pendingTracks[selectedTrackIndex];
    
    // Use the original filename instead of creating a new one
    // This preserves spaces, parentheses, and other special characters
    const originalFileName = track.fileName || track.originalFileName || track.name;
    
    // Create a track object for the approved list
    const approvedTrack = {
        id: track.id || Date.now(),
        title: track.title,
        artist: track.artist,
        src: `assets/tracks/${originalFileName}`,
        albumArt: "assets/images/togg-seeklogo.png",
        mood: [...track.mood],
        genre: [...track.genre],
        duration: track.duration,
        fileName: originalFileName,
        originalFileName: originalFileName,
        fileSize: track.fileSize,
        dateAdded: new Date().toISOString()  // Add timestamp for sorting/tracking
    };
    
    // Add to approved tracks
    approvedTracks.push(approvedTrack);
    
    // Remove from pending tracks
    pendingTracks.splice(selectedTrackIndex, 1);
    
    // Reset the selection
    selectedTrackIndex = -1;
    trackTitleInput.value = '';
    trackArtistInput.value = '';
    moodCheckboxes.forEach(checkbox => checkbox.checked = false);
    genreCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // Disable buttons
    saveTagsBtn.disabled = true;
    approveTrackBtn.disabled = true;
    deleteTrackBtn.disabled = true;
    previewPlayBtn.disabled = true;
    
    // Stop audio if playing
    stopPreviewPlayback();
    
    // IMPORTANT: Save to both approvedTracks and the main player tracks storage
    saveDataToAllStorages().then(() => {
        // After saving, force a sync from GitHub to local to ensure consistency
        if (window.storageService && window.storageService.isGitHub) {
            window.storageService.syncFromGistToLocal().then(() => {
                console.log("Forced synchronization from Gist to local storage after track approval");
            }).catch(err => {
                console.error("Error during forced Gist sync:", err);
            });
        }
    });
    
    // Update the UI
    renderPendingTracks();
    renderApprovedTracks();
    
    // Show notification
    showNotification(`Track "${approvedTrack.title}" approved! Don't forget to download it and place it in the assets/tracks directory.`);
}

// New function to save data to all necessary storage locations
async function saveDataToAllStorages() {
    try {
        console.log("Saving data to all storage locations...");
        
        // First, save pending tracks
        await storageService.saveData('pendingTracks', pendingTracks);
        
        // Then use the new special method for saving approved tracks
        // This will automatically sync them to the main tracks collection
        await storageService.saveApprovedTracks(approvedTracks);
        
        // Also synchronize all track collections just to be safe
        await storageService.syncTrackCollections();
        
        console.log("Data saved to all storage locations successfully");
    } catch (error) {
        console.error("Error saving data to all storages:", error);
    }
}

// Delete a track from the pending list
function deleteTrack() {
    if (selectedTrackIndex === -1) return;
    
    // Confirm deletion
    if (confirm('Are you sure you want to delete this track?')) {
        // Stop audio playback
        stopPreviewPlayback();
        
        // Remove the track URL and free the memory
        URL.revokeObjectURL(pendingTracks[selectedTrackIndex].fileUrl);
        
        // Remove the track from the array
        pendingTracks.splice(selectedTrackIndex, 1);
        
        // Reset the selected track
        selectedTrackIndex = -1;
        trackTitleInput.value = '';
        trackArtistInput.value = '';
        moodCheckboxes.forEach(checkbox => checkbox.checked = false);
        genreCheckboxes.forEach(checkbox => checkbox.checked = false);
        
        // Disable the action buttons
        saveTagsBtn.disabled = true;
        approveTrackBtn.disabled = true;
        deleteTrackBtn.disabled = true;
        previewPlayBtn.disabled = true;
        
        // Save the data and refresh the UI
        saveData();
        renderPendingTracks();
    }
}

// Handle actions on approved tracks
function handleApprovedTrackActions(e) {
    const removeBtn = e.target.closest('.remove-btn');
    if (!removeBtn) return;
    
    const trackItem = e.target.closest('.approved-track-item');
    if (!trackItem) return;
    
    const trackId = parseInt(trackItem.dataset.trackId);
    const trackIndex = approvedTracks.findIndex(track => track.id === trackId);
    
    if (trackIndex !== -1) {
        // Confirm removal
        if (confirm('Are you sure you want to remove this track from approved list?')) {
            // Move back to pending or just remove
            const track = approvedTracks[trackIndex];
            pendingTracks.push(track);
            approvedTracks.splice(trackIndex, 1);
            
            // Save the data and refresh the UI
            saveData();
            renderPendingTracks();
            renderApprovedTracks();
        }
    }
}

// Apply approved tracks to the player
async function applyToPlayer() {
    if (approvedTracks.length === 0) {
        alert('There are no approved tracks to apply to the player.');
        return;
    }
    
    try {
        console.log("Applying tracks to player:", approvedTracks);
        
        // Make sure all tracks have the required fields for the player
        const formattedTracks = approvedTracks.map(track => {
            // Ensure track has all required properties
            return {
                id: track.id,
                title: track.title || "Unknown Title",
                artist: track.artist || "Unknown Artist",
                src: track.src,
                albumArt: track.albumArt || "assets/images/togg-seeklogo.png",
                mood: Array.isArray(track.mood) ? track.mood : ["energetic"],
                genre: Array.isArray(track.genre) ? track.genre : ["electronic"],
                duration: track.duration === "medium" ? "energetic" : (track.duration || "energetic"),
                // Include fallback for embedded audio if we have it
                fallbackSrc: track.fallbackSrc || null,
                // Add timestamp if not already present
                dateAdded: track.dateAdded || new Date().toISOString()
            };
        });
        
        // Update the local approvedTracks array with the formatted tracks
        approvedTracks = formattedTracks;
        
        // First, save to localStorage to ensure immediate availability
        localStorage.setItem('tracks', JSON.stringify(formattedTracks));
        localStorage.setItem('approvedTracks', JSON.stringify(formattedTracks));
        
        console.log("Tracks saved to localStorage directly to ensure immediate availability");
        
        // Then use the storageService for proper synchronization
        await storageService.saveApprovedTracks(formattedTracks);
        console.log("Tracks saved to approvedTracks collection");
        
        // Explicitly save to main tracks collection as well
        await storageService.saveData('tracks', formattedTracks);
        console.log("Tracks saved to main tracks collection");
        
        // Force a sync from Gist to local to ensure all storage locations are updated
        if (window.storageService && window.storageService.hasValidGistSettings) {
            try {
                await window.storageService.syncFromGistToLocal();
                console.log("Force-synced from Gist to local storage after applying tracks");
            } catch (syncError) {
                console.error("Error during Gist sync (non-fatal):", syncError);
            }
        }
        
        // Ensure track collections are synchronized
        await storageService.syncTrackCollections();
        console.log("Track collections synchronized");
        
        alert('Tracks successfully applied to the player! You can now view them in the Player page.');
    } catch (error) {
        console.error('Error applying tracks to player:', error);
        alert('Failed to apply tracks to player. Please try again.');
    }
}

// Render the pending tracks list
function renderPendingTracks() {
    if (pendingTracks.length === 0) {
        pendingTracksList.innerHTML = '<p class="empty-message">No tracks uploaded yet. Upload tracks to get started.</p>';
        return;
    }
    
    pendingTracksList.innerHTML = '';
    
    pendingTracks.forEach(track => {
        const trackItem = document.createElement('div');
        trackItem.className = 'pending-track-item';
        if (selectedTrackIndex !== -1 && pendingTracks[selectedTrackIndex].id === track.id) {
            trackItem.classList.add('selected');
        }
        trackItem.dataset.trackId = track.id;
        
        // Add a visual indication if preview is unavailable
        const previewStatus = track.previewUnavailable ? 
            '<span class="preview-status">(Preview unavailable)</span>' : '';
        
        trackItem.innerHTML = `
            <div class="track-name">${track.title || track.name} ${previewStatus}</div>
            <div class="file-info">
                <span>${track.artist || 'Unknown Artist'}</span>
                <span>${track.fileSize}</span>
            </div>
        `;
        
        pendingTracksList.appendChild(trackItem);
    });
}

// Render the approved tracks list
function renderApprovedTracks() {
    console.log("Rendering approved tracks:", approvedTracks);
    
    if (!approvedTracks || approvedTracks.length === 0) {
        approvedTracksList.innerHTML = '<p class="empty-message">No approved tracks yet. Tag and approve tracks to see them here.</p>';
        return;
    }
    
    approvedTracksList.innerHTML = '';
    
    approvedTracks.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'approved-track-item';
        trackItem.dataset.trackId = track.id;
        trackItem.dataset.index = index;
        
        // Create tags HTML
        const moodTags = track.mood.map(mood => `<span class="tag mood">${mood}</span>`).join('');
        const genreTags = track.genre.map(genre => `<span class="tag genre">${genre}</span>`).join('');
        
        // Convert duration code to readable text
        let durationText = '';
        switch(track.duration) {
            case 'short':
                durationText = '15 sec';
                break;
            case 'medium': // Handle legacy "medium" values still in the data
            case 'energetic': 
                durationText = '30 sec';
                break;
            case 'long':
                durationText = '60 sec';
                break;
            case 'extended':
                durationText = '60+ sec';
                break;
            default:
                durationText = track.duration || 'Unknown';
        }
        const durationTag = `<span class="tag duration">${durationText}</span>`;
        
        // Add download button
        const downloadButtonHTML = `<button class="download-audio-btn" title="Download this track"><i class="fas fa-download"></i></button>`;
        
        // Generate the target filename based on uniqueFileName or composed from title and artist
        const targetFilename = track.uniqueFileName || 
            `${track.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${track.artist.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.mp3`;
        
        trackItem.innerHTML = `
            <div class="approved-track-info">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
                <div class="approved-track-tags">
                    ${moodTags}
                    ${genreTags}
                    ${durationTag}
                </div>
                <div class="file-path-container">
                    <div class="file-path">Save as: <code>${track.src}</code></div>
                </div>
            </div>
            <div class="approved-track-actions">
                ${downloadButtonHTML}
                <button class="remove-btn" title="Remove from approved list"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        approvedTracksList.appendChild(trackItem);
    });
    
    // Add event listeners for download buttons
    const downloadButtons = document.querySelectorAll('.download-audio-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', handleDownloadTrack);
    });
}

// Function to handle track downloads
function handleDownloadTrack(e) {
    const trackItem = e.target.closest('.approved-track-item');
    if (!trackItem) return;
    
    const index = parseInt(trackItem.dataset.index);
    const track = approvedTracks[index];
    
    if (!track) {
        console.error('Track not found for download');
        return;
    }
    
    if (track.file) {
        // If we have the original file, download it directly
        const file = track.file;
        const filename = track.uniqueFileName || 
            `${track.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${track.artist.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.mp3`;
        
        const url = URL.createObjectURL(file);
        triggerDownload(url, filename);
        URL.revokeObjectURL(url);
    } else if (track.fileUrl) {
        // If we have a file URL, download from that
        const filename = track.uniqueFileName || 
            `${track.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${track.artist.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.mp3`;
        
        triggerDownload(track.fileUrl, filename);
    } else {
        // No file available, show an error
        alert(`Sorry, the original file for "${track.title}" is not available for download. You may need to provide the file manually.`);
    }
}

// Function to trigger a file download
function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Show instructions for handling large files
function showLargeFileInstructions() {
    const instructionsModal = document.createElement('div');
    instructionsModal.className = 'audio-directory-notice large-file-instructions';
    
    // Find all large tracks that need manual copying
    const largeFiles = approvedTracks.filter(track => track.tooLargeForLocalStorage && !track.directlyCopied);
    
    // Create HTML for large files list
    let largeFilesHTML = '';
    if (largeFiles.length > 0) {
        largeFilesHTML = largeFiles.map((track, index) => `
            <div class="manual-file-item" data-track-id="${track.id}">
                <p><strong>${index + 1}. "${track.title}"</strong> (${track.fileSize})</p>
                <p class="file-details">Original file: ${track.originalFileName || track.fileName}</p>
                <p class="file-details">Target path: ${track.audioFilePath}</p>
            </div>
        `).join('');
    }
    
    instructionsModal.innerHTML = `
        <h3>Large File Handling</h3>
        <p>These audio files are too large to be stored in your browser's localStorage.</p>
        
        <div class="manual-files-list">
            ${largeFilesHTML}
        </div>
        
        <h4>To use these files with the player:</h4>
        <ol>
            <li>Make sure you have the original audio files on your computer</li>
            <li>Create an "@audio" folder in the same directory as this HTML file if it doesn't exist</li>
            <li>Copy each original audio file to the @audio folder</li>
            <li>Rename each file to match the target path shown above</li>
        </ol>
        
        <p class="direct-copy-note">You have several options to handle these files:</p>
        
        <div class="large-file-options">
            <button id="direct-copy-btn" class="primary-btn">
                <i class="fas fa-copy"></i> Direct Copy Single File
            </button>
            <button id="batch-copy-btn" class="primary-btn success-btn">
                <i class="fas fa-tasks"></i> Batch Copy Multiple Files
            </button>
            <button id="download-file-list-btn" class="primary-btn">
                <i class="fas fa-download"></i> Download File List
            </button>
        </div>
        
        <p class="env-note">Running in: <span id="env-type">${detectEnvironment()}</span></p>
        <button id="close-instructions" class="primary-btn">Got it!</button>
    `;
    
    document.body.appendChild(instructionsModal);
    
    // Add event listener to close button
    document.getElementById('close-instructions').addEventListener('click', function() {
        instructionsModal.remove();
    });
    
    // Add event listener to direct copy button
    const directCopyBtn = document.getElementById('direct-copy-btn');
    if (directCopyBtn) {
        directCopyBtn.addEventListener('click', function() {
            // Create a file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'audio/*';
            
            // Listen for file selection
            fileInput.addEventListener('change', function(e) {
                if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    
                    // Detect which track was focused when clicking the direct copy button
                    const selectedItem = document.querySelector('.manual-file-item:focus-within');
                    let selectedTrack = null;
                    
                    if (selectedItem) {
                        const trackId = parseInt(selectedItem.dataset.trackId);
                        selectedTrack = approvedTracks.find(track => track.id === trackId);
                    } else if (largeFiles.length > 0) {
                        // If no specific track is focused, use the first large file
                        selectedTrack = largeFiles[0];
                    }
                    
                    if (selectedTrack) {
                        const uniqueFileName = selectedTrack.uniqueFileName || 
                                             selectedTrack.audioFilePath.replace('@audio/', '');
                        
                        // Show loading message
                        const loadingMessage = document.createElement('div');
                        loadingMessage.className = 'loading-message';
                        loadingMessage.innerHTML = '<p>Copying file... Please wait.</p><div class="loading-spinner"></div>';
                        document.body.appendChild(loadingMessage);
                        
                        // Copy the file
                        copyFileToAudioDirectory(file, uniqueFileName)
                            .then(success => {
                                loadingMessage.remove();
                                
                                if (success) {
                                    // Update the track
                                    selectedTrack.directlyCopied = true;
                                    saveData();
                                    
                                    // Update the UI
                                    renderApprovedTracks();
                                    
                                    // Close the instructions
                                    instructionsModal.remove();
                                    
                                    // Show success message
                                    showNotification(`File successfully copied to @audio/${uniqueFileName}`);
                                } else {
                                    showNotification('Failed to copy the file. Please try the manual method.', 7000);
                                }
                            })
                            .catch(error => {
                                loadingMessage.remove();
                                console.error('Error copying file:', error);
                                showNotification('Error copying file: ' + error.message, 7000);
                            });
                    } else {
                        showNotification('Could not determine which track to associate with this file.', 5000);
                    }
                }
            });
            
            // Trigger the file picker
            fileInput.click();
        });
    }
    
    // Add event listener to batch copy button
    const batchCopyBtn = document.getElementById('batch-copy-btn');
    if (batchCopyBtn) {
        batchCopyBtn.addEventListener('click', function() {
            instructionsModal.remove();
            showBatchCopyDialog();
        });
    }
    
    // Add event listener to download file list button
    const downloadFileListBtn = document.getElementById('download-file-list-btn');
    if (downloadFileListBtn) {
        downloadFileListBtn.addEventListener('click', function() {
            downloadFileList(largeFiles);
        });
    }
}

// Function to download a text file with the list of files needing copying
function downloadFileList(tracks) {
    // Format the file list as text
    let fileListText = "Files to copy to @audio directory:\n\n";
    
    tracks.forEach((track, index) => {
        fileListText += `${index + 1}. "${track.title}"\n`;
        fileListText += `   Original file: ${track.originalFileName || track.fileName}\n`;
        fileListText += `   Target path: ${track.audioFilePath}\n\n`;
    });
    
    fileListText += "\nInstructions:\n";
    fileListText += "1. Create an @audio folder in your music player directory if it doesn't exist\n";
    fileListText += "2. Copy each file to the @audio folder\n";
    fileListText += "3. Rename each file to match the target path\n";
    
    // Create a Blob with the text
    const blob = new Blob([fileListText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio_files_to_copy.txt';
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(url);
    
    // Show notification
    showNotification('File list downloaded successfully');
}

// Function to detect the runtime environment
function detectEnvironment() {
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        return 'Electron App (Direct File Copy Available)';
    } else if (window.navigator.userAgent.includes('Electron')) {
        return 'Electron Browser (Limited File Access)';
    } else {
        return 'Web Browser (Manual Copy Required)';
    }
}

// New function to show batch copy dialog
function showBatchCopyDialog() {
    // Create the dialog if it doesn't exist
    if (!document.getElementById('batchCopyDialog')) {
        const dialog = document.createElement('div');
        dialog.className = 'modal batch-copy-dialog';
        dialog.id = 'batchCopyDialog';
        
        dialog.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>Batch Copy Audio Files</h2>
                <p>Select the audio files you want to copy to the @audio directory:</p>
                
                <input type="file" id="batchFileInput" accept="audio/*" multiple style="display:none;">
                <button class="btn" id="selectBatchFilesBtn">Select Files</button>
                
                <div class="batch-files-list">
                    <p>No files selected yet. Click the "Select Files" button to choose files.</p>
                </div>
                
                <div class="batch-actions">
                    <button class="btn" id="cancelBatchCopy">Cancel</button>
                    <button class="btn primary-btn" id="startBatchCopy" disabled>Copy Selected Files</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners
        const closeBtn = dialog.querySelector('.close-btn');
        const selectFilesBtn = document.getElementById('selectBatchFilesBtn');
        const fileInput = document.getElementById('batchFileInput');
        const startCopyBtn = document.getElementById('startBatchCopy');
        const cancelBtn = document.getElementById('cancelBatchCopy');
        
        closeBtn.addEventListener('click', () => {
            dialog.style.display = 'none';
        });
        
        cancelBtn.addEventListener('click', () => {
            dialog.style.display = 'none';
        });
        
        selectFilesBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        let selectedFiles = [];
        
        fileInput.addEventListener('change', (event) => {
            selectedFiles = Array.from(event.target.files);
            const fileList = dialog.querySelector('.batch-files-list');
            
            if (selectedFiles.length > 0) {
                let fileListHTML = '';
                selectedFiles.forEach((file) => {
                    fileListHTML += `
                        <div class="batch-file-item">
                            <div><strong>${file.name}</strong></div>
                            <div class="file-details">Size: ${formatFileSize(file.size)}</div>
                        </div>
                    `;
                });
                
                fileList.innerHTML = fileListHTML;
                startCopyBtn.disabled = false;
            } else {
                fileList.innerHTML = '<p>No files selected. Click the "Select Files" button to choose files.</p>';
                startCopyBtn.disabled = true;
            }
        });
        
        startCopyBtn.addEventListener('click', () => {
            if (selectedFiles.length > 0) {
                copySpecificFiles(selectedFiles);
                startCopyBtn.disabled = true;
                selectFilesBtn.disabled = true;
            }
        });
        
        // Helper function to format file size
        function formatFileSize(bytes) {
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 Bytes';
            const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
        }
    }
    
    // Show the dialog
    const dialog = document.getElementById('batchCopyDialog');
    dialog.style.display = 'block';
}

// Add the batch copy button to the instructions
function addBatchCopyButton() {
    const instructionsModal = document.getElementById('instructionsModal');
    if (instructionsModal) {
        const modalContent = instructionsModal.querySelector('.modal-content');
        const batchCopyButton = document.createElement('button');
        batchCopyButton.className = 'btn';
        batchCopyButton.id = 'batchCopyBtn';
        batchCopyButton.textContent = 'Batch Copy Multiple Files';
        
        // Add the button before the last button (close button)
        const closeButton = modalContent.querySelector('.close-btn');
        if (closeButton && closeButton.parentNode) {
            modalContent.insertBefore(batchCopyButton, closeButton.nextSibling);
            
            // Add some space
            const spacer = document.createElement('div');
            spacer.style.margin = '15px 0';
            modalContent.insertBefore(spacer, batchCopyButton.nextSibling);
            
            // Add event listener
            batchCopyButton.addEventListener('click', () => {
                instructionsModal.style.display = 'none';  // Hide instructions
                showBatchCopyDialog();  // Show batch copy dialog
            });
        }
    }
}

// Function to copy specific files to their exact target locations
function copySpecificFiles(selectedFiles) {
    // Get the batch copy dialog and prepare UI elements
    const batchCopyDialog = document.getElementById('batchCopyDialog');
    const fileItemsContainer = batchCopyDialog.querySelector('.batch-files-list');
    const copyResults = document.createElement('div');
    copyResults.className = 'copy-results';
    
    // Variables to track progress
    let completedCopies = 0;
    let successfulCopies = 0;
    let failedCopies = 0;
    const totalFiles = selectedFiles.length;
    
    // Create a mapping of original filenames to target paths
    // Create a mapping based on approved tracks
    const fileMapping = {};
    
    // Create checkbox for preserving original filenames
    const preserveFilenamesCheckbox = document.createElement('div');
    preserveFilenamesCheckbox.className = 'preserve-filenames-option';
    preserveFilenamesCheckbox.innerHTML = `
        <label>
            <input type="checkbox" id="preserveOriginalFilenames" checked>
            Preserve original filenames (recommended)
        </label>
        <p class="option-description">Keep original filenames when copying to @audio directory</p>
    `;
    
    // Add checkbox before the file list
    fileItemsContainer.parentNode.insertBefore(preserveFilenamesCheckbox, fileItemsContainer);
    
    const shouldPreserveFilenames = () => {
        const checkbox = document.getElementById('preserveOriginalFilenames');
        return checkbox && checkbox.checked;
    };
    
    // Populate mapping from approved tracks that need manual copy
    approvedTracks.forEach(track => {
        if (track.tooLargeForLocalStorage && !track.directlyCopied) {
            const filename = track.fileName || track.originalFileName;
            const targetPath = shouldPreserveFilenames() ? 
                `@audio/${filename}` : track.audioFilePath;
            
            if (filename && targetPath) {
                fileMapping[filename] = targetPath;
                
                // If we're preserving filenames, update the track's audioFilePath
                if (shouldPreserveFilenames() && targetPath !== track.audioFilePath) {
                    track.audioFilePath = targetPath;
                    track.useOriginalFilename = true;
                }
            }
        }
    });
    
    // Add static mappings as fallback only if we don't have a match already
    const fallbackMappings = {
        '10c-Logo Synth.wav': '@audio/10c-Logo Synth.wav',
        '20c-Electro.wav': '@audio/20c-Electro.wav',
        '18c-Future.wav': '@audio/18c-Future.wav',
        '15c-Dub.wav': '@audio/15c-Dub.wav',
        '16c-StompRock.wav': '@audio/16c-StompRock.wav',
        '19c-Complex Elements.wav': '@audio/19c-Complex Elements.wav',
        '17c-Technology.wav': '@audio/17c-Technology.wav',
        '1c-Corporate.wav': '@audio/1c-Corporate.wav'
    };
    
    // Only add fallback mappings if we don't already have a mapping for that file
    Object.keys(fallbackMappings).forEach(key => {
        if (!fileMapping[key]) {
            fileMapping[key] = fallbackMappings[key];
        }
    });
    
    console.log("File mapping for batch copy:", fileMapping);
    
    // Clear any previous file items
    fileItemsContainer.innerHTML = '';
    
    // Process each selected file
    selectedFiles.forEach((file, index) => {
        // Create file item element
        const fileItem = document.createElement('div');
        fileItem.className = 'batch-file-item';
        fileItem.id = `file-item-${index}`;
        
        // Get target path, preferring to use original filename if preserving filenames
        let targetPath = fileMapping[file.name];
        if (!targetPath && shouldPreserveFilenames()) {
            // If no mapping exists but we want to preserve filenames, create one
            targetPath = `@audio/${file.name}`;
            fileMapping[file.name] = targetPath;
        }
        
        const hasMatch = !!targetPath;
        
        // Prepare file item content
        fileItem.innerHTML = `
            <div><strong>${file.name}</strong></div>
            <div class="file-details">Size: ${formatFileSize(file.size)}</div>
            ${hasMatch ? 
                `<div class="file-details">Target: ${targetPath}</div>` : 
                `<div class="file-details error-message">No matching target found</div>`}
            <div class="copy-status" id="status-${index}">Pending</div>
        `;
        
        // Add file item to container
        fileItemsContainer.appendChild(fileItem);
        
        if (!hasMatch) {
            document.getElementById(`status-${index}`).textContent = 'Error: No matching target';
            document.getElementById(`status-${index}`).className = 'copy-status error';
            completedCopies++;
            failedCopies++;
            updateCopyProgress();
            return;
        }
        
        // Start the copy process after a slight delay for UI feedback
        setTimeout(() => {
            copyFile(file, targetPath, index);
        }, 500 * index);
    });
    
    // Copy individual file to target path
    function copyFile(file, targetPath, index) {
        // Update status to copying
        const statusElement = document.getElementById(`status-${index}`);
        statusElement.textContent = 'Copying...';
        statusElement.className = 'copy-status copying';
        
        try {
            // Check if we're in an Electron or Node.js environment
            if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
                // Try direct copy using the Node.js fs module
                const fs = require('fs');
                const path = require('path');
                
                // Get the application path
                const appPath = process.cwd();
                const audioDir = path.join(appPath, '@audio');
                const targetFilename = targetPath.replace('@audio/', '');
                
                // Create a FileReader to read the file
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        // Create the directory if it doesn't exist
                        if (!fs.existsSync(audioDir)) {
                            fs.mkdirSync(audioDir, { recursive: true });
                        }
                        
                        // Write the file using Buffer
                        const buffer = Buffer.from(e.target.result);
                        fs.writeFileSync(path.join(audioDir, targetFilename), buffer);
                        
                        // Update status to success
                        statusElement.textContent = 'Success (Direct Copy)';
                        statusElement.className = 'copy-status success';
                        
                        // Update relevant approved tracks
                        updateApprovedTracksCopyStatus(targetPath);
                        
                        successfulCopies++;
                        completedCopies++;
                        updateCopyProgress();
                    } catch (error) {
                        console.error(`Error writing file ${file.name}:`, error);
                        fallbackToSimulatedCopy(file, targetPath, statusElement);
                    }
                };
                
                reader.onerror = function(error) {
                    console.error(`Error reading file ${file.name}:`, error);
                    fallbackToSimulatedCopy(file, targetPath, statusElement);
                };
                
                // Start reading the file as an ArrayBuffer
                reader.readAsArrayBuffer(file);
            } else {
                // In browser environment, fall back to simulated copy
                fallbackToSimulatedCopy(file, targetPath, statusElement);
            }
        } catch (error) {
            console.error('Error trying to determine environment:', error);
            fallbackToSimulatedCopy(file, targetPath, statusElement);
        }
    }
    
    // Fallback method for browser environments where direct copy is not possible
    function fallbackToSimulatedCopy(file, targetPath, statusElement) {
        console.log(`Using simulated copy for ${file.name} to ${targetPath}`);
        
        // Check file size for proper user feedback
        const isLargeFile = file.size > 5 * 1024 * 1024; // 5MB threshold
        
        if (isLargeFile) {
            // For large files, just store metadata and guide user
            localStorage.setItem(`file_metadata_${targetPath}`, JSON.stringify({
                name: file.name,
                size: file.size,
                type: file.type,
                path: targetPath,
                needsManualCopy: true,
                timestamp: Date.now()
            }));
            
            // Update UI to show success but note manual copy needed
            statusElement.textContent = 'Ready for manual copy';
            statusElement.className = 'copy-status copying';
            
            // Find any matching approved tracks and update their status
            updateApprovedTracksCopyStatus(targetPath, false, true);
            
        } else {
            // For smaller files, try to store in localStorage with a data URL
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    localStorage.setItem(`file_data_${targetPath}`, e.target.result);
                    localStorage.setItem(`file_metadata_${targetPath}`, JSON.stringify({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        path: targetPath,
                        hasDataUrl: true,
                        timestamp: Date.now()
                    }));
                    
                    // Update UI to show success
                    statusElement.textContent = 'Success (Browser Storage)';
                    statusElement.className = 'copy-status success';
                    
                    // Find any matching approved tracks and update their status
                    updateApprovedTracksCopyStatus(targetPath, true);
                    
                } catch (error) {
                    console.error(`Error storing file data in localStorage: ${error.message}`);
                    
                    // If localStorage quota exceeded, handle as large file
                    statusElement.textContent = 'Ready for manual copy';
                    statusElement.className = 'copy-status copying';
                    
                    // Store just metadata
                    localStorage.setItem(`file_metadata_${targetPath}`, JSON.stringify({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        path: targetPath,
                        needsManualCopy: true,
                        timestamp: Date.now()
                    }));
                    
                    // Update tracks to show manual copy needed
                    updateApprovedTracksCopyStatus(targetPath, false, true);
                }
                
                successfulCopies++;
                completedCopies++;
                updateCopyProgress();
            };
            
            reader.onerror = function(error) {
                console.error(`Error reading file ${file.name} as Data URL:`, error);
                statusElement.textContent = 'Error: Failed to read file';
                statusElement.className = 'copy-status error';
                
                failedCopies++;
                completedCopies++;
                updateCopyProgress();
            };
            
            // Read the file as a Data URL
            reader.readAsDataURL(file);
        }
    }
    
    // Update approved tracks that match the given path
    function updateApprovedTracksCopyStatus(targetPath, directlyCopied = true, needsManualCopy = false) {
        let trackUpdated = false;
        
        approvedTracks.forEach(track => {
            if (track.audioFilePath === targetPath) {
                track.directlyCopied = directlyCopied;
                track.needsManualCopy = needsManualCopy;
                trackUpdated = true;
            }
        });
        
        if (trackUpdated) {
            saveData();
            console.log(`Updated copy status for tracks with path ${targetPath}`);
        }
    }
    
    // Update the progress display
    function updateCopyProgress() {
        // If all files have been processed, show the results
        if (completedCopies === totalFiles) {
            // Calculate if manual steps are needed
            const needsManualSteps = failedCopies > 0 || 
                selectedFiles.some(file => file.size > 5 * 1024 * 1024);
            
            // Show completion message
            copyResults.innerHTML = `
                <h4>Copy Results</h4>
                <p>${successfulCopies} of ${totalFiles} files processed successfully</p>
                ${failedCopies > 0 ? `<p class="error-message">${failedCopies} files failed to process</p>` : ''}
                ${needsManualSteps ? 
                    `<p class="manual-steps-note">Some files may require manual copying to the @audio directory.</p>` : ''}
                <button class="btn success-btn" id="completeBatchCopy">Complete</button>
                ${needsManualSteps ? 
                    `<button class="btn" id="showManualInstructions">Show Manual Copy Instructions</button>` : ''}
            `;
            
            // Add results to dialog
            if (!document.querySelector('.copy-results')) {
                fileItemsContainer.parentNode.insertBefore(copyResults, fileItemsContainer.nextSibling);
            }
            
            // Add event listener to the complete button
            document.getElementById('completeBatchCopy').addEventListener('click', function() {
                // Close the dialog
                batchCopyDialog.style.display = 'none';
                
                // Refresh approved tracks display if any files were successfully copied
                if (successfulCopies > 0) {
                    renderApprovedTracks();
                }
            });
            
            // Add event listener to the manual instructions button if present
            const manualInstructionsBtn = document.getElementById('showManualInstructions');
            if (manualInstructionsBtn) {
                manualInstructionsBtn.addEventListener('click', function() {
                    showManualCopyInstructions();
                });
            }
        }
    }
    
    // Show instructions for manual copying
    function showManualCopyInstructions() {
        // Collect files that need manual copying
        const manualCopyFiles = [];
        
        selectedFiles.forEach((file, index) => {
            const targetPath = fileMapping[file.name];
            if (targetPath && file.size > 5 * 1024 * 1024) {
                manualCopyFiles.push({
                    name: file.name,
                    size: formatFileSize(file.size),
                    targetPath: targetPath
                });
            }
        });
        
        // Create and show the instructions modal
        const instructionsModal = document.createElement('div');
        instructionsModal.className = 'audio-directory-notice large-file-instructions';
        
        let filesListHTML = '';
        if (manualCopyFiles.length > 0) {
            filesListHTML = manualCopyFiles.map((file, index) => `
                <div class="manual-file-item">
                    <p><strong>${index + 1}. "${file.name}"</strong> (${file.size})</p>
                    <p class="file-details">Target path: ${file.targetPath}</p>
                </div>
            `).join('');
        }
        
        instructionsModal.innerHTML = `
            <h3>Manual File Copy Instructions</h3>
            <p>The following files need to be manually copied to the @audio directory:</p>
            
            <div class="manual-files-list">
                ${filesListHTML}
            </div>
            
            <h4>Steps to Copy Files:</h4>
            <ol>
                <li>Locate the @audio directory in your music player directory if it doesn't exist</li>
                <li>Copy each original file to the @audio folder</li>
                <li>Rename each file to match the target path shown above</li>
            </ol>
            
            <p>The @audio directory should be located at:</p>
            <code>${window.location.pathname.replace('upload.html', '')}@audio/</code>
            
            <button id="close-manual-instructions" class="primary-btn">Got it!</button>
        `;
        
        document.body.appendChild(instructionsModal);
        
        // Add event listener to close button
        document.getElementById('close-manual-instructions').addEventListener('click', function() {
            instructionsModal.remove();
        });
    }
    
    // Helper function to format file size
    function formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
}

// Function to download an audio file
function downloadAudioFile(filename) {
    // Get the audio data from localStorage
    const audioData = localStorage.getItem(`audioFile_${filename}`);
    
    if (!audioData) {
        alert('Audio data not found. The file may be too large for browser storage.');
        return;
    }
    
    // Check if we're in an Electron-like environment with Node.js access
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        try {
            // If we're in Electron, try to directly save the file to the @audio directory
            const fs = require('fs');
            const path = require('path');
            
            // Get the application path
            const appPath = process.cwd();
            const audioDir = path.join(appPath, '@audio');
            
            // Create the directory if it doesn't exist
            if (!fs.existsSync(audioDir)) {
                fs.mkdirSync(audioDir, { recursive: true });
            }
            
            // Convert data URL to Buffer
            const base64Data = audioData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Save the file
            fs.writeFileSync(path.join(audioDir, filename), buffer);
            
            alert(`File successfully saved to @audio directory: ${filename}`);
            return;
        } catch (error) {
            console.error('Error saving file directly:', error);
            // Fall back to manual download
        }
    }
    
    // Create a download link for regular browsers
    const a = document.createElement('a');
    a.href = audioData;
    a.download = filename;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Show instruction to the user
    alert(`Please save this file as "${filename}" and place it in the "@audio" directory located at:\n${window.location.pathname.replace('upload.html', '')}@audio/`);
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Modify saveData function to use storage service
async function saveData() {
    try {
        console.log("Saving data with storage service...");
        
        // Save pending tracks normally
        await storageService.saveData('pendingTracks', pendingTracks);
        
        // Use the new dedicated method for approved tracks
        await storageService.saveApprovedTracks(approvedTracks);
        
        // Finally, synchronize all track collections to ensure consistency
        await storageService.syncTrackCollections();
        
        console.log("Data saved successfully and synchronized:", {
            pendingTracks: pendingTracks.length,
            approvedTracks: approvedTracks.length
        });
    } catch (error) {
        console.error("Error saving data to storage service:", error);
        
        // Try localStorage as a fallback
        try {
            localStorage.setItem('pendingTracks', JSON.stringify(pendingTracks));
            localStorage.setItem('approvedTracks', JSON.stringify(approvedTracks));
            localStorage.setItem('tracks', JSON.stringify(approvedTracks));
            console.log("Data saved to localStorage as fallback");
        } catch (localStorageError) {
            console.error("Complete failure - could not save to either storage:", localStorageError);
            alert('Failed to save data. Changes may not persist across sessions.');
        }
    }
}

// Modify loadData function to use storage service
async function loadData() {
    try {
        console.log("Attempting to load data and synchronize collections...");
        
        // First synchronize all track collections 
        const syncResult = await storageService.syncTrackCollections();
        
        if (syncResult) {
            console.log("Track collections synchronized:", syncResult);
            pendingTracks = syncResult.pendingTracks || [];
            approvedTracks = syncResult.approvedTracks || [];
            
            console.log("Data loaded from synchronized collections:", {
                pendingTracks: pendingTracks.length,
                approvedTracks: approvedTracks.length,
                mainTracks: syncResult.mainTracks.length
            });
        } else {
            // If sync failed, try loading each collection directly
            console.log("Sync failed, loading collections directly...");
            
            // Load both pending and approved tracks
            const loadedPendingTracks = await storageService.loadData('pendingTracks');
            const loadedApprovedTracks = await storageService.loadData('approvedTracks');
            
            console.log("Data from storage service:", {
                pendingTracks: loadedPendingTracks ? loadedPendingTracks.length : 0,
                approvedTracks: loadedApprovedTracks ? loadedApprovedTracks.length : 0
            });
            
            // Use the loaded data if available
            if (loadedPendingTracks) pendingTracks = loadedPendingTracks;
            if (loadedApprovedTracks) approvedTracks = loadedApprovedTracks;
        }
        
        // Fall back to localStorage if still needed
        if (pendingTracks.length === 0 && localStorage.getItem('pendingTracks')) {
            console.log("Falling back to localStorage for pendingTracks");
            try {
                pendingTracks = JSON.parse(localStorage.getItem('pendingTracks')) || [];
            } catch (e) {
                console.error("Error parsing pendingTracks from localStorage", e);
                pendingTracks = [];
            }
        }
        
        if (approvedTracks.length === 0 && localStorage.getItem('approvedTracks')) {
            console.log("Falling back to localStorage for approvedTracks");
            try {
                approvedTracks = JSON.parse(localStorage.getItem('approvedTracks')) || [];
            } catch (e) {
                console.error("Error parsing approvedTracks from localStorage", e);
                approvedTracks = [];
            }
            
            // Check also in localStorage for 'tracks'
            if (approvedTracks.length === 0 && localStorage.getItem('tracks')) {
                try {
                    const playerTracks = JSON.parse(localStorage.getItem('tracks')) || [];
                    if (playerTracks.length > 0) {
                        console.log("Found tracks in localStorage, using as approved tracks:", playerTracks.length);
                        approvedTracks = playerTracks;
                    }
                } catch (e) {
                    console.error("Error parsing tracks from localStorage", e);
                }
            }
        }
        
        // Validate tracks to make sure they have required properties
        pendingTracks = pendingTracks.filter(track => 
            track && typeof track === 'object' && track.id);
            
        approvedTracks = approvedTracks.filter(track => 
            track && typeof track === 'object' && track.id && track.title && track.artist);
        
        console.log("Data loaded and validated:", {
            pendingTracks: pendingTracks.length,
            approvedTracks: approvedTracks.length
        });
        
        // Final synchronization to ensure everything is up to date
        await storageService.syncTrackCollections();
        
    } catch (error) {
        console.error("Error loading data:", error);
        // Initialize with empty arrays if there's an error
        pendingTracks = [];
        approvedTracks = [];
    }
}

// Seek the audio to the clicked position
function seekPreviewAudio(e) {
    if (selectedTrackIndex === -1 || !previewAudio.duration) return;
    
    const progressBar = e.currentTarget;
    const clickPosition = e.offsetX;
    const progressBarWidth = progressBar.clientWidth;
    const seekTime = (clickPosition / progressBarWidth) * previewAudio.duration;
    
    previewAudio.currentTime = seekTime;
}

// Function to reload tracks from player storage
async function reloadTracksFromPlayer(showAlerts = true) {
    try {
        console.log("Reloading tracks from player storage...");
        
        // First synchronize all track collections
        const syncResult = await storageService.syncTrackCollections();
        
        if (syncResult && syncResult.mainTracks && syncResult.mainTracks.length > 0) {
            // Use tracks from the synchronized collections
            console.log(`Loaded ${syncResult.mainTracks.length} tracks from synchronized collections`);
            
            // Update approved tracks to match main tracks
            approvedTracks = [...syncResult.mainTracks];
            
            // Re-render the approved tracks list
            renderApprovedTracks();
            
            if (showAlerts) {
                alert(`Successfully loaded ${approvedTracks.length} tracks from the player.`);
            }
            
            return true;
        }
        
        // If sync didn't return tracks, try direct loading
        console.log("No tracks found in sync result, trying direct loading...");
        const playerTracks = await storageService.loadData('tracks');
        
        if (!playerTracks || playerTracks.length === 0) {
            console.log("No tracks found in any storage");
            if (showAlerts) {
                alert("No tracks found in the player. Add and approve tracks first.");
            }
            return false;
        }
        
        // Update approved tracks with player tracks
        approvedTracks = playerTracks;
        console.log(`Loaded ${approvedTracks.length} tracks from player`);
        
        // Save to approved tracks storage to sync them
        await storageService.saveApprovedTracks(approvedTracks);
        
        // Re-render the approved tracks list
        renderApprovedTracks();
        
        if (showAlerts) {
            alert(`Successfully loaded ${approvedTracks.length} tracks from the player.`);
        }
        
        return true;
    } catch (error) {
        console.error("Error reloading tracks from player:", error);
        if (showAlerts) {
            alert("Error loading tracks from player. Check the console for details.");
        }
        return false;
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initUploadPage); 

// Add this code at the end of the file or near other event listeners

// Event listener for exporting known files list
document.getElementById('export-known-files-btn')?.addEventListener('click', () => {
    // Call the global exportAllKnownFiles function defined in app.js
    if (window.exportAllKnownFiles && typeof window.exportAllKnownFiles === 'function') {
        window.exportAllKnownFiles();
        showNotification('Exporting known files list...', 'info');
    } else {
        showNotification('Export function not available. Make sure app.js is loaded correctly.', 'error');
    }
});