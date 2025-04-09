# WebPlay Music Player

A browser-based music player with mood and genre filtering, playlist management, and more.

## Features

- 🎵 Play, pause, and navigate between tracks
- 🔄 Create and manage playlists with drag-and-drop reordering
- 🏷️ Filter tracks by mood or genre
- 📱 Responsive design that works on mobile and desktop
- 📊 Track progress bar with seek functionality
- 🔉 Volume control
- 💾 Download your playlist as a text file

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone or download this repository
2. Open the `index.html` file in your browser

## Usage

### Player Controls

- Click the play/pause button to start or pause playback
- Use the forward and backward buttons to navigate between tracks
- Adjust volume using the volume slider
- Click anywhere on the progress bar to seek to a specific position

### Filtering Tracks

- Click on mood buttons (Happy, Chill, Energetic, etc.) to filter by mood
- Click on genre buttons (Pop, Rock, Electronic, etc.) to filter by genre
- Multiple filters can be applied simultaneously
- Click an active filter again to remove it

### Managing Playlists

- Click the "+" button on any track to add it to your playlist
- Drag and drop tracks in the playlist to reorder them
- Click the "×" button to remove a track from the playlist
- Use the "Clear All" button to empty your playlist
- Click "Download Playlist" to save your playlist as a text file

## Customization

### Adding Your Own Tracks

To add your own tracks, edit the `tracksData` array in `js/app.js`:

```javascript
const tracksData = [
    {
        id: 1,
        title: "Your Track Title",
        artist: "Artist Name",
        src: "path/to/your/audio/file.mp3",
        albumArt: "path/to/album/cover.jpg",
        mood: ["happy", "energetic"],
        genre: ["pop", "rock"]
    },
    // Add more tracks here
];
```

Place your audio files in the `assets/audio` directory and album art in `assets/images`.

### Customizing Appearance

Modify the CSS variables in `css/styles.css` to change the color scheme:

```css
:root {
    --primary-color: #6c63ff;
    --secondary-color: #4641aa;
    --accent-color: #b4b0ff;
    --dark-color: #2e2a5a;
    --light-color: #f5f5ff;
    /* other variables */
}
```

## Browser Support

The player uses modern JavaScript features and Web APIs, including:

- ES6+ features
- Web Audio API
- Drag and Drop API
- Flexbox and CSS Grid

It is recommended to use the latest version of Chrome, Firefox, Safari, or Edge.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Font Awesome for the icons
- Your favorite music artists for inspiration 