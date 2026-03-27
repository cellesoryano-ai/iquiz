/* ─── IQuiz REST API Client ─────────────────────────────────────────────── */
const API = (() => {
  function _headers(token) {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  async function _req(method, path, body, token) {
    const opts = {
      method,
      credentials: 'include',
      headers: _headers(token),
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(CONFIG.API_URL + path, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  return {
    get:    (path, token)        => _req('GET',    path, undefined, token),
    post:   (path, body, token)  => _req('POST',   path, body,      token),
    put:    (path, body, token)  => _req('PUT',    path, body,      token),
    delete: (path, token)        => _req('DELETE', path, undefined, token),

    discordLoginUrl() {
      return CONFIG.API_URL + '/api/auth/discord';
    },
  };
})();
