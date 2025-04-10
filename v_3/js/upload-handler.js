// Client-side upload handler for Tildeplayer
class UploadHandler {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.tracksData = null;
        this.currentUploadFile = null;
        this.loadTracksData();
    }

    async loadTracksData() {
        try {
            const response = await fetch('assets/tracks/tracks.json');
            if (!response.ok) {
                throw new Error('Failed to load tracks data');
            }
            this.tracksData = await response.json();
            this.initializeTracksFromLog();
        } catch (error) {
            console.error('Error loading tracks data:', error);
            this.tracksData = { tracks: [], lastUpdated: new Date().toISOString() };
        }
    }

    initializeTracksFromLog() {
        if (this.tracksData && this.tracksData.tracks) {
            // Clear existing tracks
            tracksData.length = 0;
            
            // Add tracks from the log
            this.tracksData.tracks.forEach(track => {
                if (!tracksData.some(t => t.id === track.id)) {
                    tracksData.push(track);
                }
            });
            
            // Update UI
            filteredTracks = [...tracksData];
            renderTrackList();
        }
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) {
            console.error('No files selected for upload');
            return;
        }

        // Show upload progress container
        this.createProgressBar();
        
        // Process each file with progress
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.type.startsWith('audio/')) {
                showNotification(`${file.name} is not an audio file`, 'error');
                continue;
            }
            
            this.currentUploadFile = file;
            this.updateProgressBar(0, `Preparing ${file.name} (${i+1}/${files.length})...`);
            
            // Show tag selection dialog after short delay to show progress
            setTimeout(() => {
                this.showTagSelectionDialog(file);
            }, 500);
            
            // Wait for this file to be processed before moving to next
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.currentUploadFile !== file) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 500);
            });
        }
    }
    
    createProgressBar() {
        // Check if progress bar already exists
        let progressContainer = document.getElementById('upload-progress-container');
        if (!progressContainer) {
            // Create progress container
            progressContainer = document.createElement('div');
            progressContainer.id = 'upload-progress-container';
            progressContainer.className = 'upload-progress-container';
            progressContainer.innerHTML = `
                <div class="upload-progress-info">Preparing upload...</div>
                <div class="upload-progress">
                    <div class="upload-progress-bar" id="upload-progress-bar"></div>
                </div>
            `;
            
            // Add to body
            document.querySelector('.player-container').appendChild(progressContainer);
        } else {
            // Just show it if it exists
            progressContainer.style.display = 'block';
        }
        
        // Show the progress elements
        document.querySelector('.upload-progress').style.display = 'block';
    }
    
    updateProgressBar(percent, message) {
        const progressBar = document.getElementById('upload-progress-bar');
        const progressInfo = document.querySelector('.upload-progress-info');
        
        if (progressBar && progressInfo) {
            progressBar.style.width = `${percent}%`;
            progressInfo.textContent = message || 'Processing...';
        }
    }
    
    hideProgressBar() {
        const progressContainer = document.getElementById('upload-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    showTagSelectionDialog(file) {
        // Update progress
        this.updateProgressBar(30, `Processing ${file.name}...`);
        
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'upload-dialog';
        dialog.id = 'upload-tag-dialog';

        // Define available moods and genres
        const availableMoods = ['happy', 'sad', 'energetic', 'calm', 'dark', 'bright', 'upbeat', 'melancholic', 'technology', 'modern'];
        const availableGenres = ['pop', 'rock', 'electronic', 'classical', 'jazz', 'hiphop', 'ambient', 'indie', 'folk', 'funk'];
        const availableDurations = ['short', 'medium', 'long'];

        // Create dialog content
        dialog.innerHTML = `
            <div class="upload-dialog-content">
                <h3>Add Track Details</h3>
                
                <div class="upload-form">
                    <div class="form-group">
                        <label for="track-title">Title</label>
                        <input type="text" id="track-title" value="${file.name.replace('.mp3', '')}" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="track-artist">Artist</label>
                        <input type="text" id="track-artist" value="TildeSoundArt" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Mood</label>
                        <div class="tag-selection mood-selection">
                            ${availableMoods.map(mood => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="mood" value="${mood}">
                                    <span>${mood}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Genre</label>
                        <div class="tag-selection genre-selection">
                            ${availableGenres.map(genre => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="genre" value="${genre}">
                                    <span>${genre}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Duration</label>
                        <div class="tag-selection duration-selection">
                            ${availableDurations.map(duration => `
                                <label class="tag-checkbox">
                                    <input type="radio" name="duration" value="${duration}">
                                    <span>${duration}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="dialog-buttons">
                    <button id="cancel-upload-btn" class="btn">Cancel</button>
                    <button id="save-track-btn" class="btn btn-primary">Save & Upload</button>
                </div>
            </div>
        `;

        // Update progress
        this.updateProgressBar(60, `Ready to add details for ${file.name}`);
        
        // Add dialog to the document
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('cancel-upload-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.currentUploadFile = null;
            this.hideProgressBar();
        });

        document.getElementById('save-track-btn').addEventListener('click', () => {
            this.processTrackWithTags(file, dialog);
        });

        // Set default values
        document.querySelectorAll('input[name="duration"]')[1].checked = true; // Default to medium
    }

    processTrackWithTags(file, dialog) {
        // Update progress
        this.updateProgressBar(80, `Saving track information...`);
        
        // Get form values
        const title = document.getElementById('track-title').value || file.name.replace('.mp3', '');
        const artist = document.getElementById('track-artist').value || 'TildeSoundArt';
        
        // Get selected moods
        const selectedMoods = [];
        document.querySelectorAll('input[name="mood"]:checked').forEach(checkbox => {
            selectedMoods.push(checkbox.value);
        });
        
        // Get selected genres
        const selectedGenres = [];
        document.querySelectorAll('input[name="genre"]:checked').forEach(checkbox => {
            selectedGenres.push(checkbox.value);
        });
        
        // Get selected duration
        const selectedDuration = document.querySelector('input[name="duration"]:checked')?.value || 'medium';
        
        // Create track object
        const newTrack = {
            id: Date.now().toString(),
            title: title,
            artist: artist,
            src: `assets/tracks/${file.name}`,
            albumArt: 'assets/images/Tilde_Logo.png',
            mood: selectedMoods.length > 0 ? selectedMoods : ['unknown'],
            genre: selectedGenres.length > 0 ? selectedGenres : ['unknown'],
            duration: selectedDuration,
            dateAdded: new Date().toISOString()
        };

        // Add to tracks data
        this.tracksData.tracks.push(newTrack);
        this.tracksData.lastUpdated = new Date().toISOString();

        // Remove dialog
        document.body.removeChild(dialog);

        // Update progress
        this.updateProgressBar(90, `Finalizing upload...`);
        
        // Update the tracks.json content
        const trackLogContent = JSON.stringify(this.tracksData, null, 2);
        
        // Create a download link for the updated tracks.json
        const blob = new Blob([trackLogContent], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = 'tracks.json';
        
        // Update progress
        this.updateProgressBar(100, `Upload complete!`);
        
        // Show notification with instructions
        showNotification(`
            Track "${newTrack.title}" has been processed. To complete the upload:
            1. The tracks.json file will download automatically
            2. Replace the existing tracks.json in your GitHub repository
            3. Commit and push the changes to GitHub
            4. Place the audio file in the assets/tracks directory
        `, 'info', 10000);
        
        // Trigger download
        downloadLink.click();
        
        // Add to tracksData and update UI
        if (!tracksData.some(track => track.id === newTrack.id)) {
            tracksData.push(newTrack);
            filteredTracks = [...tracksData];
            renderTrackList();
        }

        showNotification(`Successfully processed ${file.name}`, 'success');
        
        // Clear current file
        this.currentUploadFile = null;
        
        // Hide progress bar after delay
        setTimeout(() => {
            this.hideProgressBar();
        }, 2000);
    }
    
    // Edit existing track metadata
    editTrack(trackId) {
        // Find the track in tracksData
        const track = this.tracksData.tracks.find(t => t.id === trackId);
        if (!track) {
            showNotification('Track not found', 'error');
            return;
        }
        
        // Show the edit dialog with current values
        this.showEditTrackDialog(track);
    }
    
    showEditTrackDialog(track) {
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'upload-dialog';
        dialog.id = 'edit-track-dialog';

        // Define available moods and genres
        const availableMoods = ['happy', 'sad', 'energetic', 'calm', 'dark', 'bright', 'upbeat', 'melancholic', 'technology', 'modern'];
        const availableGenres = ['pop', 'rock', 'electronic', 'classical', 'jazz', 'hiphop', 'ambient', 'indie', 'folk', 'funk'];
        const availableDurations = ['short', 'medium', 'long'];

        // Create dialog content
        dialog.innerHTML = `
            <div class="upload-dialog-content">
                <h3>Edit Track Details</h3>
                
                <div class="upload-form">
                    <div class="form-group">
                        <label for="edit-track-title">Title</label>
                        <input type="text" id="edit-track-title" value="${track.title}" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-track-artist">Artist</label>
                        <input type="text" id="edit-track-artist" value="${track.artist}" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Mood</label>
                        <div class="tag-selection mood-selection">
                            ${availableMoods.map(mood => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="edit-mood" value="${mood}" ${track.mood.includes(mood) ? 'checked' : ''}>
                                    <span>${mood}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Genre</label>
                        <div class="tag-selection genre-selection">
                            ${availableGenres.map(genre => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="edit-genre" value="${genre}" ${track.genre.includes(genre) ? 'checked' : ''}>
                                    <span>${genre}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Duration</label>
                        <div class="tag-selection duration-selection">
                            ${availableDurations.map(duration => `
                                <label class="tag-checkbox">
                                    <input type="radio" name="edit-duration" value="${duration}" ${track.duration === duration ? 'checked' : ''}>
                                    <span>${duration}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="dialog-buttons">
                    <button id="cancel-edit-btn" class="btn">Cancel</button>
                    <button id="update-track-btn" class="btn btn-primary">Save Changes</button>
                </div>
            </div>
        `;

        // Add dialog to the document
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        document.getElementById('update-track-btn').addEventListener('click', () => {
            this.updateTrack(track.id, dialog);
        });
    }
    
    updateTrack(trackId, dialog) {
        // Create progress indicator
        this.createProgressBar();
        this.updateProgressBar(30, "Updating track information...");
        
        // Find track in data
        const trackIndex = this.tracksData.tracks.findIndex(t => t.id === trackId);
        if (trackIndex === -1) {
            showNotification('Track not found', 'error');
            document.body.removeChild(dialog);
            this.hideProgressBar();
            return;
        }
        
        // Get form values
        const title = document.getElementById('edit-track-title').value;
        const artist = document.getElementById('edit-track-artist').value;
        
        // Get selected moods
        const selectedMoods = [];
        document.querySelectorAll('input[name="edit-mood"]:checked').forEach(checkbox => {
            selectedMoods.push(checkbox.value);
        });
        
        // Get selected genres
        const selectedGenres = [];
        document.querySelectorAll('input[name="edit-genre"]:checked').forEach(checkbox => {
            selectedGenres.push(checkbox.value);
        });
        
        // Get selected duration
        const selectedDuration = document.querySelector('input[name="edit-duration"]:checked')?.value || 'medium';
        
        // Update progress
        this.updateProgressBar(60, "Saving changes...");
        
        // Update track data
        this.tracksData.tracks[trackIndex] = {
            ...this.tracksData.tracks[trackIndex],
            title: title,
            artist: artist,
            mood: selectedMoods.length > 0 ? selectedMoods : ['unknown'],
            genre: selectedGenres.length > 0 ? selectedGenres : ['unknown'],
            duration: selectedDuration,
            lastModified: new Date().toISOString()
        };
        
        this.tracksData.lastUpdated = new Date().toISOString();
        
        // Remove dialog
        document.body.removeChild(dialog);
        
        // Update the tracks.json content
        const trackLogContent = JSON.stringify(this.tracksData, null, 2);
        
        // Create a download link for the updated tracks.json
        const blob = new Blob([trackLogContent], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = 'tracks.json';
        
        // Update progress
        this.updateProgressBar(90, "Finalizing changes...");
        
        // Show notification with instructions
        showNotification(`
            Track "${this.tracksData.tracks[trackIndex].title}" has been updated. To save changes:
            1. The updated tracks.json file will download automatically
            2. Replace the existing tracks.json in your GitHub repository
            3. Commit and push the changes to GitHub
        `, 'info', 10000);
        
        // Trigger download
        downloadLink.click();
        
        // Update progress
        this.updateProgressBar(100, "Update complete!");
        
        // Update local tracksData and UI
        const localTrackIndex = tracksData.findIndex(t => t.id === trackId);
        if (localTrackIndex !== -1) {
            tracksData[localTrackIndex] = { ...this.tracksData.tracks[trackIndex] };
            filteredTracks = [...tracksData];
            renderTrackList();
        }

        showNotification(`Successfully updated track "${title}"`, 'success');
        
        // Hide progress bar after delay
        setTimeout(() => {
            this.hideProgressBar();
        }, 2000);
    }

    // Get formatted track list for export
    getFormattedTrackList() {
        return this.tracksData.tracks.map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            src: track.src,
            dateAdded: track.dateAdded
        }));
    }
}

// Initialize upload handler
const uploadHandler = new UploadHandler();

// Add drag and drop support
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.createElement('div');
    dropZone.id = 'upload-drop-zone';
    dropZone.className = 'upload-drop-zone';
    dropZone.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <p>Drag and drop audio files here or click to upload</p>
        <input type="file" id="file-input" accept="audio/*" multiple style="display: none">
    `;

    document.querySelector('.player-container').appendChild(dropZone);

    const fileInput = dropZone.querySelector('#file-input');

    // Handle drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        uploadHandler.handleFileUpload(files);
    });

    // Handle click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        uploadHandler.handleFileUpload(e.target.files);
    });

    // Add edit button to each track
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-track-btn')) {
            const trackId = e.target.closest('.track-item').dataset.trackId;
            uploadHandler.editTrack(trackId);
        }
    });
}); 