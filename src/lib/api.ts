let demoUser = 'dina_dev';
let getToken: (() => Promise<string>) | null = null;

export function setDemoPersona(user: string) { demoUser = user; }
export function setAccessTokenProvider(provider: (() => Promise<string>) | null) { getToken = provider; }

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const path = new URL(input, window.location.origin).pathname;
  if (/^\/api\/auth\/(?:expenses(?:\/|$)|profile(?:\/|$)|auth(?:\/|$)|ai(?:\/|$))/.test(path)) {
    if (!getToken) throw new Error('Sign in before using the authenticated API.');
    headers.set('Authorization', `Bearer ${await getToken()}`);
  } else {
    headers.set('X-Demo-User', demoUser);
  }
  return fetch(input, { ...init, headers });
}
