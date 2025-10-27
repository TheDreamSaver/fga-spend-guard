import { dataService } from './data';
import { API_BASE_URL as ConfigAPI_BASE_URL } from './config';

// Backend API configuration
const API_BASE_URL = ConfigAPI_BASE_URL;

export class OpenFGAService {
  private static instance: OpenFGAService;
  private isInitialized: boolean = false;
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
      // Check backend auth status
      const response = await fetch(`${API_BASE_URL}/api/auth/status`);
      if (!response.ok) {
        console.warn('Backend auth service not available');
        return false;
      }

      const status = await response.json();
      this.isInitialized = status.initialized;
      
      if (this.isInitialized) {
        console.log('✅ Backend OpenFGA service initialized successfully');
      } else {
        console.warn('Backend OpenFGA service not initialized');
      }
      
      return this.isInitialized;
    } catch (error) {
      console.warn('Failed to initialize backend OpenFGA service:', error);
      return false;
    }
  }

  // Verify store access
  private async verifyStoreAccess(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/status`);
      if (!response.ok) {
        throw new Error(`Store access verification failed: ${response.status}`);
      }
      const status = await response.json();
      if (!status.initialized) {
        throw new Error('Backend OpenFGA service not initialized');
      }
    } catch (error) {
      console.error('Error verifying store access:', error);
      throw error;
    }
  }

  // Verify the authorization model exists
  private async verifyAuthorizationModel(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/status`);
      if (!response.ok) {
        throw new Error(`Authorization model verification failed: ${response.status}`);
      }
      const status = await response.json();
      if (!status.initialized) {
        throw new Error('Backend OpenFGA service not initialized');
      }
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
      const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user,
          relation,
          object
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Cache the result
      this.setCachedResult(cacheKey, data.allowed);
      
      return data.allowed;
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
      const response = await fetch(`${API_BASE_URL}/api/auth/list-objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user,
          relation,
          type
        })
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      // Cache the result
      this.setCachedResult(cacheKey, data.objects || []);
      
      return data.objects || [];
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
      const response = await fetch(`${API_BASE_URL}/api/auth/add-relationship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user,
          relation,
          object
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
      const response = await fetch(`${API_BASE_URL}/api/auth/remove-relationship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user,
          relation,
          object
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success;
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
      
      const response = await fetch(`${API_BASE_URL}/api/auth/remove-expense-tuples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenseId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to remove expense tuples: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Removed FGA tuples for expense ${expenseId}`);
      return data.success;
    } catch (error) {
      console.error(`❌ Error removing FGA tuples for expense ${expenseId}:`, error);
      return false;
    }
  }

  getStatus(): { initialized: boolean; apiUrl: string; storeId: string } {
    return {
      initialized: this.isInitialized,
      apiUrl: API_BASE_URL,
      storeId: 'backend'
    };
  }
}

export const openfgaService = OpenFGAService.getInstance(); 