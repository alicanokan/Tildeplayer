/**
 * Browser-based Track Scanner
 * This script scans for MP3 files in the tracks folder and generates an updated knownfiles.json
 * 
 * How to use:
 * 1. Open the test-refresh.html page in your browser
 * 2. Open the browser console (F12 or right-click > Inspect > Console)
 * 3. Copy and paste this entire script into the console
 * 4. The script will scan the tracks directory and generate a new knownfiles.json file
 */

(async function() {
    console.log('Starting browser-based track scanning process...');
    
    // Function to fetch all files in the tracks directory
    async function fetchDirectoryContents() {
        console.log('Fetching directory contents...');
        
        // First we'll try to use the fetch API to get a directory listing
        // This may not work in all environments due to security restrictions
        try {
            const response = await fetch('assets/tracks/');
            
            // If we get a successful response
            if (response.ok) {
                const html = await response.text();
                
                // Parse the HTML to extract filenames
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Look for links which are typically used in directory listings
                const links = Array.from(doc.querySelectorAll('a'));
                
                // Extract filenames from the links
                const filenames = links
                    .map(link => link.href)
                    .filter(href => href.endsWith('.mp3'))
                    .map(href => href.split('/').pop());
                
                if (filenames.length > 0) {
                    console.log(`Found ${filenames.length} MP3 files via directory listing`);
                    return filenames;
                }
            }
        } catch (error) {
            console.warn('Directory listing failed, will try fallback method:', error);
        }
        
        // Fallback: Try to load tracks.json and extract the filenames
        try {
            const response = await fetch('assets/tracks/tracks.json');
            if (response.ok) {
                const data = await response.json();
                
                if (data.tracks && Array.isArray(data.tracks)) {
                    const filenames = data.tracks
                        .filter(track => track.src && track.src.includes('.mp3'))
                        .map(track => {
                            // Extract just the filename from the full path
                            const parts = track.src.split('/');
                            return parts[parts.length - 1];
                        });
                    
                    console.log(`Found ${filenames.length} MP3 files from tracks.json`);
                    return filenames;
                }
            }
        } catch (error) {
            console.warn('Failed to extract filenames from tracks.json:', error);
        }
        
        // Second fallback: Try to manually check known patterns of files
        console.log('Trying manual file discovery...');
        
        // Create a list of possible filenames based on patterns
        const possibleFiles = [];
        
        // Check ID Music files (1-50)
        for (let i = 1; i <= 50; i++) {
            possibleFiles.push(`ID Music ${i} - (PLACEHOLDER).mp3`);
        }
        
        // Check Media Sound files (1-50)
        for (let i = 1; i <= 50; i++) {
            possibleFiles.push(`Media Sound ${i} - (PLACEHOLDER).mp3`);
            
            // Also check different durations
            possibleFiles.push(`Media Sound ${i} - 15 sec. (PLACEHOLDER).mp3`);
            possibleFiles.push(`Media Sound ${i} - 30 sec. (PLACEHOLDER).mp3`);
            possibleFiles.push(`Media Sound ${i} - 60 sec. (PLACEHOLDER).mp3`);
            possibleFiles.push(`Media Sound ${i} - 90 sec. (PLACEHOLDER).mp3`);
            possibleFiles.push(`Media Sound ${i} - Loop vs. (PLACEHOLDER).mp3`);
        }
        
        // Test each possible file by trying to fetch it
        const foundFiles = [];
        const testPromises = [];
        
        for (const possibleFile of possibleFiles) {
            const testPromise = (async () => {
                try {
                    // Try to load a small part of the file to see if it exists
                    const response = await fetch(`assets/tracks/${possibleFile}`, {
                        method: 'HEAD',
                        cache: 'no-store'
                    });
                    
                    if (response.ok) {
                        foundFiles.push(possibleFile);
                    }
                } catch (error) {
                    // Ignore errors for files that don't exist
                }
            })();
            
            testPromises.push(testPromise);
        }
        
        // Wait for all tests to complete
        await Promise.all(testPromises);
        
        console.log(`Found ${foundFiles.length} MP3 files via manual testing`);
        return foundFiles;
    }
    
    // Function to scan for MP3 files
    async function scanForMp3Files() {
        // Get tracks from the current page content
        const allTrackElements = document.querySelectorAll('.track-item');
        const filesFromDOM = [];
        
        // Extract filenames from DOM elements
        allTrackElements.forEach(element => {
            const sourceEl = element.querySelector('small');
            if (sourceEl && sourceEl.textContent) {
                const src = sourceEl.textContent.trim();
                if (src.endsWith('.mp3')) {
                    const parts = src.split('/');
                    const filename = parts[parts.length - 1];
                    filesFromDOM.push(filename);
                }
            }
        });
        
        if (filesFromDOM.length > 0) {
            console.log(`Found ${filesFromDOM.length} MP3 files from current page DOM`);
            return filesFromDOM;
        }
        
        // Try other methods to get filenames
        return await fetchDirectoryContents();
    }
    
    // Main scan function
    async function performScan() {
        // Get all MP3 filenames
        const mp3Files = await scanForMp3Files();
        
        if (!mp3Files || mp3Files.length === 0) {
            console.error('No MP3 files found! Cannot continue.');
            return;
        }
        
        console.log(`Found ${mp3Files.length} MP3 files in total`);
        
        // Sort the files by type and number
        mp3Files.sort((a, b) => {
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
        
        // Create knownfiles.json content
        const knownFiles = mp3Files.map((filename, index) => ({
            index: index + 1,
            filename: filename
        }));
        
        // Create JSON string
        const jsonString = JSON.stringify(knownFiles, null, 2);
        
        // Create download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'knownfiles.json';
        downloadLink.textContent = 'Download new knownfiles.json';
        downloadLink.style.padding = '10px 20px';
        downloadLink.style.backgroundColor = '#4CAF50';
        downloadLink.style.color = 'white';
        downloadLink.style.borderRadius = '4px';
        downloadLink.style.cursor = 'pointer';
        downloadLink.style.display = 'inline-block';
        downloadLink.style.textDecoration = 'none';
        downloadLink.style.margin = '20px 0';
        
        // Create results container
        const container = document.createElement('div');
        container.style.padding = '20px';
        container.style.backgroundColor = '#f5f5f5';
        container.style.border = '1px solid #ddd';
        container.style.borderRadius = '4px';
        container.style.margin = '20px 0';
        
        const heading = document.createElement('h3');
        heading.textContent = `Generated knownfiles.json with ${mp3Files.length} files`;
        
        const instructions = document.createElement('p');
        instructions.innerHTML = `
            <ol>
                <li>Click the button below to download the new knownfiles.json file</li>
                <li>Place this file in your <code>assets/tracks</code> directory</li>
                <li>Refresh the page and use the "Force Refresh" button to reload all tracks</li>
            </ol>
        `;
        
        // Show the files found
        const filesList = document.createElement('details');
        filesList.style.marginBottom = '15px';
        
        const summary = document.createElement('summary');
        summary.textContent = 'View all files found (click to expand)';
        summary.style.cursor = 'pointer';
        summary.style.fontWeight = 'bold';
        
        const filesContent = document.createElement('pre');
        filesContent.style.maxHeight = '300px';
        filesContent.style.overflow = 'auto';
        filesContent.style.backgroundColor = '#eee';
        filesContent.style.padding = '10px';
        filesContent.style.borderRadius = '4px';
        filesContent.style.fontSize = '12px';
        filesContent.textContent = mp3Files.join('\n');
        
        filesList.appendChild(summary);
        filesList.appendChild(filesContent);
        
        // Assemble the container
        container.appendChild(heading);
        container.appendChild(instructions);
        container.appendChild(filesList);
        container.appendChild(downloadLink);
        
        // Add to page
        document.body.appendChild(container);
        
        console.log('Scan complete!');
        console.log(`Generated knownfiles.json with ${mp3Files.length} files`);
        console.log('JSON content:');
        console.log(jsonString);
        
        return {
            files: mp3Files,
            json: jsonString
        };
    }
    
    // Run the scan
    return await performScan();
})(); 