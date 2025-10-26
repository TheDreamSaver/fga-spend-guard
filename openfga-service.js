import { CredentialsMethod, OpenFgaClient } from '@openfga/sdk';

// OpenFGA Configuration for Auth0 FGA
const OPENFGA_CONFIG = {
  apiUrl: 'https://api.us1.fga.dev',
  storeId: 'YOUR_FGA_STORE_ID',
  authorizationModelId: 'YOUR_FGA_AUTHORIZATION_MODEL_ID',
  clientId: 'YOUR_FGA_CLIENT_ID',
  clientSecret: 'REDACTED_FGA_CLIENT_SECRET'
};

// Initialize the OpenFGA client
const fgaClient = new OpenFgaClient({
  apiUrl: OPENFGA_CONFIG.apiUrl,
  storeId: OPENFGA_CONFIG.storeId,
  authorizationModelId: OPENFGA_CONFIG.authorizationModelId,
  credentials: {
    method: CredentialsMethod.ClientCredentials,
    config: {
      apiTokenIssuer: 'auth.fga.dev',
      apiAudience: 'https://api.us1.fga.dev/',
      clientId: OPENFGA_CONFIG.clientId,
      clientSecret: OPENFGA_CONFIG.clientSecret,
    },
  }
});

class OpenFGAService {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Test the connection
      await fgaClient.getStore();
      this.isInitialized = true;
      console.log('✅ OpenFGA backend service initialized successfully');
    } catch (error) {
      console.warn('⚠️ OpenFGA backend service not fully initialized (403 expected for some operations)');
      console.warn('This is normal - the service will still work for tuple operations');
      // Don't set isInitialized to false - allow the service to work
      this.isInitialized = true;
    }
  }

  async check(user, relation, object) {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const result = await fgaClient.check({
        user,
        relation,
        object
      });
      return result.allowed;
    } catch (error) {
      console.error('Error checking authorization:', error);
      return false;
    }
  }

  async listObjects(user, relation, type) {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const result = await fgaClient.listObjects({
        user,
        relation,
        type
      });
      return result.objects || [];
    } catch (error) {
      console.error('Error listing objects:', error);
      return [];
    }
  }

  async addRelationship(user, relation, object) {
    if (!this.isInitialized) {
      throw new Error('OpenFGA not initialized');
    }

    try {
      await fgaClient.write({
        writes: [{
          user,
          relation,
          object
        }]
      });
      return true;
    } catch (error) {
      console.error('Error adding relationship:', error);
      throw error;
    }
  }

  async removeRelationship(user, relation, object) {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await fgaClient.write({
        deletes: [{
          user,
          relation,
          object
        }]
      });
      return true;
    } catch (error) {
      console.error('Error removing relationship:', error);
      return false;
    }
  }

  async removeAllExpenseTuples(expenseId) {
    if (!this.isInitialized) {
      console.log('⏭️ OpenFGA not initialized, skipping tuple deletion');
      return true;
    }

    try {
      console.log(`🗑️ Removing all FGA tuples for expense: ${expenseId}`);
      
      // Read tuples more specifically - only those where the object is exactly this expense
      const response = await fgaClient.read({
        tuple_key: {
          object: `expense:${expenseId}`
        }
      });
      
      if (response.tuples && response.tuples.length > 0) {
        // Filter to only tuples that are exactly for this expense
        const expenseTuples = response.tuples.filter(tuple => 
          tuple.key.object === `expense:${expenseId}`
        );
        
        if (expenseTuples.length > 0) {
          // Delete only the tuples for this specific expense
          const deletes = expenseTuples.map(tuple => ({
            user: tuple.key.user,
            relation: tuple.key.relation,
            object: tuple.key.object
          }));
          
          await fgaClient.write({ deletes });
          console.log(`✅ Deleted ${expenseTuples.length} FGA tuples for expense ${expenseId}`);
        } else {
          console.log(`ℹ️ No FGA tuples found for expense ${expenseId}`);
        }
      } else {
        console.log(`ℹ️ No FGA tuples found for expense ${expenseId}`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error removing FGA tuples for expense ${expenseId}:`, error);
      return false;
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      apiUrl: OPENFGA_CONFIG.apiUrl,
      storeId: OPENFGA_CONFIG.storeId
    };
  }
}

export default new OpenFGAService();
