import { dataService } from './data';

// OpenFGA Configuration for playground.fga.dev
const OPENFGA_CONFIG = {
  apiUrl: 'https://api.playground-us1.fga.dev', // OpenFGA Playground URL
  storeId: '01K3ET2XTM439ZP4B55FXEX854', // Synced with setup script
  authorizationModelId: '01K3ET34FPYBA428XBF0B91SNN', // Synced with setup script
};

export class OpenFGAService {
  private static instance: OpenFGAService;
  private isInitialized: boolean = false;
  private config = { ...OPENFGA_CONFIG };
  private cache = new Map<string, { result: any; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds cache timeout

  private constructor() {}

  static getInstance(): OpenFGAService {
    if (!OpenFGAService.instance) {
      OpenFGAService.instance = new OpenFGAService();
    }
    return OpenFGAService.instance;
  }

  // Get cache key for a request
  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  // Get cached result if available and not expired
  private getCachedResult(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }

  // Set cache result
  private setCachedResult(cacheKey: string, result: any): void {
    this.cache.set(cacheKey, { result, timestamp: Date.now() });
  }

  // Clear expired cache entries
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  // Initialize OpenFGA connection
  async initialize(): Promise<boolean> {
    try {
      // Check if OpenFGA playground is accessible
      const healthResponse = await fetch(`${this.config.apiUrl}/healthz`);
      if (!healthResponse.ok) {
        console.warn('OpenFGA playground not accessible');
        return false;
      }

      // Verify store exists and we have access
      await this.verifyStoreAccess();

      // Verify the authorization model exists (don't create it)
      await this.verifyAuthorizationModel();

      this.isInitialized = true;
      console.log('✅ OpenFGA playground initialized successfully');
      return true;
    } catch (error) {
      console.warn('Failed to initialize OpenFGA playground:', error);
      return false;
    }
  }

  // Verify store access
  private async verifyStoreAccess(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Store access failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error verifying store access:', error);
      throw error;
    }
  }

  // Verify authorization model exists
  private async verifyAuthorizationModel(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}/authorization-models/${this.config.authorizationModelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Authorization model not found: ${response.status}`);
      }
      
      console.log('✅ Authorization model verified');
    } catch (error) {
      console.error('Error verifying authorization model:', error);
      throw error;
    }
  }

  async check(user: string, relation: string, object: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    // Clear expired cache entries
    this.clearExpiredCache();

    // Check cache first
    const cacheKey = this.getCacheKey('check', { user, relation, object });
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_model_id: this.config.authorizationModelId,
          tuple_key: {
            user,
            relation,
            object
          }
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const result = data.allowed;
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error checking authorization:', error);
      return false;
    }
  }

  async listObjects(user: string, relation: string, type: string): Promise<string[]> {
    if (!this.isInitialized) {
      return [];
    }

    // Clear expired cache entries
    this.clearExpiredCache();

    // Check cache first
    const cacheKey = this.getCacheKey('listObjects', { user, relation, type });
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}/list-objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_model_id: this.config.authorizationModelId,
          user,
          relation,
          type
        })
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const result = data.objects || [];
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error listing objects:', error);
      return [];
    }
  }

  async getVisibleExpenses(userId: string): Promise<string[]> {
    return this.listObjects(`user:${userId}`, 'can_view', 'expense');
  }

  async canApproveExpense(userId: string, expenseId: string): Promise<boolean> {
    try {
      return await this.check(`user:${userId}`, 'can_approve', `expense:${expenseId}`);
    } catch (error) {
      console.error('Error checking approval permission:', error);
      return false;
    }
  }

  async addRelationship(user: string, relation: string, object: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: {
            tuple_keys: [{
              user,
              relation,
              object
            }]
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add relationship: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error adding relationship:', error);
      throw error;
    }
  }

  async removeRelationship(user: string, relation: string, object: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_model_id: this.config.authorizationModelId,
          deletes: {
            tuple_keys: [{
              user,
              relation,
              object
            }]
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing relationship:', error);
      return false;
    }
  }

  async removeAllExpenseTuples(expenseId: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.log('⏭️ OpenFGA not initialized, skipping tuple deletion');
      return true; // Don't fail the delete operation if FGA is not available
    }

    try {
      console.log(`🗑️ Removing all FGA tuples for expense: ${expenseId}`);
      
      // First, read all tuples for this expense
      const response = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_model_id: this.config.authorizationModelId,
          tuple_key: {
            object: `expense:${expenseId}`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to read tuples: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.tuples && data.tuples.length > 0) {
        // Delete all tuples for this expense
        const deleteResponse = await fetch(`${this.config.apiUrl}/stores/${this.config.storeId}/write`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorization_model_id: this.config.authorizationModelId,
            deletes: {
              tuple_keys: data.tuples.map((tuple: any) => ({
                user: tuple.key.user,
                relation: tuple.key.relation,
                object: tuple.key.object
              }))
            }
          })
        });

        if (!deleteResponse.ok) {
          throw new Error(`Failed to delete tuples: ${deleteResponse.status}`);
        }

        console.log(`✅ Deleted ${data.tuples.length} FGA tuples for expense ${expenseId}`);
      } else {
        console.log(`ℹ️ No FGA tuples found for expense ${expenseId}`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error removing FGA tuples for expense ${expenseId}:`, error);
      return false;
    }
  }

  getStatus(): { initialized: boolean; apiUrl: string; storeId: string } {
    return {
      initialized: this.isInitialized,
      apiUrl: this.config.apiUrl,
      storeId: this.config.storeId
    };
  }
}

export const openfgaService = OpenFGAService.getInstance(); 