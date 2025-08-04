// /api/callback.js
export default async function handler(req, res) {
  try {
    const { code, state } = req.query || {};
    const cookie = req.headers.cookie || '';
    const m = cookie.match(/gh_oauth_state=([^;]+)/);
    if (!code || !state || !m || state !== m[1]) {
      return res.status(400).send('Invalid OAuth state.');
    }

    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;
    if (!client_id || !client_secret) return res.status(500).send('Missing OAuth env vars');

    const form = new URLSearchParams({ client_id, client_secret, code });
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form
    });
    const data = await r.json();
    if (!data.access_token) {
      console.error('oauth error', data);
      return res.status(400).send(`OAuth failed: ${data.error || 'no token'}`);
    }

    const html = `
<!doctype html><meta charset="utf-8">
<script>
  (function() {
    // Viktig: inkluder provider
    var msg = { token: ${JSON.stringify(data.access_token)}, provider: "github" };
    if (window.opener) window.opener.postMessage(msg, "*");
    window.close();
  })();
</script>
<p>Innlogging fullført – du kan lukke dette vinduet.</p>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('callback error', e);
    res.status(500).send('Callback failed');
  }
}
