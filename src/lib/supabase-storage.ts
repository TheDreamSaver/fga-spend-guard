import { createClient } from '@supabase/supabase-js';
import { Expense } from './fga';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseStorageService {
  private tableName: string;

  constructor(isAuthenticated: boolean = false) {
    this.tableName = isAuthenticated ? 'auth_expenses' : 'expenses';
  }

  async loadExpenses(): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading expenses:', error);
      return [];
    }
  }

  async addExpense(expense: Expense): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .insert([expense]);

      if (error) {
        console.error('Error adding expense:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      return false;
    }
  }

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', expenseId);

      if (error) {
        console.error('Error updating expense:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  }

  async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  async resetToDefault(): Promise<boolean> {
    try {
      // Delete all expenses
      const { error: deleteError } = await supabase
        .from(this.tableName)
        .delete()
        .neq('id', 'dummy'); // Delete all

      if (deleteError) {
        console.error('Error deleting expenses:', deleteError);
        return false;
      }

      // Add default expenses
      const defaultExpenses = this.getDefaultExpenses();
      
      const { error: insertError } = await supabase
        .from(this.tableName)
        .insert(defaultExpenses);

      if (insertError) {
        console.error('Error inserting default expenses:', insertError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error resetting expenses:', error);
      return false;
    }
  }

  private getDefaultExpenses(): Expense[] {
    return [
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
  }
}

export default SupabaseStorageService;

