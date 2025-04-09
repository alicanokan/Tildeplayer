# WebPlay Music Player - Quick Start Guide

## Opening the Player

1. Navigate to the `music-player` folder
2. Open `index.html` in your web browser

## How to Use

### Adding Your Own Music

To use the music player with your own music:

1. Place your audio files in the `assets/audio` folder
2. Edit the `tracksData` array in `js/app.js` to point to your audio files
3. Update the track information (title, artist, mood, genre)

### Example: Adding a Track

```javascript
{
    id: 6,
    title: "Your New Track",
    artist: "Your Artist",
    src: "assets/audio/your-track.mp3",
    albumArt: "assets/images/default-album.svg",
    mood: ["happy", "energetic"],
    genre: ["rock"]
}
```

### Using Tracks from the T_Logoshow Folder

If you want to use the audio files from the T_Logoshow folder:

1. Copy the .wav files from `T_Logoshow` to `music-player/assets/audio`
2. Add new entries to the `tracksData` array for each track with appropriate moods and genres

Enjoy your music player! 