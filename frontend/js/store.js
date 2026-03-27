/* ─── IQuiz Global Store (no dependencies) ─────────────────────────────── */
const Store = (() => {
  const STORAGE_KEY = 'iquiz_state';

  // Load persisted data
  let _persisted = {};
  try {
    _persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {}

  const state = {
    /* auth */
    user:  _persisted.user  || null,
    token: _persisted.token || null,

    /* room / game */
    room:            null,
    currentQuestion: null,
    selectedAnswer:  null,
    roundResult:     null,
    gameEnd:         null,
    answerFeedback:  null,
    answerCount:     null,

    /* lobby */
    publicRooms: [],

    /* global live stats */
    globalStats: { online: 0, playing: 0, waiting: 0 },

    /* ui preferences */
    isMuted: _persisted.isMuted || false,
    isConnected: false,
  };

  const listeners = {};

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
    (listeners['*']   || []).forEach(fn => fn(event, data));
  }

  function on(event, fn) {
    listeners[event] = listeners[event] || [];
    listeners[event].push(fn);
    return () => {
      listeners[event] = listeners[event].filter(f => f !== fn);
    };
  }

  function set(key, value) {
    state[key] = value;
    emit('change:' + key, value);
    emit('change', { key, value });
    _persist();
  }

  function get(key) {
    return key ? state[key] : { ...state };
  }

  function _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user:    state.user,
        token:   state.token,
        isMuted: state.isMuted,
      }));
    } catch {}
  }

  function logout() {
    set('user',  null);
    set('token', null);
    set('room',  null);
    resetGame();
  }

  function resetGame() {
    set('currentQuestion', null);
    set('selectedAnswer',  null);
    set('roundResult',     null);
    set('gameEnd',         null);
    set('answerFeedback',  null);
    set('answerCount',     null);
  }

  return { state, on, set, get, logout, resetGame };
})();
