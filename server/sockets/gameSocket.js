const { generateTopics, generateGameWords, MODEL_NAME } = require('../gemini');

// Game State
const rooms = {};

module.exports = (io) => {
    // io here is the scoped namespace '/game'

    io.on('connection', (socket) => {
        console.log('Game User connected:', socket.id);

        // Send server info including model name
        socket.emit('serverInfo', { model: MODEL_NAME });

        socket.on('join', ({ name, room = 'travel' }) => {
            try {
                socket.join(room);
                if (!rooms[room]) {
                    rooms[room] = {
                        players: [],
                        topics: [],
                        status: "waiting",
                        selectedTopic: null, // Manually selected topic
                        currentTopic: null,
                        votes: {},
                        liarId: null,
                        civilianWord: null,
                        liarWord: null
                    };
                }

                const newPlayer = { id: socket.id, name, isHost: rooms[room].players.length === 0, role: null, word: null };
                rooms[room].players.push(newPlayer);

                io.to(room).emit('roomUpdate', rooms[room]);
                console.log(`[JOIN] ${name} joined room: ${room}`);
            } catch (err) {
                console.error('[JOIN ERROR]', err);
                socket.emit('error', '방 입장에 실패했습니다.');
            }
        });

        socket.on('selectTopic', ({ room, topic }) => {
            if (!rooms[room]) return;
            rooms[room].selectedTopic = topic;
            io.to(room).emit('roomUpdate', rooms[room]);
        });

        socket.on('suggestTopic', async ({ room }) => {
            if (!rooms[room]) return;
            try {
                io.to(room).emit('loadingTopics', true);
                // Pass existing topics to exclude them
                const newTopics = await generateTopics(rooms[room].topics);
                rooms[room].topics = Array.from(new Set([...rooms[room].topics, ...newTopics])); // Duplicate removal

                // If no topic selected yet, select the first new one automatically for feedback
                if (!rooms[room].selectedTopic && newTopics.length > 0) {
                    rooms[room].selectedTopic = newTopics[0];
                }

                io.to(room).emit('loadingTopics', false);
                io.to(room).emit('roomUpdate', rooms[room]);
            } catch (err) {
                console.error('[TOPIC ERROR]', err);
                io.to(room).emit('loadingTopics', false);
            }
        });

        socket.on('addTopic', ({ room, topic }) => {
            if (!rooms[room] || !topic.trim()) return;
            const cleanTopic = topic.trim();
            // Add to topics list if not exists
            if (!rooms[room].topics.includes(cleanTopic)) {
                rooms[room].topics.push(cleanTopic);
                // Select it automatically for convenience
                rooms[room].selectedTopic = cleanTopic;
            } else {
                // Even if exists, just select it
                rooms[room].selectedTopic = cleanTopic;
            }
            io.to(room).emit('roomUpdate', rooms[room]);
        });

        socket.on('startGame', async ({ room }) => {
            if (!rooms[room]) return;
            const roomData = rooms[room];

            // 1. Check Topic Selection (STRICT)
            if (!roomData.selectedTopic) {
                io.to(room).emit('error', '⚠️ 주제를 먼저 선택해야 게임을 시작할 수 있습니다!');
                return;
            }

            // 2. Check Player Count
            if (roomData.players.length < 3) {
                io.to(room).emit('error', '최소 3명이 필요합니다.');
                return;
            }

            // Use the selected topic
            roomData.currentTopic = roomData.selectedTopic;
            roomData.status = "loading"; // Show loading bar
            io.to(room).emit('roomUpdate', rooms[room]);

            // Call Gemini for words
            const words = await generateGameWords(roomData.currentTopic);
            roomData.civilianWord = words.civilian;
            roomData.liarWord = words.liar;

            // Assign Roles
            const liarIndex = Math.floor(Math.random() * roomData.players.length);
            roomData.liarId = roomData.players[liarIndex].id;

            roomData.players = roomData.players.map((p, index) => {
                if (index === liarIndex) {
                    return { ...p, role: 'liar', word: words.liar };
                } else {
                    return { ...p, role: 'civilian', word: words.civilian };
                }
            });

            roomData.status = "playing";
            io.to(room).emit('roomUpdate', rooms[room]);
        });

        socket.on('startVote', ({ room }) => {
            if (!rooms[room]) return;
            rooms[room].status = "voting";
            rooms[room].votes = {}; // Reset votes
            io.to(room).emit('roomUpdate', rooms[room]);
        });

        socket.on('vote', ({ room, targetId }) => {
            if (!rooms[room]) return;

            console.log(`[VOTE] ${socket.id} voted for ${targetId}`);

            // Record vote
            rooms[room].votes[socket.id] = targetId;
            io.to(room).emit('roomUpdate', rooms[room]); // Instant update

            // Check if everyone voted
            // Only count active players
            const activePlayerIds = rooms[room].players.map(p => p.id);
            const voteCount = Object.keys(rooms[room].votes).filter(voterId => activePlayerIds.includes(voterId)).length;

            if (voteCount >= rooms[room].players.length) {
                // Calculate result
                const voteCounts = {};
                Object.entries(rooms[room].votes).forEach(([voter, target]) => {
                    if (activePlayerIds.includes(voter)) { // Only count valid votes
                        voteCounts[target] = (voteCounts[target] || 0) + 1;
                    }
                });

                // Find player with max votes
                let maxVotes = 0;
                let votedOutId = null;
                for (const [pid, count] of Object.entries(voteCounts)) {
                    if (count > maxVotes) {
                        maxVotes = count;
                        votedOutId = pid;
                    }
                }

                // Check winner
                let winner = "liar";
                if (votedOutId && votedOutId === rooms[room].liarId) {
                    winner = "civilian";
                }

                rooms[room].status = "result";
                rooms[room].winner = winner;
                rooms[room].votedOutId = votedOutId;

                io.to(room).emit('roomUpdate', rooms[room]);
            }
        });

        socket.on('reset', ({ room }) => {
            if (!rooms[room]) return;
            // Reset for next game, keep players
            rooms[room].status = "waiting";
            rooms[room].selectedTopic = null;
            rooms[room].votes = {};
            rooms[room].liarId = null;
            rooms[room].currentTopic = null;
            rooms[room].players.forEach(p => {
                p.role = null;
                p.word = null;
            });
            io.to(room).emit('roomUpdate', rooms[room]);
        });

        socket.on('disconnect', () => {
            console.log('Game User disconnected:', socket.id);
            // Remove player from rooms
            for (const roomId in rooms) {
                // Remove player
                rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);

                // Remove their vote if they voted
                if (rooms[roomId].votes && rooms[roomId].votes[socket.id]) {
                    delete rooms[roomId].votes[socket.id];
                }

                if (rooms[roomId].players.length === 0) {
                    delete rooms[roomId]; // Clean up empty room
                } else {
                    io.to(roomId).emit('roomUpdate', rooms[roomId]);
                }
            }
        });
    });
};
