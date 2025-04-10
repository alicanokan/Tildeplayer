# Audio Tracks Directory

This directory is used to store audio files for the TildeSoundArt Player.

## Adding Audio Files

1. **Approved Tracks**: When you approve tracks in the upload page, place the audio files here with the same filenames shown in the approved tracks list.

2. **Manual Addition**: You can also manually add audio files to this directory. Use the following format for best results:
   - Filename: `Track_Title_Artist_Name.mp3`
   - Supported formats: MP3, WAV, OGG

3. **Sample Files**: The following sample files are referenced by the default player:
   - ID_Music_2_Technology_F1.mp3
   - ID_Music_7_TOGG_ID_MEDIA_Funk.mp3
   - sample1.mp3
   - sample2.mp3
   - sample3.mp3
   - sample4.mp3

## File Organization

All audio files should be placed directly in this directory, not in subdirectories. The player will look for files using paths like:

```
assets/tracks/Your_Track_Name.mp3
```

## Storage and Sharing

The track metadata (title, artist, tags, etc.) are stored in your GitHub Gist, but the actual audio files need to be placed in this directory manually. This arrangement allows:
1. Efficient storage of large audio files
2. Easy sharing of track metadata across devices
3. Complete control over your audio library 