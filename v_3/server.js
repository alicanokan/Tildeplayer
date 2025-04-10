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

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'assets/tracks');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original filename but ensure it's safe
        const safeName = file.originalname.replace(/[^a-zA-Z0-9-_. ]/g, '');
        cb(null, safeName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

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

// Handle file uploads
app.post('/upload', upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        // Return success response with file info
        res.json({
            success: true,
            file: {
                filename: req.file.filename,
                path: `assets/tracks/${req.file.filename}`,
                size: req.file.size
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 