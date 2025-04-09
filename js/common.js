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
    if (path && path.startsWith('@audio/')) {
        return path.substring(7); // Remove the '@audio/' prefix
    }
    return path;
}

// Convert relative @audio/ path to absolute URL
function convertAudioPathToUrl(path) {
    if (path && path.startsWith('@audio/')) {
        const filename = getFilenameFromPath(path);
        const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        return basePath + '@audio/' + filename;
    }
    return path;
} 