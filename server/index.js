const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Database Connection (SQLite via Sequelize)
const { sequelize } = require('./models/BarModels');

sequelize.sync({ force: false }) // Set to false for production to keep data
    .then(() => console.log('SQLite connected and synced'))
    .catch(err => console.error('SQLite connection error:', err));


// API Routes
// Pass the /bar namespace io instance or the global io?
// The bar routes emit to global io or specific? 
// In the routes file, we expect `io` to be passed. Let's pass the /bar namespace.
const barIo = io.of('/bar');
const gameIo = io.of('/game');

const barRoutes = require('./routes/bar')(barIo);
app.use('/api/bar', barRoutes);

// Socket Handlers
require('./sockets/barSocket')(barIo);
require('./sockets/gameSocket')(gameIo);

// Static Files Serving
const clientBarDist = path.join(__dirname, '../client-bar/dist');
const clientGameDist = path.join(__dirname, '../client-game/dist');
const publicDir = path.join(__dirname, '../public');

// Serve Bar App
app.use('/bar', express.static(clientBarDist));
app.get(/\/bar\/.*/, (req, res) => {
    res.sendFile(path.join(clientBarDist, 'index.html'));
});

// Serve Game App
app.use('/game', express.static(clientGameDist));
app.get(/\/game\/.*/, (req, res) => {
    res.sendFile(path.join(clientGameDist, 'index.html'));
});

// Serve Landing Page
app.use(express.static(publicDir));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Integrated Server running on port ${PORT}`);
});
