import 'dotenv/config';
import { CredentialsMethod, OpenFgaClient } from '@openfga/sdk';

// OpenFGA Configuration for Authenticated Mode
const AUTH_OPENFGA_CONFIG = {
  apiUrl: process.env.OPENFGA_API_URL || 'http://127.0.0.1:8081',
  storeId: process.env.OPENFGA_STORE_ID || '',
  authorizationModelId: process.env.OPENFGA_AUTHORIZATION_MODEL_ID || '',
  clientId: process.env.OPENFGA_CLIENT_ID || '',
  clientSecret: process.env.OPENFGA_CLIENT_SECRET || ''
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

async function fixManagerIssue() {
  try {
    console.log('🔧 Fixing manager issue...');
    
    // The issue might be that we need to add a direct can_manage relationship
    // Let's add Raj as having can_manage over Dina
    const additionalTuples = [
      {
        user: 'user:raj.manager@company.com',
        relation: 'can_manage',
        object: 'user:dina.dev@company.com'
      }
    ];
    
    console.log(`📝 Adding ${additionalTuples.length} additional can_manage tuples...`);
    
    // Write the tuples
    await authFgaClient.write({
      writes: additionalTuples.map(tuple => ({
        user: tuple.user,
        relation: tuple.relation,
        object: tuple.object
      }))
    });
    
    console.log('✅ Successfully added additional can_manage relationships!');
    
    // Test relationships again
    console.log('\n🧪 Testing relationships after fix...');
    
    // Test raj.manager@company.com can approve dina's expense
    const rajCanApprove = await authFgaClient.check({
      user: 'user:raj.manager@company.com',
      relation: 'can_approve',
      object: 'expense:exp_auth_001'
    });
    console.log(`Raj can approve exp_auth_001: ${rajCanApprove.allowed}`);
    
    // Test if Raj can manage Dina
    const rajCanManageDina = await authFgaClient.check({
      user: 'user:raj.manager@company.com',
      relation: 'can_manage',
      object: 'user:dina.dev@company.com'
    });
    console.log(`Raj can manage Dina: ${rajCanManageDina.allowed}`);
    
    console.log('\n🎉 Manager issue fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing manager issue:', error);
    process.exit(1);
  }
}

// Run the fix
fixManagerIssue();
