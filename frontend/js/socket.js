/* ─── IQuiz Socket.IO Client ────────────────────────────────────────────── */
const SocketClient = (() => {
  let _socket = null;

  function connect(token) {
    if (_socket && _socket.connected) return _socket;
    if (_socket) { _socket.disconnect(); _socket = null; }

    _socket = io(CONFIG.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1200,
    });

    _socket.on('connect', () => {
      Store.set('isConnected', true);
      _socket.emit('join_lobby');
    });

    _socket.on('disconnect', () => {
      Store.set('isConnected', false);
    });

    _socket.on('connect_error', () => {
      Store.set('isConnected', false);
    });

    _socket.on('auth_error', ({ error }) => {
      UI.toast(error, 'error');
      Store.set('isConnected', false);
    });

    /* ── Global stats ────────────────────────────────────────────────── */
    _socket.on('global_stats', (stats) => {
      Store.set('globalStats', stats);
    });

    /* ── Lobby ───────────────────────────────────────────────────────── */
    _socket.on('lobby_rooms', (rooms) => {
      Store.set('publicRooms', rooms);
    });

    /* ── Room events ─────────────────────────────────────────────────── */
    _socket.on('room_update', (room) => {
      Store.set('room', room);
    });

    _socket.on('player_joined', ({ username }) => {
      UI.toast(`${username} joined! 👋`, 'info', 2000);
    });

    _socket.on('player_left', ({ username }) => {
      UI.toast(`${username} left`, 'info', 2000);
    });

    /* ── Game flow ───────────────────────────────────────────────────── */
    _socket.on('game_starting', ({ countdown }) => {
      Store.resetGame();
      UI.toast(`Game starting in ${countdown}…`, 'success', 2500);
    });

    _socket.on('question', (data) => {
      Store.set('currentQuestion', data);
      Store.set('selectedAnswer', null);
      Store.set('roundResult', null);
      Store.set('answerFeedback', null);
      Store.set('answerCount', null);
    });

    _socket.on('answer_feedback', (feedback) => {
      Store.set('answerFeedback', feedback);
    });

    _socket.on('answer_count', (count) => {
      Store.set('answerCount', count);
    });

    _socket.on('round_result', (result) => {
      Store.set('roundResult', result);
    });

    _socket.on('game_end', (data) => {
      Store.set('gameEnd', data);
      Store.set('currentQuestion', null);
    });

    _socket.on('kicked', ({ reason }) => {
      UI.toast(reason, 'error');
      Store.set('room', null);
      Store.resetGame();
      if (typeof window !== 'undefined') window.location.href = 'index.html';
    });

    return _socket;
  }

  function disconnect() {
    if (_socket) { _socket.disconnect(); _socket = null; }
    Store.set('isConnected', false);
  }

  /* ── Emit helpers ───────────────────────────────────────────────────── */
  function emit(event, data, cb) {
    if (!_socket) return;
    if (cb)   _socket.emit(event, data, cb);
    else if (data !== undefined) _socket.emit(event, data);
    else _socket.emit(event);
  }

  function createRoom(settings, cb) {
    emit('create_room', settings, cb);
  }

  function joinRoom(code, cb) {
    emit('join_room', { code }, cb);
  }

  function leaveRoom(cb) {
    emit('leave_room', undefined, cb);
    Store.set('room', null);
    Store.resetGame();
  }

  function startGame(cb) {
    emit('start_game', undefined, cb);
  }

  function submitAnswer(answerIndex, cb) {
    emit('submit_answer', { answerIndex }, cb);
  }

  function kickPlayer(targetUserId) {
    emit('kick_player', { targetUserId });
  }

  function updateSettings(settings) {
    emit('update_settings', settings);
  }

  function joinLobby() {
    emit('join_lobby');
  }

  return {
    connect, disconnect,
    createRoom, joinRoom, leaveRoom,
    startGame, submitAnswer,
    kickPlayer, updateSettings,
    joinLobby,
    get socket() { return _socket; },
  };
})();
