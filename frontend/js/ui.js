/* ─── IQuiz UI Utilities ────────────────────────────────────────────────── */
const UI = (() => {

  /* ── Toast ──────────────────────────────────────────────────────────── */
  let _toastContainer;
  function _getToastContainer() {
    if (!_toastContainer) {
      _toastContainer = document.getElementById('toast-container');
      if (!_toastContainer) {
        _toastContainer = document.createElement('div');
        _toastContainer.id = 'toast-container';
        document.body.appendChild(_toastContainer);
      }
    }
    return _toastContainer;
  }

  const TOAST_ICONS = { success: '✓', error: '✕', info: 'ℹ' };

  function toast(message, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || 'ℹ'}</span><span>${message}</span>`;
    _getToastContainer().appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  /* ── Button loading state ───────────────────────────────────────────── */
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /* ── Modal helpers ──────────────────────────────────────────────────── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); el.style.display = 'flex'; }
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); el.style.display = 'none'; }
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.classList.remove('open'); m.style.display = 'none';
    });
  }

  /* ── Avatar ──────────────────────────────────────────────────────────── */
  function avatar(user) {
    if (!user) return 'https://api.dicebear.com/8.x/bottts/svg?seed=guest';
    return user.avatar || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;
  }

  /* ── Rank emoji ──────────────────────────────────────────────────────── */
  function rankBadge(n) {
    return n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : String(n);
  }

  /* ── Format number ───────────────────────────────────────────────────── */
  function formatNum(n) {
    return (n || 0).toLocaleString();
  }

  /* ── Format duration (seconds) ───────────────────────────────────────── */
  function formatDuration(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  /* ── Accuracy color class ────────────────────────────────────────────── */
  function accClass(pct) {
    return pct >= 70 ? 'acc-green' : pct >= 50 ? 'acc-yellow' : 'acc-red';
  }

  /* ── Difficulty color ────────────────────────────────────────────────── */
  const DIFF_COLORS = { easy: '#4ade80', medium: '#fde047', hard: '#fca5a5', mixed: '#93c5fd' };
  function diffColor(d) { return DIFF_COLORS[d] || '#94a3b8'; }

  /* ── Query helpers ───────────────────────────────────────────────────── */
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  /* ── Confetti burst ──────────────────────────────────────────────────── */
  function confetti(duration = 4000) {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      document.body.appendChild(canvas);
    }
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx    = canvas.getContext('2d');
    const pieces = [];
    const COLORS = ['#2eb774','#4ade80','#facc15','#ffffff','#86efb0','#f9a8d4'];
    const COUNT  = 180;

    for (let i = 0; i < COUNT; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vy: 2 + Math.random() * 3,
        vx: -1 + Math.random() * 2,
        rot: Math.random() * 360,
        vrot: -3 + Math.random() * 6,
        opacity: 1,
      });
    }

    const start = Date.now();
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - start;
      if (elapsed > duration) { canvas.remove(); return; }

      pieces.forEach(p => {
        p.y   += p.vy;
        p.x   += p.vx;
        p.rot += p.vrot;
        if (elapsed > duration * 0.6) p.opacity = Math.max(0, 1 - (elapsed - duration * 0.6) / (duration * 0.4));
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  return {
    toast, setLoading,
    openModal, closeModal, closeAllModals,
    avatar, rankBadge, formatNum, formatDuration, accClass, diffColor,
    qs, qsa, confetti,
  };
})();
