// Function to show notification messages to the user
function showNotification(message, type = 'info') {
    console.log(`Notification: ${message} (${type})`);
    // You can implement a more sophisticated notification system here
    // For now, we'll just alert the message
    alert(message);
}

// Client-side upload handler for Tildeplayer
class UploadHandler {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.tracksData = null;
        this.currentUploadFile = null;
        this.loadTracksData();
        this.addRefreshButton();
        
        // Make refresh function globally accessible
        window.refreshTracks = this.refreshTracksData.bind(this);
        
        // Add a global refreshTracksData function that will be accessible from anywhere
        window.refreshTracksData = () => {
            console.log('Global refresh tracks data called');
            this.refreshTracksData();
        };
        
        // Add a global forceRefresh function that will be accessible from anywhere
        window.forceRefresh = () => {
            console.log('Global force refresh called');
            this.forceRefresh();
        };
    }

    async loadTracksData() {
        try {
            // Add cache-busting parameter to prevent browser caching
            const cacheBuster = `?cb=${Date.now()}`;
            const response = await fetch('assets/tracks/tracks.json' + cacheBuster);
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

    // Add a refresh button to the UI
    addRefreshButton() {
        // Check if button already exists
        if (document.getElementById('refresh-tracks-btn')) return;

        const button = document.createElement('button');
        button.id = 'refresh-tracks-btn';
        button.className = 'refresh-tracks-btn';
        button.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Tracks';
        button.title = 'Reload tracks data without clearing cache';
        
        // Add event listener
        button.addEventListener('click', () => {
            this.refreshTracksData();
        });
        
        // Add to the document - placing it near the upload zone
        const playerContainer = document.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.appendChild(button);
            
            // Also add Force Refresh button
            const forceRefreshBtn = document.createElement('button');
            forceRefreshBtn.id = 'force-refresh-btn';
            forceRefreshBtn.className = 'force-refresh-btn';
            forceRefreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Force Refresh';
            forceRefreshBtn.title = 'Refresh tracks completely bypassing browser cache (use when regular refresh is not showing latest changes)';
            
            // Add event listener for force refresh
            forceRefreshBtn.addEventListener('click', () => {
                this.forceRefresh();
            });
            
            // Place it near the regular refresh button
            playerContainer.appendChild(forceRefreshBtn);
            
            // Add help icon for explaining refresh options
            const helpIcon = document.createElement('div');
            helpIcon.id = 'refresh-help-icon';
            helpIcon.className = 'refresh-help-icon';
            helpIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
            helpIcon.title = 'Click for information about refresh options';
            playerContainer.appendChild(helpIcon);
            
            // Add click event to show tooltip explaining refresh options
            helpIcon.addEventListener('click', () => {
                showNotification(`
                    <strong>Refresh Options:</strong>
                    <ul>
                        <li><strong>Refresh Tracks</strong>: Standard refresh that may use cached data</li>
                        <li><strong>Force Refresh</strong>: Completely bypasses browser cache for the latest data</li>
                    </ul>
                    <p><strong>Keyboard Shortcuts:</strong></p>
                    <ul>
                        <li>Ctrl/Cmd + R: Standard refresh</li>
                        <li>Ctrl/Cmd + Shift + R: Global refresh</li>
                        <li>Ctrl/Cmd + Alt + R: Force refresh</li>
                    </ul>
                `, 'info', 8000);
            });
        }
        
        // Connect to existing Apply button if it exists
        document.addEventListener('DOMContentLoaded', () => {
            // Find the apply button using standard selectors and text content
            const findButtonByText = (text) => {
                return Array.from(document.querySelectorAll('button'))
                    .find(btn => btn.textContent.includes(text));
            };
            
            const applyButton = document.querySelector('#apply-tracks-btn') || 
                                findButtonByText('Apply Tracks to Player Page');
            
            if (applyButton) {
                applyButton.addEventListener('click', () => {
                    setTimeout(() => {
                        // Run refresh after a short delay to allow changes to propagate
                        window.refreshTracksData(); // Use the global function
                    }, 1000);
                });
            } else {
                // Try alternative selectors
                const possibleButtons = [
                    findButtonByText('Apply'),
                    findButtonByText('Apply Tracks'),
                    document.querySelector('[id*="apply"], [class*="apply"]'),
                    Array.from(document.querySelectorAll('button')).find(el => 
                        el.textContent.toLowerCase().includes('apply') || 
                        el.textContent.toLowerCase().includes('update')
                    )
                ].filter(Boolean);
                
                if (possibleButtons.length > 0) {
                    possibleButtons[0].addEventListener('click', () => {
                        setTimeout(() => {
                            window.refreshTracksData(); // Use the global function
                        }, 1000);
                    });
                }
            }
            
            // Also add listener for the keyboard shortcut
            if (this.setupKeyboardShortcut) {
                this.setupKeyboardShortcut();
            }
        });
    }
    
    // Refresh tracks data without clearing cache
    async refreshTracksData() {
        const refreshButton = document.getElementById('refresh-tracks-btn');
        
        // Add spinning animation to button
        if (refreshButton) {
            refreshButton.classList.add('refreshing');
            refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            refreshButton.disabled = true;
        }
        
        // Show notification
        showNotification('Refreshing tracks data...', 'info');
        
        try {
            // Force reload the tracks data with cache-busting
            const cacheBuster = `?cb=${Date.now()}`;
            const response = await fetch('assets/tracks/tracks.json' + cacheBuster);
            
            if (!response.ok) {
                throw new Error('Failed to refresh tracks data');
            }
            
            this.tracksData = await response.json();
            
            // Clear existing tracks array
            tracksData.length = 0;
            
            // Reinitialize from log
            this.initializeTracksFromLog();
            
            // Show success notification
            showNotification('Tracks data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing tracks data:', error);
            showNotification('Failed to refresh tracks data: ' + error.message, 'error');
        } finally {
            // Reset button state
            if (refreshButton) {
                refreshButton.classList.remove('refreshing');
                refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Tracks';
                refreshButton.disabled = false;
            }
        }
    }

    // Add a method to handle keyboard shortcut for refreshing
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + R for refresh (prevent default browser refresh)
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault();
                this.refreshTracksData();
            }
            
            // Add a special keyboard shortcut for global refresh: Ctrl/Cmd + Shift + R
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'r') {
                event.preventDefault();
                console.log('Global refresh keyboard shortcut detected');
                this.refreshTracksData();
                showNotification('Tracks refreshed with keyboard shortcut!', 'success');
            }
            
            // Add a special keyboard shortcut for force refresh: Ctrl/Cmd + Alt + R
            if ((event.ctrlKey || event.metaKey) && event.altKey && event.key === 'r') {
                event.preventDefault();
                console.log('Force refresh keyboard shortcut detected');
                this.forceRefresh();
                showNotification('Force refresh initiated with keyboard shortcut!', 'info');
            }
        });
    }

    initializeTracksFromLog() {
        if (this.tracksData && this.tracksData.tracks) {
            // Clear existing tracks
            tracksData.length = 0;
            
            // Add tracks from the log
            this.tracksData.tracks.forEach(track => {
                if (!tracksData.some(t => t.id === track.id)) {
                    // Ensure consistent tag format (lowercase, trimmed)
                    if (track.mood) track.mood = track.mood.map(m => m.toLowerCase().trim());
                    if (track.genre) track.genre = track.genre.map(g => g.toLowerCase().trim());
                    
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

        // Define available moods and genres - must match the filters used in the player
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
                        <label>Mood (Select at least one)</label>
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
                        <label>Genre (Select at least one)</label>
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
            // Validation - ensure at least one mood and genre is selected
            const moodCount = document.querySelectorAll('input[name="mood"]:checked').length;
            const genreCount = document.querySelectorAll('input[name="genre"]:checked').length;
            
            if (moodCount === 0) {
                showNotification("Please select at least one mood", "error");
                return;
            }
            
            if (genreCount === 0) {
                showNotification("Please select at least one genre", "error");
                return;
            }
            
            this.processTrackWithTags(file, dialog);
        });

        // Set default values
        document.querySelectorAll('input[name="duration"]')[1].checked = true; // Default to medium
        
        // Default to some common mood and genre if none selected
        if (document.querySelectorAll('input[name="mood"]:checked').length === 0) {
            // Check the first one as default
            const firstMoodCheckbox = document.querySelector('input[name="mood"]');
            if (firstMoodCheckbox) firstMoodCheckbox.checked = true;
        }
        
        if (document.querySelectorAll('input[name="genre"]:checked').length === 0) {
            // Check the first one as default
            const firstGenreCheckbox = document.querySelector('input[name="genre"]');
            if (firstGenreCheckbox) firstGenreCheckbox.checked = true;
        }
    }

    processTrackWithTags(file, dialog) {
        // Update progress
        this.updateProgressBar(80, `Saving track information...`);
        
        // Get form values
        const title = document.getElementById('track-title').value || file.name.replace('.mp3', '');
        const artist = document.getElementById('track-artist').value || 'TildeSoundArt';
        
        // Get selected moods - ensure in lowercase for consistency
        const selectedMoods = [];
        document.querySelectorAll('input[name="mood"]:checked').forEach(checkbox => {
            selectedMoods.push(checkbox.value.toLowerCase().trim());
        });
        
        // Get selected genres - ensure in lowercase for consistency
        const selectedGenres = [];
        document.querySelectorAll('input[name="genre"]:checked').forEach(checkbox => {
            selectedGenres.push(checkbox.value.toLowerCase().trim());
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

        // Log the tag data to verify it's being captured
        console.log('New track tags:', {
            mood: newTrack.mood,
            genre: newTrack.genre,
            duration: newTrack.duration
        });

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

        // Add the file to the known files list if available
        if (window.addKnownFile && typeof window.addKnownFile === 'function') {
            window.addKnownFile(file.name);
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

        // Define available moods and genres - must match the filters used in the player
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
                        <label>Mood (Select at least one)</label>
                        <div class="tag-selection mood-selection">
                            ${availableMoods.map(mood => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="edit-mood" value="${mood}" ${track.mood && track.mood.includes(mood.toLowerCase()) ? 'checked' : ''}>
                                    <span>${mood}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Genre (Select at least one)</label>
                        <div class="tag-selection genre-selection">
                            ${availableGenres.map(genre => `
                                <label class="tag-checkbox">
                                    <input type="checkbox" name="edit-genre" value="${genre}" ${track.genre && track.genre.includes(genre.toLowerCase()) ? 'checked' : ''}>
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
            // Validation - ensure at least one mood and genre is selected
            const moodCount = document.querySelectorAll('input[name="edit-mood"]:checked').length;
            const genreCount = document.querySelectorAll('input[name="edit-genre"]:checked').length;
            
            if (moodCount === 0) {
                showNotification("Please select at least one mood", "error");
                return;
            }
            
            if (genreCount === 0) {
                showNotification("Please select at least one genre", "error");
                return;
            }
            
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
        
        // Get selected moods - ensure in lowercase for consistency
        const selectedMoods = [];
        document.querySelectorAll('input[name="edit-mood"]:checked').forEach(checkbox => {
            selectedMoods.push(checkbox.value.toLowerCase().trim());
        });
        
        // Get selected genres - ensure in lowercase for consistency
        const selectedGenres = [];
        document.querySelectorAll('input[name="edit-genre"]:checked').forEach(checkbox => {
            selectedGenres.push(checkbox.value.toLowerCase().trim());
        });
        
        // Get selected duration
        const selectedDuration = document.querySelector('input[name="edit-duration"]:checked')?.value || 'medium';
        
        // Update progress
        this.updateProgressBar(60, "Saving changes...");
        
        // Log the tag data to verify it's being captured
        console.log('Updated track tags:', {
            mood: selectedMoods,
            genre: selectedGenres,
            duration: selectedDuration
        });
        
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
            dateAdded: track.dateAdded,
            mood: track.mood || ['unknown'],
            genre: track.genre || ['unknown'],
            duration: track.duration || 'medium'
        }));
    }

    // Force refresh method to bypass browser cache
    forceRefresh() {
        const forceRefreshBtn = document.getElementById('force-refresh-btn');
        
        // Add spinning animation to button
        if (forceRefreshBtn) {
            forceRefreshBtn.classList.add('refreshing');
            forceRefreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            forceRefreshBtn.disabled = true;
        }
        
        // Show notification
        showNotification('Force refreshing tracks data...', 'info');
        
        // Add a cache-busting parameter to the fetch URL
        const cacheBuster = `?cb=${Date.now()}`;
        
        fetch(`assets/tracks/tracks.json${cacheBuster}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch tracks data');
                }
                return response.json();
            })
            .then(data => {
                console.log('Force refreshed tracks data:', data);
                
                // Update the tracks data
                this.tracksData = data;
                
                // Clear existing tracks array
                tracksData.length = 0;
                
                // Reinitialize from log
                this.initializeTracksFromLog();
                
                // Render the tracks list
                renderTrackList();
                
                // Show success notification
                showNotification('Tracks have been force refreshed from source!', 'success');
            })
            .catch(error => {
                console.error('Error during force refresh:', error);
                showNotification('Failed to force refresh tracks', 'error');
            })
            .finally(() => {
                // Reset button state
                if (forceRefreshBtn) {
                    forceRefreshBtn.classList.remove('refreshing');
                    forceRefreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Force Refresh';
                    forceRefreshBtn.disabled = false;
                }
            });
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
        if (e.target.classList.contains('edit-track-btn') || 
            (e.target.parentElement && e.target.parentElement.classList.contains('edit-track-btn'))) {
            const trackItem = e.target.closest('.track-item');
            if (trackItem) {
                const trackId = trackItem.dataset.trackId;
                uploadHandler.editTrack(trackId);
            }
        }
    });

    // Setup keyboard shortcuts - use the uploadHandler instance to call the method
    document.addEventListener('keydown', (e) => {
        // Check for Ctrl+R or Cmd+R (regular refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            uploadHandler.refreshTracksData();
            showNotification('Tracks refreshed!');
        }
        
        // Check for Ctrl+Shift+R or Cmd+Shift+R (global refresh)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            uploadHandler.refreshTracksData();
            showNotification('Global refresh performed!');
        }
    });
}); 