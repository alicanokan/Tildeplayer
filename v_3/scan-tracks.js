/**
 * Auto-Scan Tracks Directory
 * This script scans all MP3 files in the tracks directory and generates an updated knownfiles.json
 * 
 * How to use:
 * 1. Make sure you're running this from the project root (where the index.html file is)
 * 2. Open your terminal/command prompt
 * 3. Run: node scan-tracks.js
 * 4. The script will generate an updated knownfiles.json file with all your track files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const tracksDir = 'assets/tracks';
const outputFile = path.join(tracksDir, 'knownfiles.json');

// Function to scan directory for MP3 files
function scanDirectory(directory) {
    console.log(`Scanning directory: ${directory}`);
    
    try {
        // Read the directory
        const files = fs.readdirSync(directory);
        
        // Filter for MP3 files and sort them alphabetically
        const mp3Files = files
            .filter(file => file.toLowerCase().endsWith('.mp3'))
            .sort((a, b) => {
                // Custom sort: First ID Music, then Media Sound, then others
                const aIsIDMusic = a.startsWith('ID Music');
                const bIsIDMusic = b.startsWith('ID Music');
                const aIsMediaSound = a.startsWith('Media Sound');
                const bIsMediaSound = b.startsWith('Media Sound');
                
                // First sort by category
                if (aIsIDMusic && !bIsIDMusic) return -1;
                if (!aIsIDMusic && bIsIDMusic) return 1;
                if (aIsMediaSound && !bIsMediaSound && !bIsIDMusic) return -1;
                if (!aIsMediaSound && bIsMediaSound && !aIsIDMusic) return 1;
                
                // Then sort numerically within each category
                if (aIsIDMusic && bIsIDMusic) {
                    const aMatch = a.match(/ID Music (\d+)/);
                    const bMatch = b.match(/ID Music (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                }
                
                if (aIsMediaSound && bIsMediaSound) {
                    const aMatch = a.match(/Media Sound (\d+)/);
                    const bMatch = b.match(/Media Sound (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                }
                
                // Default to alphabetical
                return a.localeCompare(b);
            });
        
        console.log(`Found ${mp3Files.length} MP3 files`);
        return mp3Files;
    } catch (error) {
        console.error(`Error scanning directory: ${error.message}`);
        return [];
    }
}

// Function to create knownfiles.json
function createKnownFilesJson(files) {
    console.log('Creating knownfiles.json...');
    
    // Create the array of file entries
    const knownFiles = files.map((filename, index) => ({
        index: index + 1,
        filename: filename
    }));
    
    // Format the JSON with indentation for readability
    const jsonContent = JSON.stringify(knownFiles, null, 2);
    
    // Write to the output file
    try {
        fs.writeFileSync(outputFile, jsonContent);
        console.log(`Successfully wrote ${knownFiles.length} files to ${outputFile}`);
        
        // Also make a backup of the file
        const backupFile = outputFile + '.backup';
        fs.writeFileSync(backupFile, jsonContent);
        console.log(`Created backup at ${backupFile}`);
        
        return true;
    } catch (error) {
        console.error(`Error writing output file: ${error.message}`);
        return false;
    }
}

// Function to update tracks.json to include all files
function updateTracksJson(mp3Files) {
    const tracksJsonPath = path.join(tracksDir, 'tracks.json');
    
    try {
        // Check if tracks.json exists
        if (!fs.existsSync(tracksJsonPath)) {
            console.warn('tracks.json not found, will not update it');
            return false;
        }
        
        // Read the existing tracks.json
        const tracksJsonContent = fs.readFileSync(tracksJsonPath, 'utf8');
        const tracksData = JSON.parse(tracksJsonContent);
        
        if (!tracksData.tracks || !Array.isArray(tracksData.tracks)) {
            console.warn('tracks.json has invalid format, will not update it');
            return false;
        }
        
        const existingTracks = tracksData.tracks;
        console.log(`Found ${existingTracks.length} existing tracks in tracks.json`);
        
        // Function to get title from filename
        function getTitleFromFilename(filename) {
            // Remove file extension
            let title = filename.replace(/\.mp3$/, '');
            
            // Extract parts in parentheses if present
            const parenthesesMatch = title.match(/\(([^)]+)\)/);
            if (parenthesesMatch) {
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
        
        // Function to guess mood and genre
        function guessMoodAndGenre(filename) {
            const lowerFilename = filename.toLowerCase();
            const result = {
                mood: ["energetic"],
                genre: ["electronic"],
                duration: "medium"
            };
            
            // Detect mood and genre
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
            }
            
            // Detect duration
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
        
        // Process all files
        const allTracks = [];
        let newTracksCount = 0;
        
        mp3Files.forEach((filename, index) => {
            // Check if this track exists in the existing tracks
            const existingTrack = existingTracks.find(track => 
                track.src && track.src.includes(filename)
            );
            
            if (existingTrack) {
                // Use existing track data but update the ID
                existingTrack.id = (index + 1).toString();
                allTracks.push(existingTrack);
            } else {
                // Create a new track entry
                const moodAndGenre = guessMoodAndGenre(filename);
                
                // Determine title
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
                newTracksCount++;
            }
        });
        
        console.log(`Added ${newTracksCount} new tracks to tracks.json`);
        
        // Update the tracks data
        tracksData.tracks = allTracks;
        tracksData.lastUpdated = new Date().toISOString();
        
        // Write the updated tracks.json
        const updatedJsonContent = JSON.stringify(tracksData, null, 2);
        
        // Make a backup of tracks.json first
        const backupTracksFile = tracksJsonPath + '.backup';
        fs.writeFileSync(backupTracksFile, tracksJsonContent);
        console.log(`Created backup of tracks.json at ${backupTracksFile}`);
        
        // Write the updated file
        fs.writeFileSync(tracksJsonPath, updatedJsonContent);
        console.log(`Successfully updated tracks.json with ${allTracks.length} tracks`);
        
        return true;
    } catch (error) {
        console.error(`Error updating tracks.json: ${error.message}`);
        return false;
    }
}

// Main function
function main() {
    console.log('Starting automatic track scanning process...');
    
    // Make sure the tracks directory exists
    if (!fs.existsSync(tracksDir)) {
        console.error(`Tracks directory not found: ${tracksDir}`);
        return;
    }
    
    // Scan for MP3 files
    const mp3Files = scanDirectory(tracksDir);
    
    if (mp3Files.length === 0) {
        console.error('No MP3 files found!');
        return;
    }
    
    // Create knownfiles.json
    const knownFilesResult = createKnownFilesJson(mp3Files);
    
    // Update tracks.json
    const tracksJsonResult = updateTracksJson(mp3Files);
    
    console.log('\nSummary:');
    console.log(`- Found ${mp3Files.length} MP3 files`);
    console.log(`- knownfiles.json update: ${knownFilesResult ? 'Success' : 'Failed'}`);
    console.log(`- tracks.json update: ${tracksJsonResult ? 'Success' : 'Failed'}`);
    console.log('\nProcess complete!');
}

// Run the main function
main(); 