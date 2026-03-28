const Room = require('../models/Room');
const Question = require('../models/Question');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');

const QUESTION_BUFFER_MS = 3000; // Buffer between questions
const RESULTS_DISPLAY_MS = 4000; // Show results before next question

class GameManager {
  constructor() {
    this.io = null;
    this.activeRooms = new Map(); // code -> room state
    this.socketRoomMap = new Map(); // socketId -> roomCode
    this.questionTimers = new Map(); // roomCode -> timer
  }

  setIO(io) {
    this.io = io;
  }

  // ─── Room State Helpers ───────────────────────────────────────────────────

  getRoomBySocketId(socketId) {
    const code = this.socketRoomMap.get(socketId);
    return code ? this.activeRooms.get(code) : null;
  }

  getRoomState(code) {
    const room = this.activeRooms.get(code);
    if (!room) return null;
    return {
      code: room.code,
      status: room.status,
      settings: room.settings,
      players: room.players.map(p => ({
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        correctAnswers: p.correctAnswers,
        wrongAnswers: p.wrongAnswers,
        isHost: p.isHost,
        isConnected: p.isConnected,
        hasAnswered: p.currentAnswer !== null,
      })),
      currentQuestion: room.currentQuestion
        ? {
          index: room.currentQuestionIndex,
          total: room.questions.length,
          endsAt: room.questionEndsAt,
          question: room.status !== 'waiting' ? room.currentQuestion : null,
        }
        : null,
    };
  }

  getPublicRooms() {
    const rooms = [];
    for (const [code, room] of this.activeRooms) {
      if (room.settings.isPublic && room.status === 'waiting') {
        rooms.push({
          code,
          playerCount: room.players.filter(p => p.isConnected).length,
          maxPlayers: room.settings.maxPlayers,
          gameType: room.settings.gameType,
          hostUsername: room.players.find(p => p.isHost)?.username || 'Unknown',
        });
      }
    }
    return rooms;
  }

  getPlayingCount() {
    let count = 0;
    for (const room of this.activeRooms.values()) {
      if (['playing', 'question', 'results', 'starting'].includes(room.status)) {
        count += room.players.filter(p => p.isConnected).length;
      }
    }
    return count;
  }

  getWaitingCount() {
    let count = 0;
    for (const room of this.activeRooms.values()) {
      if (room.status === 'waiting') {
        count += room.players.filter(p => p.isConnected).length;
      }
    }
    return count;
  }

  // ─── Room Management ──────────────────────────────────────────────────────

  async createRoom(socket, user, settings = {}) {
    // Enforce user isn't already in a room
    const existingCode = this.socketRoomMap.get(socket.id);
    if (existingCode) {
      await this.leaveRoom(socket, user);
    }

    const code = this._generateCode();
    const roomData = {
      code,
      hostId: user._id.toString(),
      status: 'waiting',
      settings: {
        maxPlayers: Math.min(Math.max(parseInt(settings.maxPlayers) || 10, 2), 20),
        gameType: ['versus', 'ffa'].includes(settings.gameType) ? settings.gameType : 'ffa',
        questionCount: Math.min(Math.max(parseInt(settings.questionCount) || 10, 5), 30),
        timerSeconds: Math.min(Math.max(parseInt(settings.timerSeconds) || 10, 1), 15),
        isPublic: settings.isPublic !== false,
        categories: settings.categories || [],
        difficulty: ['easy', 'medium', 'hard', 'mixed'].includes(settings.difficulty) ? settings.difficulty : 'mixed',
      },
      players: [{
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        socketId: socket.id,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        currentAnswer: null,
        answeredAt: null,
        isReady: false,
        isHost: true,
        isConnected: true,
      }],
      questions: [],
      currentQuestionIndex: -1,
      currentQuestion: null,
      questionEndsAt: null,
      tabCounts: new Map([[user._id.toString(), 1]]),
    };

    this.activeRooms.set(code, roomData);
    this.socketRoomMap.set(socket.id, code);
    socket.join(code);

    // Save to DB (non-blocking)
    this._saveRoomToDB(roomData);

    return this.getRoomState(code);
  }

  async joinRoom(socket, user, code) {
    const upperCode = code.toUpperCase();
    const room = this.activeRooms.get(upperCode);

    if (!room) throw new Error('Room not found');

    // Check if this user is already a member of the room
    const existing = room.players.find(p => p.userId === user._id.toString());

    // Only block NEW players from joining a game in progress
    if (room.status !== 'waiting' && !existing) throw new Error('Game already in progress');

    const activePlayers = room.players.filter(p => p.isConnected);
    if (activePlayers.length >= room.settings.maxPlayers && !existing) throw new Error('Room is full');

    if (existing) {
      // Always update socketId — handles page navigation and tab reconnects
      const oldSocketId = existing.socketId;
      existing.socketId = socket.id;
      existing.isConnected = true;

      // Remove old socket mapping if it was stale
      if (oldSocketId && oldSocketId !== socket.id) {
        this.socketRoomMap.delete(oldSocketId);
      }
    } else {
      room.players.push({
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        socketId: socket.id,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        currentAnswer: null,
        answeredAt: null,
        isReady: false,
        isHost: false,
        isConnected: true,
      });
    }

    // Leave previous room if any
    const prevCode = this.socketRoomMap.get(socket.id);
    if (prevCode && prevCode !== upperCode) {
      await this.leaveRoom(socket, user);
    }

    this.socketRoomMap.set(socket.id, upperCode);
    socket.join(upperCode);

    const state = this.getRoomState(upperCode);
    this.io.to(upperCode).emit('room_update', state);

    // Only announce join for new players, not reconnects
    if (!existing) {
      this.io.to(upperCode).emit('player_joined', {
        username: user.username,
        avatar: user.avatar,
        userId: user._id.toString(),
      });
    }

    // If game is active, resend current question to the reconnecting socket
    if (existing && room.status === 'question' && room.currentQuestion) {
      socket.emit('question', {
        index: room.currentQuestionIndex,
        total: room.questions.length,
        question: room.currentQuestion.question,
        options: room.currentQuestion.options,
        category: room.currentQuestion.category,
        difficulty: room.currentQuestion.difficulty,
        endsAt: room.questionEndsAt,
      });
    }

    return state;
  }

  async leaveRoom(socket, user) {
    const code = this.socketRoomMap.get(socket.id);
    if (!code) return;

    const room = this.activeRooms.get(code);
    if (!room) {
      this.socketRoomMap.delete(socket.id);
      return;
    }

    const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIdx === -1) {
      this.socketRoomMap.delete(socket.id);
      socket.leave(code);
      return;
    }

    const player = room.players[playerIdx];
    player.isConnected = false;

    this.socketRoomMap.delete(socket.id);
    socket.leave(code);

    const connectedPlayers = room.players.filter(p => p.isConnected);

    if (connectedPlayers.length === 0) {
      // Delay deletion to allow for page navigation reconnects
      setTimeout(() => {
        const r = this.activeRooms.get(code);
        if (r && r.players.filter(p => p.isConnected).length === 0) {
          this._clearTimer(code);
          this.activeRooms.delete(code);
          Room.findOneAndUpdate({ code }, { status: 'finished' }).catch(() => {});
        }
      }, 8000);
      return;
    }

    // If host left, assign new host
    if (player.isHost && connectedPlayers.length > 0) {
      player.isHost = false;
      connectedPlayers[0].isHost = true;
      room.hostId = connectedPlayers[0].userId;
    }

    const state = this.getRoomState(code);
    this.io.to(code).emit('room_update', state);
    this.io.to(code).emit('player_left', { username: player.username, userId: player.userId });

    // If game in progress and only 1 left, end game
    if (room.status !== 'waiting' && connectedPlayers.length < 2) {
      await this._endGame(code);
    }
  }

  async kickPlayer(socket, user, targetUserId) {
    const code = this.socketRoomMap.get(socket.id);
    if (!code) throw new Error('Not in a room');

    const room = this.activeRooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== user._id.toString()) throw new Error('Only host can kick players');

    const target = room.players.find(p => p.userId === targetUserId);
    if (!target) throw new Error('Player not found');

    const targetSocket = this.io.sockets.sockets.get(target.socketId);
    if (targetSocket) {
      targetSocket.emit('kicked', { reason: 'You were kicked by the host' });
      await this.leaveRoom(targetSocket, { _id: targetUserId });
    }
  }

  async updateRoomSettings(socket, user, settings) {
    const code = this.socketRoomMap.get(socket.id);
    if (!code) throw new Error('Not in a room');

    const room = this.activeRooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== user._id.toString()) throw new Error('Only host can update settings');
    if (room.status !== 'waiting') throw new Error('Cannot change settings during game');

    room.settings = {
      ...room.settings,
      maxPlayers: settings.maxPlayers ? Math.min(Math.max(parseInt(settings.maxPlayers), 2), 20) : room.settings.maxPlayers,
      gameType: ['versus', 'ffa'].includes(settings.gameType) ? settings.gameType : room.settings.gameType,
      questionCount: settings.questionCount ? Math.min(Math.max(parseInt(settings.questionCount), 5), 30) : room.settings.questionCount,
      timerSeconds: settings.timerSeconds ? Math.min(Math.max(parseInt(settings.timerSeconds), 1), 15) : room.settings.timerSeconds,
      isPublic: settings.isPublic !== undefined ? settings.isPublic : room.settings.isPublic,
      categories: settings.categories || room.settings.categories,
      difficulty: settings.difficulty || room.settings.difficulty,
    };

    this.io.to(code).emit('room_update', this.getRoomState(code));
  }

  // ─── Game Flow ────────────────────────────────────────────────────────────

  async startGame(socket, user) {
    const code = this.socketRoomMap.get(socket.id);
    if (!code) throw new Error('Not in a room');

    const room = this.activeRooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== user._id.toString()) throw new Error('Only host can start the game');
    if (room.status !== 'waiting') throw new Error('Game already started');

    const connectedPlayers = room.players.filter(p => p.isConnected);
    if (connectedPlayers.length < 1) throw new Error('Need at least 1 player to start');

    // Fetch questions
    const questionFilter = { isActive: true };
    if (room.settings.categories.length > 0) questionFilter.category = { $in: room.settings.categories };
    if (room.settings.difficulty !== 'mixed') questionFilter.difficulty = room.settings.difficulty;

    const count = room.settings.questionCount;
    const questions = await Question.aggregate([
      { $match: questionFilter },
      { $sample: { size: count } },
    ]);

    if (questions.length < count) {
      const fallback = await Question.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: count } },
      ]);
      room.questions = fallback;
    } else {
      room.questions = questions;
    }

    room.status = 'starting';
    room.startedAt = new Date();
    room.currentQuestionIndex = -1;

    this.io.to(code).emit('game_starting', {
      message: 'Get ready!',
      countdown: 3,
      playerCount: connectedPlayers.length,
    });

    await Room.findOneAndUpdate({ code }, { status: 'starting', startedAt: room.startedAt });

    setTimeout(() => this._sendNextQuestion(code), 3000);
  }

  async _sendNextQuestion(code) {
    const room = this.activeRooms.get(code);
    if (!room) return;

    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
      await this._endGame(code);
      return;
    }

    const q = room.questions[room.currentQuestionIndex];

    // Reset player answers
    room.players.forEach(p => {
      p.currentAnswer = null;
      p.answeredAt = null;
    });

    room.status = 'question';
    room.currentQuestion = q;
    const endsAt = Date.now() + room.settings.timerSeconds * 1000;
    room.questionEndsAt = endsAt;

    this.io.to(code).emit('question', {
      index: room.currentQuestionIndex,
      total: room.questions.length,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      endsAt,
    });

    // Auto-advance when timer runs out
    const timer = setTimeout(
      () => this._revealAnswers(code),
      room.settings.timerSeconds * 1000 + 500
    );
    this.questionTimers.set(code, timer);
  }

  async submitAnswer(socket, user, answerIndex) {
    const code = this.socketRoomMap.get(socket.id);
    if (!code) throw new Error('Not in a room');

    const room = this.activeRooms.get(code);
    if (!room || room.status !== 'question') throw new Error('Not in a question phase');
    if (answerIndex < 0 || answerIndex > 3) throw new Error('Invalid answer index');

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) throw new Error('Player not found');
    if (player.currentAnswer !== null) throw new Error('Already answered');

    const now = Date.now();
    player.currentAnswer = answerIndex;
    player.answeredAt = now;

    const q = room.currentQuestion;
    const isCorrect = answerIndex === q.correctIndex;

    if (isCorrect) {
      const timeLeft = Math.max(0, room.questionEndsAt - now);
      const timeBonus = Math.round((timeLeft / (room.settings.timerSeconds * 1000)) * 500);
      const baseScore = 500;
      player.score += baseScore + timeBonus;
      player.correctAnswers++;
    } else {
      player.wrongAnswers++;
    }

    // Notify the answering player
    socket.emit('answer_feedback', {
      isCorrect,
      yourAnswer: answerIndex,
      score: player.score,
    });

    // Broadcast updated player count of answerers
    const answered = room.players.filter(p => p.currentAnswer !== null && p.isConnected).length;
    const total = room.players.filter(p => p.isConnected).length;
    this.io.to(code).emit('answer_count', { answered, total });

    // If all players answered, reveal early
    if (answered >= total) {
      this._clearTimer(code);
      setTimeout(() => this._revealAnswers(code), 500);
    }

    return { isCorrect, score: player.score };
  }

  async _revealAnswers(code) {
    const room = this.activeRooms.get(code);
    if (!room || room.status !== 'question') return;

    this._clearTimer(code);
    room.status = 'results';

    const q = room.currentQuestion;

    // Build leaderboard
    const leaderboard = room.players
      .filter(p => p.isConnected)
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        rank: i + 1,
        answered: p.currentAnswer !== null,
        wasCorrect: p.currentAnswer === q.correctIndex,
      }));

    this.io.to(code).emit('round_result', {
      correctIndex: q.correctIndex,
      correctAnswer: q.options[q.correctIndex],
      leaderboard,
      isLastQuestion: room.currentQuestionIndex >= room.questions.length - 1,
    });

    // Update question stats
    Question.findByIdAndUpdate(q._id, {
      $inc: {
        timesUsed: 1,
        timesCorrect: room.players.filter(p => p.currentAnswer === q.correctIndex && p.isConnected).length,
      },
    }).catch(() => {});

    // Schedule next question or end
    const isLast = room.currentQuestionIndex >= room.questions.length - 1;
    if (isLast) {
      setTimeout(() => this._endGame(code), RESULTS_DISPLAY_MS);
    } else {
      setTimeout(() => this._sendNextQuestion(code), RESULTS_DISPLAY_MS + QUESTION_BUFFER_MS);
    }
  }

  async _endGame(code) {
    const room = this.activeRooms.get(code);
    if (!room) return;

    this._clearTimer(code);
    room.status = 'finished';

    const connectedPlayers = room.players.filter(p => p.isConnected);
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    const finalResults = sorted.map((p, i) => ({
      userId: p.userId,
      username: p.username,
      avatar: p.avatar,
      score: p.score,
      correctAnswers: p.correctAnswers,
      wrongAnswers: p.wrongAnswers,
      rank: i + 1,
    }));

    this.io.to(code).emit('game_end', {
      winner: winner
        ? { username: winner.username, score: winner.score, avatar: winner.avatar }
        : null,
      results: finalResults,
      duration: room.startedAt
        ? Math.round((Date.now() - new Date(room.startedAt).getTime()) / 1000)
        : 0,
    });

    // Persist stats
    await this._saveGameHistory(room, sorted);
    await this._updatePlayerStats(room, sorted);

    // Clean up room after delay
    setTimeout(() => {
      this.activeRooms.delete(code);
      // Clean socketRoomMap for disconnected players
      for (const [socketId, roomCode] of this.socketRoomMap) {
        if (roomCode === code) this.socketRoomMap.delete(socketId);
      }
    }, 30000);

    await Room.findOneAndUpdate({ code }, { status: 'finished', endedAt: new Date() });
  }

  // ─── Disconnect Handling ──────────────────────────────────────────────────

  async handleDisconnect(socket, user) {
    await this.leaveRoom(socket, user);
  }

  // ─── Persistence ─────────────────────────────────────────────────────────

  async _saveGameHistory(room, sorted) {
    try {
      await GameHistory.create({
        roomCode: room.code,
        hostId: room.hostId,
        gameType: room.settings.gameType,
        settings: {
          questionCount: room.questions.length,
          timerSeconds: room.settings.timerSeconds,
          difficulty: room.settings.difficulty,
        },
        players: sorted.map((p, i) => ({
          userId: p.userId,
          username: p.username,
          avatar: p.avatar,
          score: p.score,
          correctAnswers: p.correctAnswers,
          wrongAnswers: p.wrongAnswers,
          rank: i + 1,
        })),
        winnerId: sorted[0]?.userId,
        winnerUsername: sorted[0]?.username,
        totalQuestions: room.questions.length,
        duration: room.startedAt
          ? Math.round((Date.now() - new Date(room.startedAt).getTime()) / 1000)
          : 0,
        playedAt: new Date(),
      });
    } catch (err) {
      console.error('Failed to save game history:', err.message);
    }
  }

  async _updatePlayerStats(room, sorted) {
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const isWinner = i === 0;
      try {
        const update = {
          $inc: {
            'stats.gamesPlayed': 1,
            'stats.totalScore': p.score,
            'stats.totalCorrect': p.correctAnswers,
            'stats.totalAnswered': p.correctAnswers + p.wrongAnswers,
            ...(isWinner ? { 'stats.gamesWon': 1, 'stats.winStreak': 1 } : { 'stats.winStreak': 0 }),
          },
          $set: { lastSeen: new Date() },
        };

        const user = await User.findByIdAndUpdate(p.userId, update, { new: true });

        // Update bestWinStreak
        if (user && isWinner && user.stats.winStreak > user.stats.bestWinStreak) {
          await User.findByIdAndUpdate(p.userId, {
            $set: { 'stats.bestWinStreak': user.stats.winStreak },
          });
        }
      } catch (err) {
        console.error(`Failed to update stats for ${p.username}:`, err.message);
      }
    }
  }

  async _saveRoomToDB(roomData) {
    try {
      await Room.findOneAndUpdate(
        { code: roomData.code },
        {
          code: roomData.code,
          hostId: roomData.hostId,
          settings: roomData.settings,
          status: roomData.status,
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('Failed to save room to DB:', err.message);
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (this.activeRooms.has(code));
    return code;
  }

  _clearTimer(code) {
    const timer = this.questionTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.questionTimers.delete(code);
    }
  }
}

module.exports = { GameManager };
