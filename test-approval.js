import { CredentialsMethod, OpenFgaClient } from '@openfga/sdk';

// OpenFGA Configuration for Authenticated Mode
const AUTH_OPENFGA_CONFIG = {
  apiUrl: 'https://api.us1.fga.dev',
  storeId: 'YOUR_FGA_STORE_ID',
  authorizationModelId: 'YOUR_FGA_AUTHORIZATION_MODEL_ID',
  clientId: 'YOUR_FGA_CLIENT_ID',
  clientSecret: 'REDACTED_FGA_CLIENT_SECRET'
};

// Initialize the OpenFGA client for authenticated mode
const authFgaClient = new OpenFgaClient({
  apiUrl: AUTH_OPENFGA_CONFIG.apiUrl,
  storeId: AUTH_OPENFGA_CONFIG.storeId,
  authorizationModelId: AUTH_OPENFGA_CONFIG.authorizationModelId,
  credentials: {
    method: CredentialsMethod.ClientCredentials,
    config: {
      apiTokenIssuer: 'auth.fga.dev',
      apiAudience: 'https://api.us1.fga.dev/',
      clientId: AUTH_OPENFGA_CONFIG.clientId,
      clientSecret: AUTH_OPENFGA_CONFIG.clientSecret,
    },
  }
});

async function testSpecificApproval() {
  try {
    console.log('🔍 Testing specific approval logic...');
    
    // Test the exact can_approve relation for Raj on Dina's expense
    const rajCanApprove = await authFgaClient.check({
      user: 'user:raj.manager@company.com',
      relation: 'can_approve',
      object: 'expense:exp_auth_001'
    });
    console.log(`Raj can approve exp_auth_001: ${rajCanApprove.allowed}`);
    
    // Test if Raj can manage Dina (the owner of the expense)
    const rajCanManageDina = await authFgaClient.check({
      user: 'user:raj.manager@company.com',
      relation: 'can_manage',
      object: 'user:dina.dev@company.com'
    });
    console.log(`Raj can manage Dina: ${rajCanManageDina.allowed}`);
    
    // Test if Dina is the owner of exp_auth_001
    const dinaIsOwner = await authFgaClient.check({
      user: 'user:dina.dev@company.com',
      relation: 'owner',
      object: 'expense:exp_auth_001'
    });
    console.log(`Dina is owner of exp_auth_001: ${dinaIsOwner.allowed}`);
    
    // Let's also test Chen's approval
    const chenCanApprove = await authFgaClient.check({
      user: 'user:chen.vp@company.com',
      relation: 'can_approve',
      object: 'expense:exp_auth_001'
    });
    console.log(`Chen can approve exp_auth_001: ${chenCanApprove.allowed}`);
    
    // Test if Chen can manage Dina
    const chenCanManageDina = await authFgaClient.check({
      user: 'user:chen.vp@company.com',
      relation: 'can_manage',
      object: 'user:dina.dev@company.com'
    });
    console.log(`Chen can manage Dina: ${chenCanManageDina.allowed}`);
    
  } catch (error) {
    console.error('❌ Error testing approval:', error);
    process.exit(1);
  }
}

// Run the test
testSpecificApproval();
