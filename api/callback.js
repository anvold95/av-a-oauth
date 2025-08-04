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
    if (!client_id || !client_secret) {
      return res.status(500).send('Missing OAuth env vars');
    }

    const form = new URLSearchParams({ client_id, client_secret, code });
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form
    });
    const data = await r.json();
    const token = data && data.access_token;
    if (!token) {
      console.error('oauth error', data);
      return res.status(400).send(`OAuth failed: ${data.error || 'no token'}`);
    }

    const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://av-a.no';
    const adminUrl = `${SITE_ORIGIN}/admin/`;

    const html = `<!doctype html><meta charset="utf-8">
<style>body{font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial}</style>
<p>Innlogging fullført – du kan lukke dette vinduet.</p>
<script>
(function(){
  var msgObj = { provider: "github", token: ${JSON.stringify(token)} };
  var msgStr = "authorization:github:success:" + ${JSON.stringify(token)};

  function send(toWin){
    try { toWin.postMessage(msgObj, "*"); } catch(e){}
    try { toWin.postMessage(msgStr, "*"); } catch(e){}
  }

  if (window.opener && !window.opener.closed) {
    // Normal vei: send til /admin som åpnet oss
    send(window.opener);
    setTimeout(function(){ window.close(); }, 300);
  } else {
    // Fallback: åpne /admin i ny fane og send dit
    var w = window.open(${JSON.stringify(adminUrl)}, "_blank");
    if (w) {
      setTimeout(function(){ send(w); window.close(); }, 600);
    } else {
      document.body.insertAdjacentHTML("beforeend",
        '<p>Kunne ikke åpne admin-vindu automatisk. <a id="go" href=${JSON.stringify(adminUrl)}>Åpne admin</a></p>'
      );
    }
  }
})();
</script>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('callback error', e);
    res.status(500).send('Callback failed');
  }
}
