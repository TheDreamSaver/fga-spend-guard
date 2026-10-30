export const AUTH0_CONFIGURED = Boolean(import.meta.env.VITE_AUTH0_DOMAIN && import.meta.env.VITE_AUTH0_CLIENT_ID && import.meta.env.VITE_AUTH0_AUDIENCE);

// Auth0 Configuration
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'example.invalid',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'not-configured',
  authorizationParams: {
    redirect_uri: window.location.origin + '/app',
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    connection: 'Username-Password-Authentication',
    scope: 'openid profile email', // Explicitly set scope for basic authentication
  },
  useRefreshTokens: true,
  cacheLocation: 'memory' as const,
};
