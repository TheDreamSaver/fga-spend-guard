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

async function testTransitiveRelationship() {
  try {
    console.log('🔍 Testing transitive relationship...');
    
    // The model says: can_manage: manager or can_manage from manager
    // This means Raj should be able to manage Dina if Raj is a manager of Dina
    
    // Test if Raj is a manager of Dina
    const rajIsManagerOfDina = await authFgaClient.check({
      user: 'user:raj.manager@company.com',
      relation: 'manager',
      object: 'user:dina.dev@company.com'
    });
    console.log(`Raj is manager of Dina: ${rajIsManagerOfDina.allowed}`);
    
    // Test if Raj can manage Dina (this should be true because Raj is manager of Dina)
    const rajCanManageDina = await authFgaClient.check({
      user: 'user:raj.manager@company.com',
      relation: 'can_manage',
      object: 'user:dina.dev@company.com'
    });
    console.log(`Raj can manage Dina: ${rajCanManageDina.allowed}`);
    
    // Test if Raj can approve Dina's expense (this should be true because Raj can manage Dina)
    const rajCanApprove = await authFgaClient.check({
      user: 'user:raj.manager@company.com',
      relation: 'can_approve',
      object: 'expense:exp_auth_001'
    });
    console.log(`Raj can approve exp_auth_001: ${rajCanApprove.allowed}`);
    
    // Let's also test Chen's relationships
    console.log('\n--- Testing Chen ---');
    const chenIsManagerOfDina = await authFgaClient.check({
      user: 'user:chen.vp@company.com',
      relation: 'manager',
      object: 'user:dina.dev@company.com'
    });
    console.log(`Chen is manager of Dina: ${chenIsManagerOfDina.allowed}`);
    
    const chenCanManageDina = await authFgaClient.check({
      user: 'user:chen.vp@company.com',
      relation: 'can_manage',
      object: 'user:dina.dev@company.com'
    });
    console.log(`Chen can manage Dina: ${chenCanManageDina.allowed}`);
    
    const chenCanApprove = await authFgaClient.check({
      user: 'user:chen.vp@company.com',
      relation: 'can_approve',
      object: 'expense:exp_auth_001'
    });
    console.log(`Chen can approve exp_auth_001: ${chenCanApprove.allowed}`);
    
  } catch (error) {
    console.error('❌ Error testing transitive relationship:', error);
    process.exit(1);
  }
}

// Run the test
testTransitiveRelationship();
