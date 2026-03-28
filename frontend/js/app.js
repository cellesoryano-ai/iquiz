/* ─── IQuiz App — Shared Initialization ────────────────────────────────── */

// Keep the backend awake on Render free tier (pings every 8 minutes)
setInterval(() => {
  fetch(CONFIG.API_URL + '/health').catch(() => {});
}, 8 * 60 * 1000);

document.addEventListener('DOMContentLoaded', () => {

  /* ── Handle OAuth redirect token ──────────────────────────────────── */
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const authStatus = params.get('auth');

  if (urlToken && authStatus === 'success') {
    Store.set('token', urlToken);
    // Remove from URL cleanly
    const clean = window.location.pathname;
    window.history.replaceState({}, '', clean);
    // Fetch user
    _fetchMe(urlToken);
  } else if (Store.get('token') && !Store.get('user')) {
    _fetchMe(Store.get('token'));
  }

  async function _fetchMe(token) {
    try {
      const { user } = await API.get('/api/auth/me', token);
      Store.set('user', user);
    } catch {
      Store.set('user', null);
      Store.set('token', null);
    }
  }

  /* ── Connect socket when user is set ──────────────────────────────── */
  function tryConnect() {
    const token = Store.get('token');
    if (token) SocketClient.connect(token);
  }
  tryConnect();

  Store.on('change:token', (token) => {
    if (token) SocketClient.connect(token);
    else SocketClient.disconnect();
  });

  /* ── Header rendering ──────────────────────────────────────────────── */
  function renderHeader() {
    const user  = Store.get('user');
    const stats = Store.get('globalStats');
    const connected = Store.get('isConnected');

    const onlineEl  = document.getElementById('stat-online');
    const playingEl = document.getElementById('stat-playing');
    const waitingEl = document.getElementById('stat-waiting');
    const dotEl     = document.getElementById('stat-dot');

    if (onlineEl)  onlineEl.textContent  = stats.online.toLocaleString();
    if (playingEl) playingEl.textContent = stats.playing.toLocaleString();
    if (waitingEl) waitingEl.textContent = stats.waiting.toLocaleString();
    if (dotEl)     dotEl.style.background = connected ? 'var(--primary)' : '#ef4444';

    const userArea  = document.getElementById('header-user-area');
    const guestBtn  = document.getElementById('header-signin-btn');

    if (!userArea) return;

    if (user) {
      if (guestBtn) guestBtn.style.display = 'none';
      userArea.innerHTML = `
        <div class="user-menu">
          <button class="user-btn" id="user-menu-btn" aria-expanded="false">
            <img class="user-avatar" src="${UI.avatar(user)}" alt="${user.username}" />
            <span class="user-name">${user.username}</span>
            <span class="dropdown-arrow">▾</span>
          </button>
          <div class="dropdown" id="user-dropdown">
            <a href="profile.html">👤 Profile</a>
            <a href="leaderboard.html">🏆 Leaderboard</a>
            ${user.isAdmin ? `<a href="admin.html">🛡️ Admin Panel</a>` : ''}
            <hr />
            <button class="danger" id="logout-btn">🚪 Sign Out</button>
          </div>
        </div>`;

      document.getElementById('user-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const d = document.getElementById('user-dropdown');
        d.classList.toggle('open');
        document.getElementById('user-menu-btn').setAttribute('aria-expanded', d.classList.contains('open'));
      });

      document.addEventListener('click', () => {
        document.getElementById('user-dropdown')?.classList.remove('open');
      });

      document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try { await API.post('/api/auth/logout', {}, Store.get('token')); } catch {}
        Store.logout();
        SocketClient.disconnect();
        window.location.href = 'index.html';
      });

    } else {
      if (guestBtn) guestBtn.style.display = 'flex';
      userArea.innerHTML = '';
    }
  }

  renderHeader();
  Store.on('change:user',        renderHeader);
  Store.on('change:globalStats', renderHeader);
  Store.on('change:isConnected', renderHeader);

  /* ── Mute button ───────────────────────────────────────────────────── */
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.textContent = Store.get('isMuted') ? '🔇' : '🔊';
    muteBtn.addEventListener('click', () => {
      const m = !Store.get('isMuted');
      Store.set('isMuted', m);
      muteBtn.textContent = m ? '🔇' : '🔊';
    });
  }

  /* ── Close modals on overlay click ────────────────────────────────── */
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) UI.closeAllModals();
    });
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
    });
  });

  /* ── Expose page-init hook ─────────────────────────────────────────── */
  if (typeof window.initPage === 'function') {
    window.initPage();
  }
});
