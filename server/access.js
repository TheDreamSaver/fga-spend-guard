import { createRemoteJWKSet, jwtVerify } from 'jose';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const DEMO_USERS = {
  dina_dev: { department: 'Engineering', limit: 0 },
  raj_manager: { department: 'Engineering', limit: 500 },
  chen_vp: { department: 'Engineering', limit: 5000 },
  frank_finance: { department: 'Finance', limit: 0 },
};
export const normalize = value => typeof value === 'string' ? value.replace(/^user:/, '') : '';
export const loopback = host => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);

export function tokenVerifier(env = process.env, keys) {
  if (!env.AUTH0_ISSUER_BASE_URL || !env.AUTH0_AUDIENCE) return null;
  const issuer = env.AUTH0_ISSUER_BASE_URL.replace(/\/$/, '') + '/';
  if (new URL(issuer).protocol !== 'https:') throw new Error('Auth0 issuer must use HTTPS.');
  const jwks = keys || createRemoteJWKSet(new URL('.well-known/jwks.json', issuer));
  return async token => {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: env.AUTH0_AUDIENCE, algorithms: ['RS256'] });
    return payload;
  };
}

export function identityMiddleware({ env = process.env, verify = tokenVerifier(env) } = {}) {
  const demo = env.DEMO_MODE === 'true';
  const profiles = JSON.parse(env.AUTH_USER_PROFILES || '{}');
  if (demo && (env.NODE_ENV === 'production' || !loopback(env.HOST || '127.0.0.1'))) throw new Error('Demo personas require a non-production loopback server.');
  return async (req, res, next) => {
    try {
      const authenticated = /^\/api\/auth\/(?:expenses(?:\/|$)|profile(?:\/|$)|auth(?:\/|$)|ai(?:\/|$))/.test(req.originalUrl.split('?')[0]);
      if (!authenticated) {
        if (!demo) throw new HttpError(403, 'Demo mode is disabled.');
        const actor = req.get('X-Demo-User');
        if (!Object.hasOwn(DEMO_USERS, actor || '')) throw new HttpError(401, 'Select a valid demo persona.');
        req.actor = actor;
        req.profile = DEMO_USERS[actor];
      } else {
        if (!verify) throw new HttpError(503, 'Authentication is not configured.');
        const token = req.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
        if (!token) throw new HttpError(401, 'An access token is required.');
        let claims;
        try { claims = await verify(token); } catch { throw new HttpError(401, 'Invalid access token.'); }
        const actor = claims[env.AUTH0_FGA_USER_CLAIM || 'sub'];
        if (typeof actor !== 'string' || !actor || actor.length > 256) throw new HttpError(401, 'Missing user identity.');
        req.actor = normalize(actor);
        req.profile = profiles[req.actor] || { department: 'Unassigned', limit: 0 };
      }
      req.authenticated = authenticated;
      if (req.body?.user && normalize(req.body.user) !== req.actor) throw new HttpError(403, 'Another user’s permissions cannot be queried.');
      next();
    } catch (error) { next(error); }
  };
}

export async function canApprove(fga, actor, profile, expense) {
  if (expense.submittedBy === actor || expense.status !== 'Pending') return false;
  const limit = Number(profile.limit);
  if (!Number.isFinite(limit) || limit <= 0 || expense.amount > limit) return false;
  return fga.check(`user:${actor}`, 'can_approve', `expense:${expense.id}`);
}
