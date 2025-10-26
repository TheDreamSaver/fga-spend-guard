// Auth0 Configuration
export const auth0Config = {
  domain: 'genai-4974078323403177.us.auth0.com',
  clientId: 'iheHWjYxvIrrYAru4B382ywXsTUY8q39',
  authorizationParams: {
    redirect_uri: window.location.origin + '/app',
    audience: 'https://smartspend',
    connection: 'Username-Password-Authentication',
    scope: 'openid profile email', // Explicitly set scope for basic authentication
  },
  useRefreshTokens: true,
  cacheLocation: 'localstorage',
};

// OpenFGA Configuration for Authenticated Mode
export const authOpenFGAConfig = {
  apiUrl: 'https://api.us1.fga.dev',
  storeId: 'YOUR_FGA_STORE_ID',
  authorizationModelId: 'YOUR_FGA_AUTHORIZATION_MODEL_ID',
  clientId: 'YOUR_FGA_CLIENT_ID',
  clientSecret: 'REDACTED_FGA_CLIENT_SECRET'
};

// Helper function to convert email to FGA user ID
export const emailToFGAUserId = (email: string): string => {
  return `user:${email}`;
};

// Sample authenticated users (for demo purposes)
export const sampleAuthenticatedUsers = [
  {
    email: 'dina.dev@company.com',
    name: 'Dina Dev',
    role: 'Software Engineer',
    department: 'Engineering'
  },
  {
    email: 'raj.manager@company.com', 
    name: 'Raj Manager',
    role: 'Engineering Manager',
    department: 'Engineering'
  },
  {
    email: 'chen.vp@company.com',
    name: 'Chen VP', 
    role: 'VP of Engineering',
    department: 'Engineering'
  },
  {
    email: 'frank.finance@company.com',
    name: 'Frank Finance',
    role: 'Financial Analyst', 
    department: 'Finance'
  }
];
