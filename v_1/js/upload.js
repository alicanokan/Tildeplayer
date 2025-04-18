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

// Initialize the upload page
function initUploadPage() {
    // Load data from localStorage
    loadData();
    
    // Render the tracks
    renderPendingTracks();
    renderApprovedTracks();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add batch copy button to instructions
    addBatchCopyButton();
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

// Approve a track to move it to the approved list
function approveTrack() {
    if (selectedTrackIndex === -1) return;
    
    // Check if title and artist are provided
    const track = pendingTracks[selectedTrackIndex];
    
    // Debug information to understand the state of the track
    console.log("Track to approve:", track);
    console.log("Track mood:", track.mood, "Length:", track.mood.length);
    console.log("Track genre:", track.genre, "Length:", track.genre.length);
    console.log("Track duration:", track.duration);
    
    // Get the current selections from the UI - this ensures we're using the latest UI state
    const selectedMoods = [];
    moodCheckboxes.forEach(checkbox => {
        console.log("Mood checkbox:", checkbox.value, "Checked:", checkbox.checked);
        if (checkbox.checked) {
            selectedMoods.push(checkbox.value);
        }
    });
    
    const selectedGenres = [];
    genreCheckboxes.forEach(checkbox => {
        console.log("Genre checkbox:", checkbox.value, "Checked:", checkbox.checked);
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
    
    console.log("Selected moods from UI:", selectedMoods);
    console.log("Selected genres from UI:", selectedGenres);
    console.log("Selected duration from UI:", selectedDuration);
    
    // Check for required fields
    console.log("Selected moods from UI:", selectedMoods);
    console.log("Selected genres from UI:", selectedGenres);
    
    // Check for required fields
    if (!trackTitleInput.value.trim() || !trackArtistInput.value.trim()) {
        alert('Please provide a title and artist for the track before approving.');
        return;
    }
    
    // Check if at least one mood and one genre are selected
    if (selectedMoods.length === 0 || selectedGenres.length === 0) {
        alert('Please select at least one mood and one genre before approving.');
        return;
    }
    
    // Stop audio playback
    stopPreviewPlayback();
    
    // Create a deep copy of the track to ensure no reference issues
    const approvedTrack = JSON.parse(JSON.stringify(track));
    
    // Update track with the latest form values
    approvedTrack.title = trackTitleInput.value.trim();
    approvedTrack.artist = trackArtistInput.value.trim();
    approvedTrack.mood = selectedMoods;
    approvedTrack.genre = selectedGenres;
    approvedTrack.duration = selectedDuration;
    
    // Check for valid audioFilePath
    console.log("Audio file path for approved track:", approvedTrack.audioFilePath);
    
    // Ask if user wants to use original filename or generated path
    const useOriginalFilename = confirm(
        `Would you like to use the original filename (${approvedTrack.fileName}) instead of a generated name?\n\n` +
        `Original: @audio/${approvedTrack.fileName}\n` +
        `Generated: ${approvedTrack.audioFilePath}\n\n` +
        `Click OK to use original filename, or Cancel to specify a custom path.`
    );
    
    if (useOriginalFilename) {
        // Use the original filename
        approvedTrack.audioFilePath = `@audio/${approvedTrack.fileName}`;
        approvedTrack.useOriginalFilename = true;
    } else {
        // Allow user to specify a custom file path if needed
        const userSpecifiedPath = prompt(
            'Confirm or edit the audio file path:',
            approvedTrack.audioFilePath
        );
        
        if (userSpecifiedPath !== null) {
            // Ensure path starts with @audio/ for consistency
            approvedTrack.audioFilePath = userSpecifiedPath.startsWith('@audio/') 
                ? userSpecifiedPath 
                : '@audio/' + userSpecifiedPath;
        }
    }
    
    // Check file size and set appropriate flags
    if (approvedTrack.tooLargeForLocalStorage) {
        approvedTrack.needsManualCopy = !approvedTrack.directlyCopied;
    } else {
        approvedTrack.needsManualCopy = false;
    }
    
    // Log for debugging
    console.log("Adding track to approved list:", approvedTrack);
    
    // Add to approved tracks
    approvedTracks.push(approvedTrack);
    
    // Remove from pending tracks
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
    renderApprovedTracks();
    
    // Show success message with appropriate instructions for large files
    if (approvedTrack.tooLargeForLocalStorage && !approvedTrack.directlyCopied) {
        alert(`Track "${approvedTrack.title}" approved, but this is a large file (${approvedTrack.fileSize}).
You will need to handle this file manually or use the batch copy feature.
The file should be copied as: ${approvedTrack.audioFilePath}`);
    } else {
        alert(`Track "${approvedTrack.title}" successfully approved and moved to the approved list.`);
    }
    
    // Additional debug info
    console.log('Current approved tracks:', approvedTracks);
    console.log('Current pending tracks:', pendingTracks);
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
function applyToPlayer() {
    // Check if there are approved tracks
    if (approvedTracks.length === 0) {
        alert('There are no approved tracks to apply to the player.');
        return;
    }
    
    // Show a loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.innerHTML = '<p>Processing audio files... Please wait.</p><div class="loading-spinner"></div>';
    document.body.appendChild(loadingMessage);
    
    console.log("Preparing", approvedTracks.length, "approved tracks for player");
    
    // Track files that need to be manually placed in the @audio directory
    const manualFiles = [];
    // Track files that have been directly copied or are available
    const readyFiles = [];
    
    // Prepare the tracks for the player format
    const playerTracks = approvedTracks.map((track, index) => {
        // Log the audioFilePath for debugging
        console.log(`Track "${track.title}" has audioFilePath: ${track.audioFilePath}`);
        
        // Determine if this track is available via localStorage or direct copy
        const isAvailableInLocalStorage = track.useOriginalFilename ? 
            localStorage.getItem(`audioFile_${track.fileName}`) !== null :
            (track.uniqueFileName && localStorage.getItem(`audioFile_${track.uniqueFileName}`) !== null);
        
        // Determine if this track needs manual file handling
        const needsManualHandling = track.tooLargeForLocalStorage && 
                                  !track.directlyCopied && 
                                  !isAvailableInLocalStorage;
        
        if (needsManualHandling) {
            // Add to manual files list with reference to original filename
            const fileReference = track.useOriginalFilename ? track.fileName : 
                                 (track.originalFileName || track.fileName || track.uniqueFileName || track.title);
            manualFiles.push({
                title: track.title,
                path: track.audioFilePath,
                originalFile: fileReference,
                useOriginalFilename: track.useOriginalFilename
            });
        } else {
            // Track is ready to be used (either directly copied or small enough for localStorage)
            readyFiles.push({
                title: track.title,
                path: track.audioFilePath,
                directlyCopied: track.directlyCopied,
                useOriginalFilename: track.useOriginalFilename
            });
        }
        
        // Determine the audio source path to use
        const srcPath = track.audioFilePath || `@audio/${track.uniqueFileName}` || `@audio/${track.fileName}` || 'embedded';
        
        console.log(`Using path for track "${track.title}": ${srcPath}`);
        
        return {
            id: index + 1, // Reset IDs to be sequential
            title: track.title,
            artist: track.artist,
            src: srcPath, // Use the audio file path
            albumArt: "assets/images/Tilde_Logo.png", // Use Tilde Logo as album art
            mood: track.mood,
            genre: track.genre,
            duration: track.duration, // Include duration so it shows correctly on player page
            needsEmbeddedAudio: srcPath === 'embedded', // Only use embedded if no path exists
            originalFileName: track.useOriginalFilename ? track.fileName : track.originalFileName, // Include original filename for reference
            directlyCopied: track.directlyCopied, // Include if the file was directly copied
            useOriginalFilename: track.useOriginalFilename // Include if original filename is used
        };
    });
    
    // Store the tracks for the player
    try {
        localStorage.setItem('playerTracks', JSON.stringify(playerTracks));
        console.log("Successfully saved playerTracks to localStorage");
        console.log("Player tracks data:", playerTracks);
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        
        // If the error is a quota exceeded error, try to save with just the metadata
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
            console.warn("Storage quota exceeded, saving tracks with file paths only");
            
            // Strip unnecessary data to reduce size
            const minimalTracks = playerTracks.map(track => ({
                id: track.id,
                title: track.title,
                artist: track.artist,
                src: track.src,
                mood: track.mood,
                genre: track.genre,
                duration: track.duration, // Add duration to minimal tracks as well
                directlyCopied: track.directlyCopied
            }));
            
            try {
                localStorage.setItem('playerTracks', JSON.stringify(minimalTracks));
                console.log("Saved minimal track data to localStorage");
            } catch (e2) {
                console.error("Failed to save even minimal track data:", e2);
                alert("Error: Unable to save track data. Your browser storage may be full. Try clearing browser data.");
            }
        }
    }
    
    // Remove loading message
    loadingMessage.remove();
    
    // Create detailed manual handling instructions if needed
    let manualInstructions = '';
    if (manualFiles.length > 0) {
        manualInstructions = '\n\nYou need to manually place these audio files in the @audio folder:\n\n';
        
        manualFiles.forEach((file, index) => {
            manualInstructions += `${index + 1}. "${file.title}"\n`;
            manualInstructions += `   - Original file: ${file.originalFile}\n`;
            manualInstructions += `   - Target path: ${file.path}\n\n`;
        });
    }
    
    // Create ready files information if any
    let readyFilesInfo = '';
    if (readyFiles.length > 0) {
        readyFilesInfo = '\n\nThese files are ready to use:\n\n';
        
        readyFiles.forEach((file, index) => {
            readyFilesInfo += `${index + 1}. "${file.title}"\n`;
            readyFilesInfo += `   - Path: ${file.path}\n`;
            readyFilesInfo += `   - Status: ${file.directlyCopied ? 'Automatically copied to @audio directory' : 'Available via download/localStorage'}\n\n`;
        });
    }
    
    // Show success message with instructions
    let message = 'Tracks successfully applied to the player.\n\n';
    
    // Add file placement instructions
    message += 'All audio files must be in the @audio directory located at:\n';
    message += window.location.pathname.replace('upload.html', '') + '@audio/\n';
    
    // Add ready files info if any
    if (readyFilesInfo) {
        message += readyFilesInfo;
    }
    
    // Add manual handling instructions if any
    if (manualInstructions) {
        message += manualInstructions;
    }
    
    message += '\nGo to the player page to listen to your tracks.';
    
    alert(message);
    
    // After showing the alert, display a more permanent notice
    const audioDirectoryNotice = document.createElement('div');
    audioDirectoryNotice.className = 'audio-directory-notice';
    
    if (manualFiles.length > 0) {
        // Prepare HTML for ready files
        let readyFilesHtml = '';
        if (readyFiles.length > 0) {
            readyFilesHtml = `
                <h4>Files Ready for Use</h4>
                <div class="ready-files-list">
                    ${readyFiles.map((file, index) => `
                        <div class="ready-file-item">
                            <p><strong>${index + 1}. "${file.title}"</strong></p>
                            <p class="file-details">Path: ${file.path}</p>
                            <p class="file-status ${file.directlyCopied ? 'success' : ''}">
                                ${file.directlyCopied ? 'Automatically copied to @audio directory' : 'Available via download'}
                            </p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Prepare HTML for manual files
        const manualFilesHtml = manualFiles.map((file, index) => `
            <div class="manual-file-item">
                <p><strong>${index + 1}. "${file.title}"</strong></p>
                <p class="file-details">Original: ${file.originalFile}</p>
                <p class="file-details">Target: ${file.path}</p>
            </div>
        `).join('');
        
        audioDirectoryNotice.innerHTML = `
            <h3>Audio Files Location</h3>
            <p>Your audio files must be placed in the @audio directory at:</p>
            <code>${window.location.pathname.replace('upload.html', '')}@audio/</code>
            
            ${readyFilesHtml}
            
            <h4>Files Needing Manual Placement</h4>
            <p>These files need to be manually placed in the @audio directory:</p>
            <div class="manual-files-list">
                ${manualFilesHtml}
            </div>
            <button id="close-notice" class="primary-btn">Got it!</button>
        `;
    } else {
        audioDirectoryNotice.innerHTML = `
            <h3>Audio Files Location</h3>
            <p>Your audio files must be placed in the @audio directory at:</p>
            <code>${window.location.pathname.replace('upload.html', '')}@audio/</code>
            <p>All your files are ready to use! Some were automatically copied and others are available via download.</p>
            <button id="close-notice" class="primary-btn">Got it!</button>
        `;
    }
    
    document.body.appendChild(audioDirectoryNotice);
    
    // Add event listener to close button
    document.getElementById('close-notice').addEventListener('click', function() {
        audioDirectoryNotice.remove();
    });
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
        const durationTag = `<span class="tag duration">${durationText}</span>`;
        
        // Try to get the audio data from localStorage
        const audioData = track.useOriginalFilename ? localStorage.getItem(`audioFile_${track.fileName}`) : null;
        
        // Create download button or instructions HTML
        let downloadButtonHTML = '';
        let fileStatusHTML = '';
        
        if (audioData) {
            // We have audio data in localStorage - show download button
            downloadButtonHTML = `
                <button class="download-audio-btn" data-filename="${track.fileName}" title="Download this audio file to place in the @audio directory">
                    <i class="fas fa-download"></i>
                </button>
            `;
        } else if (track.directlyCopied) {
            // File was directly copied to the @audio directory
            fileStatusHTML = `<p class="file-status success">File directly copied to @audio directory</p>`;
            downloadButtonHTML = `
                <button class="copied-btn" title="This file was automatically copied to the @audio directory">
                    <i class="fas fa-check-circle"></i>
                </button>
            `;
        } else if (track.tooLargeForLocalStorage) {
            // File was too large for localStorage - show instructions icon
            downloadButtonHTML = `
                <button class="audio-instructions-btn" title="This file is too large for browser storage. See instructions for manual handling.">
                    <i class="fas fa-info-circle"></i>
                </button>
            `;
        }
        
        // Get original filename for display
        const originalFileName = track.originalFileName || track.fileName || track.uniqueFileName || 'Unknown';
        
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
                    <p class="file-path">Path: <span class="path-value">${track.audioFilePath || 'No path set'}</span></p>
                    <button class="edit-path-btn" title="Edit audio file path"><i class="fas fa-edit"></i></button>
                </div>
                ${track.tooLargeForLocalStorage ? 
                    `<p class="file-original-name">Original file: <span class="original-filename">${originalFileName}</span></p>` : ''}
                ${fileStatusHTML}
            </div>
            <div class="approved-track-actions">
                ${downloadButtonHTML}
                <button class="remove-btn" title="Move back to pending tracks"><i class="fas fa-undo"></i></button>
            </div>
        `;
        
        approvedTracksList.appendChild(trackItem);
    });
    
    // Add event listeners for download buttons
    const downloadButtons = document.querySelectorAll('.download-audio-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const filename = this.dataset.filename;
            downloadAudioFile(filename);
        });
    });
    
    // Add event listeners for info buttons (for large files)
    const infoButtons = document.querySelectorAll('.audio-instructions-btn');
    infoButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            showLargeFileInstructions();
        });
    });
    
    // Add event listeners for edit path buttons
    const editPathButtons = document.querySelectorAll('.edit-path-btn');
    editPathButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const trackItem = this.closest('.approved-track-item');
            const index = parseInt(trackItem.dataset.index);
            const track = approvedTracks[index];
            const pathValueElement = trackItem.querySelector('.path-value');
            
            // Prompt for new path
            const newPath = prompt('Enter the audio file path:', track.audioFilePath || '');
            
            if (newPath !== null) {
                // Ensure path starts with @audio/ for consistency
                const formattedPath = newPath.startsWith('@audio/') ? newPath : '@audio/' + newPath;
                
                // Update the track
                track.audioFilePath = formattedPath;
                
                // Update the display
                pathValueElement.textContent = formattedPath;
                
                // Save to localStorage
                saveData();
                
                console.log(`Updated path for track "${track.title}" to: ${formattedPath}`);
            }
        });
    });
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

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('pendingTracks', JSON.stringify(pendingTracks));
        localStorage.setItem('approvedTracks', JSON.stringify(approvedTracks));
        console.log("Data saved to localStorage:", {
            pendingTracks: pendingTracks.length,
            approvedTracks: approvedTracks.length
        });
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
    }
}

// Load data from localStorage
function loadData() {
    try {
        const pendingTracksData = localStorage.getItem('pendingTracks');
        const approvedTracksData = localStorage.getItem('approvedTracks');
        
        if (pendingTracksData) {
            pendingTracks = JSON.parse(pendingTracksData);
            // Fix invalid blob URLs in pending tracks
            pendingTracks.forEach(track => {
                if (track.fileUrl && (
                    !track.fileUrl.startsWith('blob:') || 
                    track.fileUrl.startsWith('blob:null/')
                )) {
                    console.warn("Track has invalid fileUrl, regenerating preview:", track.fileUrl);
                    // Create a placeholder URL until the real file is provided again
                    track.fileUrl = null;
                    track.previewUnavailable = true;
                }
            });
        }
        
        if (approvedTracksData) {
            approvedTracks = JSON.parse(approvedTracksData);
        }
        
        console.log("Data loaded from localStorage:", {
            pendingTracks: pendingTracks.length,
            approvedTracks: approvedTracks.length
        });
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
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

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initUploadPage); 