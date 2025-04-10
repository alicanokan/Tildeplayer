// Common utility functions for the music player app

// Get the absolute path to the @audio directory
function getAudioDirectoryPath() {
    // Get the base path - this works whether we're on index.html or upload.html
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const audioDir = basePath + '@audio/';
    
    return audioDir;
}

// Check if a file exists in the @audio directory
// Note: This function cannot actually check if the file exists due to browser security restrictions,
// but it constructs the full URL that would point to the file
function getAudioFilePath(filename) {
    const audioDir = getAudioDirectoryPath();
    return audioDir + filename;
}

// Helper function to extract just the filename from an @audio/ path
function getFilenameFromPath(path) {
    return path.split('/').pop();
}

// Convert relative @audio/ path to absolute URL
function convertAudioPathToUrl(path) {
    // Remove the @audio/ prefix if present
    const filename = path.replace(/^@audio\//, '');
    
    // Check if we're running on GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        // Use the GitHub Pages URL structure
        const repoName = 'Tildeplayer'; // Your repository name
        return `/${repoName}/@audio/${filename}`;
    } else {
        // Local development - use relative path
        return `/@audio/${filename}`;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
} 