import { Expense } from './fga';

// API-based storage service for persistent JSON file storage
// In production, you'd use a proper database

class StorageService {
  private static instance: StorageService;
  private apiBaseUrl = 'http://localhost:3001/api';
  private defaultExpenses: Expense[] = [
    {
      id: 'exp_101',
      description: 'Laptop accessories',
      amount: 150,
      date: '2024-01-15',
      status: 'Pending',
      submittedBy: 'dina_dev',
      department: 'Engineering',
      category: 'Equipment'
    },
    {
      id: 'exp_102',
      description: 'Conference registration',
      amount: 300,
      date: '2024-01-20',
      status: 'Pending',
      submittedBy: 'dina_dev',
      department: 'Engineering',
      category: 'Training'
    },
    {
      id: 'exp_201',
      description: 'Team lunch',
      amount: 200,
      date: '2024-01-25',
      status: 'Pending',
      submittedBy: 'raj_manager',
      department: 'Engineering',
      category: 'Meals'
    },
    {
      id: 'exp_301',
      description: 'Software licenses',
      amount: 1200,
      date: '2024-02-01',
      status: 'Pending',
      submittedBy: 'chen_vp',
      department: 'Engineering',
      category: 'Software'
    },
    {
      id: 'exp_401',
      description: 'Financial audit tools',
      amount: 500,
      date: '2024-02-05',
      status: 'Pending',
      submittedBy: 'frank_finance',
      department: 'Finance',
      category: 'Tools'
    }
  ];

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Load expenses from API
  async loadExpenses(): Promise<Expense[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/expenses`);
      if (response.ok) {
        const data = await response.json();
        return data.expenses || [];
      } else {
        console.warn('API not available, falling back to default expenses');
        return this.defaultExpenses;
      }
    } catch (error) {
      console.warn('API not available, falling back to default expenses:', error);
      return this.defaultExpenses;
    }
  }

  // Save expenses to API
  async saveExpenses(expenses: Expense[]): Promise<boolean> {
    try {
      // For bulk save, we'll need to implement this differently
      // For now, we'll just return true as individual operations handle saving
      return true;
    } catch (error) {
      console.error('Error saving expenses:', error);
      return false;
    }
  }

  // Add a new expense via API
  async addExpense(expense: Expense): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });
      
      if (response.ok) {
        console.log(`✅ New expense saved to JSON file:`, expense);
        return true;
      } else {
        console.error('Failed to add expense via API');
        return false;
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      return false;
    }
  }

  // Update an existing expense via API
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        console.log(`✅ Expense ${expenseId} updated in JSON file`);
        return true;
      } else {
        console.error('Failed to update expense via API');
        return false;
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  }

  // Delete an expense via API
  async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log(`✅ Expense ${expenseId} deleted from JSON file`);
        return true;
      } else {
        console.error('Failed to delete expense via API');
        return false;
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  // Reset to default expenses via API
  async resetToDefault(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/expenses/reset`, {
        method: 'POST',
      });
      
      if (response.ok) {
        console.log('✅ Expenses reset to default in JSON file');
        return true;
      } else {
        console.error('Failed to reset expenses via API');
        return false;
      }
    } catch (error) {
      console.error('Error resetting expenses:', error);
      return false;
    }
  }

  // Check if API is available
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default StorageService; 