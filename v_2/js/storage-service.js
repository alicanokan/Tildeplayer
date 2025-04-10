// Storage Service for TildeSoundArt Player
class StorageService {
    constructor() {
        // Your Gist ID
        this.GIST_ID = 'f308c693f01b8cf73beabd0dca6655b8';
        this.isGitHub = window.location.hostname.includes('github.io');
    }

    async saveData(key, data) {
        if (this.isGitHub) {
            return this.saveToGist(key, data);
        } else {
            return this.saveToLocalStorage(key, data);
        }
    }

    async loadData(key) {
        if (this.isGitHub) {
            return this.loadFromGist(key);
        } else {
            return this.loadFromLocalStorage(key);
        }
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
}

// Create and make the singleton instance globally available
const storageService = new StorageService();

// Make it available globally instead of using exports
if (typeof window !== 'undefined') {
    window.storageService = storageService;
} 