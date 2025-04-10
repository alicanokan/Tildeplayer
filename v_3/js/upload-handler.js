// Client-side upload handler for Tildeplayer
class UploadHandler {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.localTracks = JSON.parse(localStorage.getItem('localTracks') || '[]');
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
                const trackUrl = URL.createObjectURL(file);
                const newTrack = {
                    id: Date.now() + Math.random(), // Ensure unique ID
                    title: file.name.replace('.mp3', ''),
                    artist: 'Local Upload',
                    src: trackUrl,
                    originalFile: file,
                    albumArt: 'assets/images/Tilde_Logo.png',
                    mood: ['unknown'],
                    genre: ['unknown'],
                    duration: 'unknown',
                    isLocalTrack: true
                };

                // Add to local tracks
                this.localTracks.push(newTrack);
                localStorage.setItem('localTracks', JSON.stringify(this.localTracks));

                // Add to tracksData and update UI
                if (!tracksData.some(track => track.id === newTrack.id)) {
                    tracksData.push(newTrack);
                    filteredTracks = [...tracksData];
                    renderTrackList();
                }

                showNotification(`Successfully added ${file.name}`, 'success');
            } catch (error) {
                console.error('Error processing file:', error);
                showNotification(`Failed to process ${file.name}: ${error.message}`, 'error');
            }
        }
    }

    // Load previously uploaded local tracks
    loadLocalTracks() {
        this.localTracks.forEach(track => {
            if (!tracksData.some(t => t.id === track.id)) {
                tracksData.push(track);
            }
        });
        filteredTracks = [...tracksData];
        renderTrackList();
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

    // Load any previously uploaded tracks
    uploadHandler.loadLocalTracks();
}); 