# Setting Up GitHub Gist Storage for TildePlayer

This guide explains how to configure your TildePlayer app to use GitHub Gist for storing track data, which allows you to have persistent storage when hosting on GitHub Pages.

## What is GitHub Gist?

GitHub Gist is a service from GitHub that allows you to share snippets of code. We can use it as a simple database to store your track metadata such as titles, artists, tags, and playlists.

## Why Use GitHub Gist?

When hosting your TildePlayer on GitHub Pages, you need a way to persistently store data. GitHub Gist provides:
- Easy storage of JSON data
- Access via GitHub's API
- No backend server required
- Works with GitHub Pages hosting

## Setup Instructions

### 1. Create a New GitHub Gist

1. Go to [https://gist.github.com/](https://gist.github.com/)
2. Sign in with your GitHub account if not already logged in
3. Create a new Gist:
   - **Filename**: `tildeplayer_data.json`
   - **Description**: "TildePlayer Data Storage"
   - **Content**: Use this basic structure:
   ```json
   {
     "tracks": [],
     "approvedTracks": [],
     "pendingTracks": [],
     "playlist": [],
     "lastUpdated": "2023-11-16T00:00:00Z"
   }
   ```
4. Make sure to select **Create public gist** (this is required for the API to work without authentication)
5. Click "Create public gist"

### 2. Get Your Gist ID

After creating the Gist, look at the URL in your browser. It will look something like:
```
https://gist.github.com/yourusername/abcdef1234567890
```

The Gist ID is the alphanumeric string at the end (in this example: `abcdef1234567890`).

### 3. Update Your TildePlayer Configuration

1. Open the file `js/storage-service.js` in your TildePlayer project
2. Find the constructor at the top of the file
3. Replace the placeholder Gist ID with your own:

```javascript
constructor() {
    // Replace YOUR_GIST_ID_HERE with your actual Gist ID
    this.GIST_ID = 'YOUR_GIST_ID_HERE';
    this.isGitHub = window.location.hostname.includes('github.io');
    
    // Add initialization to check if we need to perform initial sync
    this.initializeStorage();
}
```

### 4. Host on GitHub Pages

The GitHub Gist storage will automatically activate when your site is hosted on GitHub Pages.

1. Push your changes to your GitHub repository
2. Set up GitHub Pages in your repository settings
3. When the site is accessed via `yourusername.github.io`, it will automatically detect GitHub Pages hosting and use the Gist for storage

### 5. Testing Your Integration

1. After deploying, visit your GitHub Pages site
2. Upload a track or add a track to your playlist
3. Refresh the page - your data should persist
4. You can also check your Gist directly to see if the data was updated

## Troubleshooting

- **Data not saving**: Make sure your Gist is public
- **API errors**: Check browser console for details about any errors
- **Gist not updating**: Verify your Gist ID is correct
- **CORS errors**: These are expected when testing locally; the GitHub integration only works fully when hosted on GitHub Pages

## Notes About Track Audio Files

GitHub Gist only stores metadata (track titles, artists, tags) - not the actual audio files. The audio files need to be:

1. Stored in the `/assets/tracks/` directory
2. Committed to your GitHub repository
3. Referenced correctly in your track objects

Audio files should be reasonably sized (GitHub has file size limits of around 100MB per file).

## Need Help?

If you encounter issues, check:
1. Browser console for errors
2. GitHub API documentation
3. Verify your Gist ID is correct
4. Make sure your Gist is public 