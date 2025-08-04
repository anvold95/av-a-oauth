export default async function handler(req, res) {
  const { code, state } = req.query;
  const match = (req.headers.cookie || '').match(/gh_oauth_state=([^;]+)/);
  if (!code || !state || !match || state !== match[1]) {
    return res.status(400).send('Invalid OAuth state.');
  }

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code
  });

  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: params
  });
  const data = await r.json();
  const token = data.access_token;

  // send tokenet tilbake til CMS-vinduet
  const html = `
<!doctype html><meta charset="utf-8">
<script>
  (function() {
    var msg = { token: ${JSON.stringify(token || '')} };
    if (window.opener) window.opener.postMessage(msg, '*');
    window.close();
  })();
</script>
<p>Innlogging fullført – du kan lukke dette vinduet.</p>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
