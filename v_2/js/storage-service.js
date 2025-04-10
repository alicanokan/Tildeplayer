// Storage Service for TildeSoundArt Player
class StorageService {
    constructor() {
        // Your Gist ID
        this.GIST_ID = 'f308c693f01b8cf73beabd0dca6655b8';
        this.isGitHub = window.location.hostname.includes('github.io');
        
        // Add initialization to check if we need to perform initial sync
        this.initializeStorage();
    }
    
    // Initialize storage and perform any needed syncing
    async initializeStorage() {
        console.log("Initializing storage service");
        console.log("Storage mode:", this.isGitHub ? "GitHub Gist" : "Local Storage");
        
        // If running on GitHub, try to get data from Gist and sync to localStorage
        if (this.isGitHub) {
            try {
                // This will help ensure localStorage is synced with Gist data
                await this.syncFromGistToLocal();
            } catch (error) {
                console.error("Error during initial Gist-to-Local sync:", error);
            }
        }
    }
    
    // New method to sync data from Gist to localStorage
    async syncFromGistToLocal() {
        try {
            console.log("Syncing data from Gist to localStorage...");
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`);
            const gist = await response.json();
            
            if (gist.files && gist.files['tildeplayer_data.json']) {
                const allData = JSON.parse(gist.files['tildeplayer_data.json'].content);
                console.log("Data from Gist:", Object.keys(allData));
                
                // Sync each key to localStorage
                for (const [key, value] of Object.entries(allData)) {
                    this.saveToLocalStorage(key, value);
                    console.log(`Synced ${key} from Gist to localStorage`);
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error syncing from Gist to localStorage:", error);
            return false;
        }
    }

    async saveData(key, data) {
        let saveSuccess = false;
        
        // Always try to save to localStorage first for performance
        const localSaveSuccess = this.saveToLocalStorage(key, data);
        
        // If on GitHub, also save to Gist
        if (this.isGitHub) {
            try {
                saveSuccess = await this.saveToGist(key, data);
                console.log(`Saved ${key} to Gist:`, saveSuccess);
            } catch (error) {
                console.error(`Error saving ${key} to Gist:`, error);
                saveSuccess = localSaveSuccess;
            }
        } else {
            saveSuccess = localSaveSuccess;
        }
        
        return saveSuccess;
    }

    async loadData(key) {
        let data = null;
        
        // Always try localStorage first for performance
        data = this.loadFromLocalStorage(key);
        
        // If not found in localStorage and on GitHub, try Gist
        if (data === null && this.isGitHub) {
            try {
                console.log(`Data for ${key} not found in localStorage, trying Gist...`);
                data = await this.loadFromGist(key);
                
                // If found in Gist, update localStorage for next time
                if (data !== null) {
                    console.log(`Found ${key} in Gist, updating localStorage`);
                    this.saveToLocalStorage(key, data);
                }
            } catch (error) {
                console.error(`Error loading ${key} from Gist:`, error);
            }
        }
        
        return data;
    }

    // LocalStorage methods
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    // GitHub Gist methods
    async saveToGist(key, data) {
        try {
            // First, get the current gist content
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`);
            const gist = await response.json();

            // Get the current data or initialize new
            let allData = {};
            if (gist.files && gist.files['tildeplayer_data.json']) {
                allData = JSON.parse(gist.files['tildeplayer_data.json'].content);
            }

            // Update the specific key
            allData[key] = data;
            allData.lastUpdated = new Date().toISOString();

            // Prepare the update
            const files = {
                'tildeplayer_data.json': {
                    content: JSON.stringify(allData, null, 2)
                }
            };

            // Update the gist
            const updateResponse = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ files })
            });

            return updateResponse.ok;
        } catch (error) {
            console.error('Error saving to Gist:', error);
            // Fallback to localStorage if Gist save fails
            return this.saveToLocalStorage(key, data);
        }
    }

    async loadFromGist(key) {
        try {
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`);
            const gist = await response.json();

            if (gist.files && gist.files['tildeplayer_data.json']) {
                const allData = JSON.parse(gist.files['tildeplayer_data.json'].content);
                return allData[key] || null;
            }
            return null;
        } catch (error) {
            console.error('Error loading from Gist:', error);
            // Fallback to localStorage if Gist load fails
            return this.loadFromLocalStorage(key);
        }
    }

    // Helper method to check if running on GitHub Pages
    isRunningOnGitHub() {
        return this.isGitHub;
    }
    
    // Helper method to explicitly sync between storage types
    async syncAllData() {
        if (this.isGitHub) {
            return this.syncFromGistToLocal();
        }
        return true;
    }
}

// Create and make the singleton instance globally available
const storageService = new StorageService();

// Make it available globally instead of using exports
if (typeof window !== 'undefined') {
    window.storageService = storageService;
} 