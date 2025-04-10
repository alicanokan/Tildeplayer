/**
 * Helper script to update tracks.json with all MP3 files in the tracks directory
 * 
 * How to use:
 * 1. Open the test-refresh.html page
 * 2. Open browser console (F12 or right-click > Inspect > Console)
 * 3. Copy and paste this entire script into the console
 * 4. The script will generate a complete tracks.json with entries for all MP3 files
 */

(async function() {
    console.log('Starting tracks.json update process...');
    
    // First, get all known files from knownfiles.json
    let knownFiles = [];
    try {
        const response = await fetch('assets/tracks/knownfiles.json');
        if (!response.ok) {
            throw new Error(`Failed to load knownfiles.json: ${response.status} ${response.statusText}`);
        }
        
        knownFiles = await response.json();
        console.log(`Loaded ${knownFiles.length} known files from knownfiles.json`);
    } catch (error) {
        console.error('Error loading knownfiles.json:', error);
        return;
    }
    
    // Get existing tracks.json to preserve existing track metadata
    let existingTracks = [];
    try {
        const response = await fetch('assets/tracks/tracks.json');
        if (response.ok) {
            const data = await response.json();
            if (data.tracks && Array.isArray(data.tracks)) {
                existingTracks = data.tracks;
                console.log(`Loaded ${existingTracks.length} existing tracks from tracks.json`);
            }
        }
    } catch (error) {
        console.error('Error loading existing tracks.json (will create new one):', error);
    }
    
    // Create a function to generate friendly titles from filenames
    function getTitleFromFilename(filename) {
        // Remove file extension
        let title = filename.replace(/\.mp3$/, '');
        
        // Extract parts in parentheses if present
        const parenthesesMatch = title.match(/\(([^)]+)\)/);
        if (parenthesesMatch) {
            // Use what's in parentheses for better title
            return parenthesesMatch[1].replace(/_/g, ' ').trim();
        }
        
        // If no parentheses, use the part after the dash
        const dashMatch = title.match(/- (.+)$/);
        if (dashMatch) {
            return dashMatch[1].trim();
        }
        
        // Just return the filename as is
        return title;
    }
    
    // Determine mood and genre from filename patterns
    function guessMoodAndGenre(filename) {
        const lowerFilename = filename.toLowerCase();
        const result = {
            mood: ["energetic"],
            genre: ["electronic"],
            duration: "medium"
        };
        
        // Detect mood
        if (lowerFilename.includes('chill') || lowerFilename.includes('lofi')) {
            result.mood = ["chill", "relaxed"];
        } else if (lowerFilename.includes('rock')) {
            result.mood = ["energetic", "intense"];
            result.genre = ["rock"];
        } else if (lowerFilename.includes('optimistic')) {
            result.mood = ["happy", "energetic"];
        } else if (lowerFilename.includes('funk')) {
            result.mood = ["energetic", "happy"];
            result.genre = ["funk"];
        } else if (lowerFilename.includes('piano')) {
            result.mood = ["calm", "melancholic"];
            result.genre = ["classical", "ambient"];
        } else if (lowerFilename.includes('hiphop')) {
            result.mood = ["upbeat", "modern"];
            result.genre = ["hiphop"];
        } else if (lowerFilename.includes('ambient')) {
            result.mood = ["calm", "focus"];
            result.genre = ["ambient"];
        } else if (lowerFilename.includes('pop')) {
            result.mood = ["upbeat", "bright"];
            result.genre = ["pop"];
        } else if (lowerFilename.includes('future bass')) {
            result.mood = ["energetic", "upbeat"];
            result.genre = ["electronic", "future bass"];
        } else if (lowerFilename.includes('jazz')) {
            result.mood = ["calm", "sophisticated"];
            result.genre = ["jazz"];
        } else if (lowerFilename.includes('synth')) {
            result.mood = ["technology", "modern"];
            result.genre = ["electronic", "synthwave"];
        }
        
        // Detect duration based on filename
        if (lowerFilename.includes('15 sec')) {
            result.duration = "short";
        } else if (lowerFilename.includes('30 sec')) {
            result.duration = "medium";
        } else if (lowerFilename.includes('60 sec')) {
            result.duration = "long";
        } else if (lowerFilename.includes('90 sec') || lowerFilename.includes('loop')) {
            result.duration = "extended";
        }
        
        return result;
    }
    
    // Create an array to hold all track entries
    const allTracks = [];
    
    // Process each known file and create a track entry
    knownFiles.forEach((file, index) => {
        const filename = file.filename;
        
        // Skip non-MP3 files
        if (!filename.toLowerCase().endsWith('.mp3')) {
            return;
        }
        
        // Check if this track already exists in the existing tracks
        const existingTrack = existingTracks.find(track => 
            track.src && track.src.includes(filename)
        );
        
        if (existingTrack) {
            // Use existing track data but update the ID to match the new index
            existingTrack.id = (index + 1).toString();
            allTracks.push(existingTrack);
            return;
        }
        
        // Create a new track entry
        const moodAndGenre = guessMoodAndGenre(filename);
        
        // Determine title based on filename patterns
        let title = '';
        if (filename.startsWith('ID Music')) {
            const match = filename.match(/ID Music (\d+) - /);
            if (match) {
                title = `ID Music ${match[1]} - ${getTitleFromFilename(filename)}`;
            } else {
                title = getTitleFromFilename(filename);
            }
        } else if (filename.startsWith('Media Sound')) {
            const match = filename.match(/Media Sound (\d+) - /);
            if (match) {
                title = `Media Sound ${match[1]} - ${getTitleFromFilename(filename)}`;
            } else {
                title = getTitleFromFilename(filename);
            }
        } else {
            title = getTitleFromFilename(filename);
        }
        
        const newTrack = {
            id: (index + 1).toString(),
            title: title,
            artist: "TildeSoundArt",
            src: `assets/tracks/${filename}`,
            albumArt: "assets/images/Tilde_Logo.png",
            mood: moodAndGenre.mood,
            genre: moodAndGenre.genre,
            duration: moodAndGenre.duration
        };
        
        allTracks.push(newTrack);
    });
    
    console.log(`Created ${allTracks.length} track entries`);
    
    // Create the final JSON structure
    const tracksJson = {
        tracks: allTracks,
        lastUpdated: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(tracksJson, null, 2);
    
    // Log summary
    console.log(`Generated tracks.json with ${allTracks.length} tracks`);
    
    // Create a blob URL for downloading
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'tracks.json';
    downloadLink.textContent = 'Download updated tracks.json';
    downloadLink.style.padding = '10px 20px';
    downloadLink.style.backgroundColor = '#4CAF50';
    downloadLink.style.color = 'white';
    downloadLink.style.borderRadius = '4px';
    downloadLink.style.cursor = 'pointer';
    downloadLink.style.display = 'inline-block';
    downloadLink.style.textDecoration = 'none';
    downloadLink.style.margin = '20px 0';
    
    // Add instruction message
    const message = document.createElement('div');
    message.innerHTML = `
        <h3>tracks.json updated with ${allTracks.length} tracks</h3>
        <p>Click the button below to download the updated tracks.json file. After downloading:</p>
        <ol>
            <li>Place this file in your assets/tracks directory</li>
            <li>Refresh the player to see all tracks</li>
        </ol>
    `;
    
    // Add to page
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.borderRadius = '4px';
    container.style.margin = '20px 0';
    container.style.border = '1px solid #ddd';
    
    container.appendChild(message);
    container.appendChild(downloadLink);
    
    // Add to the page
    document.body.appendChild(container);
    
    // Also log the file to console for easy copy-paste
    console.log('tracks.json content:');
    console.log(jsonString);
    
    return "Tracks JSON generation complete!";
})(); 