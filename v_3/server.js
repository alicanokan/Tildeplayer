const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '@audio');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Track data storage
const TRACKS_FILE = path.join(__dirname, 'data', 'tracks.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initialize tracks data
let tracks = [];
if (fs.existsSync(TRACKS_FILE)) {
    tracks = JSON.parse(fs.readFileSync(TRACKS_FILE, 'utf8'));
}

// Save tracks to file
function saveTracks() {
    fs.writeFileSync(TRACKS_FILE, JSON.stringify(tracks, null, 2));
}

// API Endpoints

// Get all tracks
app.get('/api/tracks', (req, res) => {
    res.json(tracks);
});

// Add new track
app.post('/api/tracks', upload.single('audio'), (req, res) => {
    const trackData = JSON.parse(req.body.metadata);
    const newTrack = {
        id: Date.now(),
        ...trackData,
        audioPath: req.file ? `@audio/${req.file.filename}` : null
    };
    
    tracks.push(newTrack);
    saveTracks();
    
    res.json(newTrack);
});

// Update track
app.put('/api/tracks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const trackIndex = tracks.findIndex(t => t.id === id);
    
    if (trackIndex === -1) {
        return res.status(404).json({ error: 'Track not found' });
    }
    
    tracks[trackIndex] = { ...tracks[trackIndex], ...req.body };
    saveTracks();
    
    res.json(tracks[trackIndex]);
});

// Delete track
app.delete('/api/tracks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const trackIndex = tracks.findIndex(t => t.id === id);
    
    if (trackIndex === -1) {
        return res.status(404).json({ error: 'Track not found' });
    }
    
    // Remove audio file if it exists
    const track = tracks[trackIndex];
    if (track.audioPath) {
        const audioFile = path.join(__dirname, track.audioPath);
        if (fs.existsSync(audioFile)) {
            fs.unlinkSync(audioFile);
        }
    }
    
    tracks.splice(trackIndex, 1);
    saveTracks();
    
    res.json({ message: 'Track deleted successfully' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 