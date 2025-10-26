// OpenFGA Service for Authenticated Mode
// This service handles authorization for authenticated users

interface AuthOpenFGAService {
  check(user: string, relation: string, object: string): Promise<boolean>;
  listObjects(user: string, relation: string, type: string): Promise<string[]>;
  addRelationship(user: string, relation: string, object: string): Promise<boolean>;
  removeRelationship(user: string, relation: string, object: string): Promise<boolean>;
  removeAllExpenseTuples(expenseId: string): Promise<boolean>;
  getStatus(): Promise<any>;
}

class AuthOpenFGAServiceImpl implements AuthOpenFGAService {
  private baseUrl = 'http://localhost:3001/api/auth/auth';

  async check(user: string, relation: string, object: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, relation, object }),
      });

      if (!response.ok) {
        console.error('Auth FGA check failed:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      return data.allowed;
    } catch (error) {
      console.error('Error checking auth FGA authorization:', error);
      return false;
    }
  }

  async listObjects(user: string, relation: string, type: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list-objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, relation, type }),
      });

      if (!response.ok) {
        console.error('Auth FGA list objects failed:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      return data.objects || [];
    } catch (error) {
      console.error('Error listing auth FGA objects:', error);
      return [];
    }
  }

  async addRelationship(user: string, relation: string, object: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/add-relationship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, relation, object }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding auth FGA relationship:', error);
      return false;
    }
  }

  async removeRelationship(user: string, relation: string, object: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/remove-relationship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, relation, object }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing auth FGA relationship:', error);
      return false;
    }
  }

  async removeAllExpenseTuples(expenseId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/remove-expense-tuples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenseId }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing auth FGA expense tuples:', error);
      return false;
    }
  }

  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      
      if (!response.ok) {
        return { initialized: false, error: 'Failed to get status' };
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting auth FGA status:', error);
      return { initialized: false, error: error.message };
    }
  }
}

export const authOpenfgaService = new AuthOpenFGAServiceImpl();
