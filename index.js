require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Player = require('./models/Player');
const Match = require('./models/Match');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_super_secret_key';

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a random 28-character alphanumeric string for userId
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let userId = '';
    for (let i = 0; i < 28; i++) {
      userId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Save user
    const newUser = new User({ 
      userId,
      name,
      email, 
      password: hashedPassword 
    });
    await newUser.save();

    // Create token
    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, email: newUser.email, name: newUser.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'This email is not registered.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password.' });
    }

    // Create token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'No token, authorization denied' });

  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Protect all routes below this line
app.use(authMiddleware);

// --- PLAYER ROUTES ---
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find({ userEmail: req.user.email });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const newPlayer = new Player({
      ...req.body,
      userEmail: req.user.email
    });
    const savedPlayer = await newPlayer.save();
    res.status(201).json(savedPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    // Ensure player belongs to user
    const player = await Player.findOne({ id: req.params.id, userEmail: req.user.email });
    if (!player) return res.status(404).json({ message: 'Player not found or unauthorized' });

    const updatedPlayer = await Player.findOneAndUpdate({ id: req.params.id, userEmail: req.user.email }, req.body, { new: true });
    res.json(updatedPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    // Ensure player belongs to user
    const player = await Player.findOne({ id: req.params.id, userEmail: req.user.email });
    if (!player) return res.status(404).json({ message: 'Player not found or unauthorized' });

    await Player.findOneAndDelete({ id: req.params.id, userEmail: req.user.email });
    res.json({ message: 'Player deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/players/sync', async (req, res) => {
  try {
    const playersData = req.body.players;
    const syncedPlayers = [];
    
    for (const p of playersData) {
      if (p.id) {
        // Update, but verify ownership
        const updated = await Player.findOneAndUpdate(
          { id: p.id, userEmail: req.user.email }, 
          { ...p, userEmail: req.user.email }, 
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        syncedPlayers.push(updated);
      } else {
        let existing = await Player.findOne({ name: p.name, userEmail: req.user.email });
        if (existing) {
          const updated = await Player.findOneAndUpdate({ _id: existing._id }, { ...p, userEmail: req.user.email }, { new: true });
          syncedPlayers.push(updated);
        } else {
          const newP = new Player({ ...p, userEmail: req.user.email });
          const saved = await newP.save();
          syncedPlayers.push(saved);
        }
      }
    }
    res.json(syncedPlayers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- MATCH ROUTES ---
app.get('/api/matches', async (req, res) => {
  try {
    const matches = await Match.find({ userEmail: req.user.email }).sort({ date: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ message: 'Match id is required' });
    
    // Upsert: create if not exists, update if exists
    const savedMatch = await Match.findOneAndUpdate(
      { id, userEmail: req.user.email },
      { ...rest, id, userEmail: req.user.email },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(savedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/matches/:id', async (req, res) => {
  try {
    // Use Flutter UUID (our custom `id` field), not MongoDB _id
    const savedMatch = await Match.findOneAndUpdate(
      { id: req.params.id, userEmail: req.user.email },
      { ...req.body, id: req.params.id, userEmail: req.user.email },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(savedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
