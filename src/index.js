// Simson Debate Prep: static lesson page + PDFs behind one shared password.
// Set the password with:  npx wrangler secret put SITE_PASSWORD
// (or Cloudflare dashboard → Worker → Settings → Variables and Secrets).

const COOKIE = 'sdp_auth';
const MAX_AGE = 60 * 60 * 24 * 30; // stay signed in for 30 days

async function token(secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('simson-debate-prep'));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function getCookie(req, name) {
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

function loginPage(error) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Simson Debate Prep</title>
<style>
:root{--bg:#f4f5f8;--card:#fff;--ink:#18223a;--muted:#5b6478;--accent:#d98a12;--line:#d9dde6;--no:#b3261e}
@media (prefers-color-scheme:dark){:root{--bg:#10141f;--card:#182033;--ink:#eef1f7;--muted:#a3abbd;--line:#2c3550}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
form{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px;width:100%;max-width:360px;display:flex;flex-direction:column;gap:12px}
.eb{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
h1{margin:0;font-size:24px}p{margin:0;color:var(--muted);font-size:14px}
input{font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--ink)}
button{font:inherit;font-weight:700;padding:10px;border:0;border-radius:10px;background:var(--ink);color:var(--bg);cursor:pointer}
.err{color:var(--no)}
</style></head><body>
<form method="post" action="/login">
<span class="eb">Simson Debate Prep</span><h1>Teacher sign-in</h1>
<p>Enter the shared password to open the lessons and materials.</p>
${error ? '<p class="err">That password didn’t match. Try again.</p>' : ''}
<input type="password" name="password" placeholder="Password" autocomplete="current-password" required autofocus>
<button type="submit">Open</button>
</form></body></html>`, { status: error ? 401 : 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!env.SITE_PASSWORD) return new Response('SITE_PASSWORD is not set for this Worker.', { status: 500 });
    const good = await token(env.SITE_PASSWORD);

    if (url.pathname === '/login' && req.method === 'POST') {
      const form = await req.formData();
      if (form.get('password') !== env.SITE_PASSWORD) return loginPage(true);
      return new Response(null, { status: 303, headers: {
        Location: '/',
        'Set-Cookie': `${COOKIE}=${good}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
      } });
    }
    if (url.pathname === '/logout') {
      return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
    }
    if (getCookie(req, COOKIE) !== good) return loginPage(false);

    const res = await env.ASSETS.fetch(req);
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-store');
    out.headers.set('X-Robots-Tag', 'noindex');
    return out;
  }
};
