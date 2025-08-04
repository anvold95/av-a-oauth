// /api/auth.js
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || process.env.VERCEL_URL;
  const base = process.env.OAUTH_BASE_URL || `https://${host}`;
  const state = randomUUID();

  // Viktig for state-verifisering og for at callback skal godtas
  res.setHeader('Set-Cookie', `gh_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=300`);

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${base}/api/callback`);
  url.searchParams.set('scope', process.env.OAUTH_SCOPE || 'repo'); // bruk 'public_repo' for offentlig repo
  url.searchParams.set('state', state);

  res.writeHead(302, { Location: url.toString() }).end();
}
