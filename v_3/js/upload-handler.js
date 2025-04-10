// Client-side upload handler for Tildeplayer
class UploadHandler {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.tracksData = null;
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

        for (const file of files) {
            if (!file.type.startsWith('audio/')) {
                showNotification(`${file.name} is not an audio file`, 'error');
                continue;
            }

            try {
                // Create a new track entry
                const newTrack = {
                    id: Date.now().toString(),
                    title: file.name.replace('.mp3', ''),
                    artist: 'TildeSoundArt',
                    src: `assets/tracks/${file.name}`,
                    albumArt: 'assets/images/Tilde_Logo.png',
                    mood: ['unknown'],
                    genre: ['unknown'],
                    duration: 'unknown',
                    dateAdded: new Date().toISOString()
                };

                // Add to tracks data
                this.tracksData.tracks.push(newTrack);
                this.tracksData.lastUpdated = new Date().toISOString();

                // Update the tracks.json content
                const trackLogContent = JSON.stringify(this.tracksData, null, 2);
                
                // Create a download link for the updated tracks.json
                const blob = new Blob([trackLogContent], { type: 'application/json' });
                const downloadUrl = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = downloadUrl;
                downloadLink.download = 'tracks.json';
                
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
            } catch (error) {
                console.error('Error processing file:', error);
                showNotification(`Failed to process ${file.name}: ${error.message}`, 'error');
            }
        }
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
}); 