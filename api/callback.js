export default async function handler(req, res) {
  try {
    const { code, state } = req.query || {};
    const cookie = req.headers.cookie || '';
    const m = cookie.match(/gh_oauth_state=([^;]+)/);
    if (!code || !state || !m || state !== m[1]) return res.status(400).send('Invalid OAuth state.');

    const form = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    });
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json' }, body: form
    });
    const data = await r.json();
    const token = data && data.access_token;
    if (!token) return res.status(400).send(`OAuth failed: ${data.error || 'no token'}`);

    const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://av-a.no';
    const adminUrl = `${SITE_ORIGIN}/admin/`;

    const html = `<!doctype html><meta charset="utf-8">
<script>
(function(){
  var t=${JSON.stringify(token)};
  function send(to){try{to.postMessage({provider:"github",token:t},"*")}catch(e){};try{to.postMessage("authorization:github:success:"+t,"*")}catch(e){}}
  if (window.opener && !window.opener.closed) { send(window.opener); setTimeout(()=>window.close(),300); }
  else { var w=window.open(${JSON.stringify(adminUrl)},"_blank"); if (w){ setTimeout(()=>{send(w); window.close();},600);} }
})();
</script>
<p>Innlogging fullført – du kan lukke dette vinduet.</p>`;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    res.status(500).send('Callback failed');
  }
}
