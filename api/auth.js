export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const base = process.env.OAUTH_BASE_URL || `https://${process.env.VERCEL_URL}`;
  const state = crypto.randomUUID();
  // enkel CSRF-beskyttelse
  res.setHeader('Set-Cookie', `gh_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300`);
  const redirectUri = `${base}/api/callback`;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo'); // evt. 'public_repo' hvis repoet er offentlig
  url.searchParams.set('state', state);

  res.redirect(url.toString());
}
