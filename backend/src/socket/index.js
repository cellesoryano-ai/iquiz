const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { GameManager } = require('./gameManager');

const gameManager = new GameManager();
const onlineSockets = new Map(); // socketId -> userId

const authenticateSocket = async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret');
    const user = await User.findById(decoded.userId);
    return user && !user.isBanned ? user : null;
  } catch {
    return null;
  }
};

const broadcastGlobalStats = (io) => {
  const stats = {
    online: onlineSockets.size,
    playing: gameManager.getPlayingCount(),
    waiting: gameManager.getWaitingCount(),
  };
  io.emit('global_stats', stats);
};

const initializeSocket = (io) => {
  gameManager.setIO(io);

  io.on('connection', async (socket) => {
    const user = await authenticateSocket(socket);

    if (!user) {
      socket.emit('auth_error', { error: 'Authentication required' });
      socket.disconnect();
      return;
    }

    // Track online users
    onlineSockets.set(socket.id, user._id.toString());
    socket.userId = user._id.toString();
    socket.user = user;

    console.log(`✅ User connected: ${user.username} (${socket.id})`);

    // Send initial stats
    broadcastGlobalStats(io);

    // Lobby
    socket.on('join_lobby', () => {
      socket.join('lobby');
      socket.emit('lobby_rooms', gameManager.getPublicRooms());
    });

    socket.on('leave_lobby', () => {
      socket.leave('lobby');
    });

    // Room management
    socket.on('create_room', async (settings, callback) => {
      try {
        const room = await gameManager.createRoom(socket, user, settings);
        callback({ success: true, room });
        io.to('lobby').emit('lobby_rooms', gameManager.getPublicRooms());
        broadcastGlobalStats(io);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    socket.on('join_room', async ({ code }, callback) => {
      try {
        const room = await gameManager.joinRoom(socket, user, code);
        callback({ success: true, room });
        io.to('lobby').emit('lobby_rooms', gameManager.getPublicRooms());
        broadcastGlobalStats(io);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    socket.on('leave_room', async (callback) => {
      try {
        await gameManager.leaveRoom(socket, user);
        if (callback) callback({ success: true });
        io.to('lobby').emit('lobby_rooms', gameManager.getPublicRooms());
        broadcastGlobalStats(io);
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('start_game', async (callback) => {
      try {
        await gameManager.startGame(socket, user);
        if (callback) callback({ success: true });
        broadcastGlobalStats(io);
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('submit_answer', async ({ answerIndex }, callback) => {
      try {
        const result = await gameManager.submitAnswer(socket, user, answerIndex);
        if (callback) callback({ success: true, result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('kick_player', async ({ targetUserId }, callback) => {
      try {
        await gameManager.kickPlayer(socket, user, targetUserId);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('update_settings', async (settings, callback) => {
      try {
        await gameManager.updateRoomSettings(socket, user, settings);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('ping_room', async () => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room) {
        socket.emit('room_state', gameManager.getRoomState(room.code));
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      onlineSockets.delete(socket.id);
      console.log(`❌ User disconnected: ${user.username} (${socket.id})`);

      await gameManager.handleDisconnect(socket, user);
      broadcastGlobalStats(io);
      io.to('lobby').emit('lobby_rooms', gameManager.getPublicRooms());
    });
  });
};

module.exports = { initializeSocket };
