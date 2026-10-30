import 'dotenv/config';
import { CredentialsMethod, OpenFgaClient } from '@openfga/sdk';

export function fgaConfig(prefix = '', env = process.env, bootstrap = false) {
  const apiUrl = env[`${prefix}OPENFGA_API_URL`] || 'http://127.0.0.1:8081';
  const storeId = env[`${prefix}OPENFGA_STORE_ID`];
  const authorizationModelId = env[`${prefix}OPENFGA_AUTHORIZATION_MODEL_ID`];
  const clientId = env[`${prefix}OPENFGA_CLIENT_ID`];
  const clientSecret = env[`${prefix}OPENFGA_CLIENT_SECRET`];
  if (!bootstrap && (!storeId || !authorizationModelId)) return null;
  if (Boolean(clientId) !== Boolean(clientSecret)) throw new Error('Both OpenFGA client ID and secret are required.');
  const config = { apiUrl, storeId, authorizationModelId };
  if (clientId) config.credentials = {
    method: CredentialsMethod.ClientCredentials,
    config: {
      apiTokenIssuer: env[`${prefix}OPENFGA_TOKEN_ISSUER`] || 'auth.fga.dev',
      apiAudience: env[`${prefix}OPENFGA_AUDIENCE`] || `${new URL(apiUrl).origin}/`,
      clientId, clientSecret,
    },
  };
  return config;
}

export function createFgaClient(prefix = '') {
  const config = fgaConfig(prefix);
  return config ? new OpenFgaClient(config) : null;
}
