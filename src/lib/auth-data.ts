import { apiFetch } from './api';
// Data Service for Authenticated Mode
// This service handles data operations for authenticated users

import { authOpenfgaService } from './auth-openfga';
import { Expense } from './fga';
import { API_BASE_URL } from './config';

class AuthDataService {
  private profile: { userId: string; department: string; limit: number } | null = null;
  private baseUrl = `${API_BASE_URL}/api/auth`;

  async getExpenses(): Promise<Expense[]> {
    try {
      const profileResponse = await apiFetch(`${this.baseUrl}/profile`);
      if (!profileResponse.ok) throw new Error('User profile is unavailable');
      this.profile = await profileResponse.json();
      const response = await apiFetch(`${this.baseUrl}/expenses`);
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.statusText}`);
      }
      const data = await response.json();
      return data.expenses || [];
    } catch (error) {
      console.error('Error fetching authenticated expenses:', error);
      return [];
    }
  }

  async addExpense(expense: Expense): Promise<boolean> {
    try {
      const response = await apiFetch(`${this.baseUrl}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        throw new Error(`Failed to add expense: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error adding authenticated expense:', error);
      return false;
    }
  }

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<boolean> {
    try {
      const response = await apiFetch(`${this.baseUrl}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating authenticated expense:', error);
      return false;
    }
  }

  async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`${this.baseUrl}/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting authenticated expense:', error);
      return false;
    }
  }

  async getVisibleExpenses(currentUser: string): Promise<Expense[]> {
    try {
      // Get all expenses first
      const allExpenses = await this.getExpenses();
      
      // Filter expenses based on user permissions
      const visibleExpenses: Expense[] = [];
      
      for (const expense of allExpenses) {
        try {
          const canView = await authOpenfgaService.check(
            currentUser,
            'can_view',
            `expense:${expense.id}`
          );
          
          if (canView) {
            visibleExpenses.push(expense);
          }
        } catch (error) {
          console.warn(`Error checking view permission for expense ${expense.id}:`, error);
          // If permission check fails, don't include the expense
        }
      }
      
      return visibleExpenses;
    } catch (error) {
      console.error('Error getting visible authenticated expenses:', error);
      return [];
    }
  }

  async approveExpense(expenseId: string, currentUser: string): Promise<boolean> {
    try {
      // Check if user can approve this expense
      const canApprove = await authOpenfgaService.check(
        currentUser,
        'can_approve',
        `expense:${expenseId}`
      );

      if (!canApprove) {
        console.warn(`User ${currentUser} cannot approve expense ${expenseId}`);
        return false;
      }

      // Update the expense status
      const success = await this.updateExpense(expenseId, { status: 'Approved' });

      return success;
    } catch (error) {
      console.error('Error approving authenticated expense:', error);
      return false;
    }
  }

  async denyExpense(expenseId: string, currentUser: string, reason?: string): Promise<boolean> {
    try {
      // Check if user can approve this expense (same permission for deny)
      const canApprove = await authOpenfgaService.check(
        currentUser,
        'can_approve',
        `expense:${expenseId}`
      );

      if (!canApprove) {
        console.warn(`User ${currentUser} cannot deny expense ${expenseId}`);
        return false;
      }

      // Update the expense status
      const updates: Partial<Expense> = { status: 'Denied' };

      if (reason) {
        updates.denialReason = reason;
      }

      const success = await this.updateExpense(expenseId, updates);
      return success;
    } catch (error) {
      console.error('Error denying authenticated expense:', error);
      return false;
    }
  }

  async resetExpense(expenseId: string, currentUser: string): Promise<boolean> {
    try {
      // Check if user can approve this expense (same permission for reset)
      const canApprove = await authOpenfgaService.check(
        currentUser,
        'can_approve',
        `expense:${expenseId}`
      );

      if (!canApprove) {
        console.warn(`User ${currentUser} cannot reset expense ${expenseId}`);
        return false;
      }

      // Reset the expense status
      const success = await this.updateExpense(expenseId, { status: 'Pending' });

      return success;
    } catch (error) {
      console.error('Error resetting authenticated expense:', error);
      return false;
    }
  }

  async batchCheckApprovalPermissions(currentUser: string, expenseIds: string[]): Promise<Record<string, { canApprove: boolean; reason?: string }>> {
    const results: Record<string, { canApprove: boolean; reason?: string }> = {};
    
    try {
      // Get all expenses first
      const allExpenses = await this.getExpenses();
      const expenseMap = new Map(allExpenses.map(exp => [exp.id, exp]));
      
      // Get user's approval limit
      const approvalLimit = this.getUserApprovalLimit(currentUser);
      
      // Check permissions for each expense
      for (const expenseId of expenseIds) {
        try {
          // Check OpenFGA permission
          const canApprove = await authOpenfgaService.check(
            currentUser,
            'can_approve',
            `expense:${expenseId}`
          );
          
          if (!canApprove) {
            results[expenseId] = { canApprove: false, reason: 'No approval permission for this expense' };
            continue;
          }
          
          // Check expense exists and amount limit
          const expense = expenseMap.get(expenseId);
          if (!expense) {
            results[expenseId] = { canApprove: false, reason: 'Expense not found' };
            continue;
          }
          
          if (expense.amount > approvalLimit) {
            results[expenseId] = { 
              canApprove: false, 
              reason: `Amount $${expense.amount} exceeds your approval limit of $${approvalLimit}` 
            };
            continue;
          }
          
          results[expenseId] = { canApprove: true };
        } catch (error) {
          console.error(`Error checking approval permission for ${expenseId}:`, error);
          results[expenseId] = { canApprove: false, reason: 'Error checking permissions' };
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in batch approval permission check:', error);
      // Return default results for all expenses
      expenseIds.forEach(expenseId => {
        results[expenseId] = { canApprove: false, reason: 'Error checking permissions' };
      });
      return results;
    }
  }

  async batchCheckDenialPermissions(currentUser: string, expenseIds: string[]): Promise<Record<string, { canDeny: boolean; reason?: string }>> {
    const results: Record<string, { canDeny: boolean; reason?: string }> = {};
    
    try {
      // Get all expenses first
      const allExpenses = await this.getExpenses();
      const expenseMap = new Map(allExpenses.map(exp => [exp.id, exp]));
      
      // Check permissions for each expense
      for (const expenseId of expenseIds) {
        try {
          // Check OpenFGA permission
          const canApprove = await authOpenfgaService.check(
            currentUser,
            'can_approve',
            `expense:${expenseId}`
          );
          
          if (!canApprove) {
            results[expenseId] = { canDeny: false, reason: 'No approval permission for this expense' };
            continue;
          }
          
          // Check expense exists
          const expense = expenseMap.get(expenseId);
          if (!expense) {
            results[expenseId] = { canDeny: false, reason: 'Expense not found' };
            continue;
          }
          
          // No amount limit for denial
          results[expenseId] = { canDeny: true };
        } catch (error) {
          console.error(`Error checking denial permission for ${expenseId}:`, error);
          results[expenseId] = { canDeny: false, reason: 'Error checking permissions' };
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in batch denial permission check:', error);
      // Return default results for all expenses
      expenseIds.forEach(expenseId => {
        results[expenseId] = { canDeny: false, reason: 'Error checking permissions' };
      });
      return results;
    }
  }

  async batchCheckResetPermissions(currentUser: string, expenseIds: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    try {
      // Check permissions for each expense
      for (const expenseId of expenseIds) {
        try {
          const canReset = await authOpenfgaService.check(
            currentUser,
            'can_approve',
            `expense:${expenseId}`
          );
          results[expenseId] = canReset;
        } catch (error) {
          console.error(`Error checking reset permission for ${expenseId}:`, error);
          results[expenseId] = false;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in batch reset permission check:', error);
      // Return default results for all expenses
      expenseIds.forEach(expenseId => {
        results[expenseId] = false;
      });
      return results;
    }
  }

  async getAuthorizationStatus(): Promise<string> {
    try {
      const response = await apiFetch(`${this.baseUrl}/auth/status`);
      if (!response.ok) {
        return 'Not Available';
      }
      const data = await response.json();
      return data.initialized ? 'Configured' : 'Not Available';
    } catch (error) {
      console.error('Error getting authenticated authorization status:', error);
      return 'Not Available';
    }
  }

  // Get user summary for AI assistant
  async getUserSummary(userId: string): Promise<string> {
    try {
      const visibleExpenses = await this.getVisibleExpenses(userId);
      const pendingExpenses = visibleExpenses.filter(e => e.status === 'Pending');
      const approvedExpenses = visibleExpenses.filter(e => e.status === 'Approved');
      const deniedExpenses = visibleExpenses.filter(e => e.status === 'Denied');
      
      const totalAmount = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);
      const pendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Display the policy profile returned by the authenticated API.
      const approvalLimit = this.getUserApprovalLimit(userId);
      const department = this.getUserDepartment(userId);
      
      return `User: ${userId}, Department: ${department}, Approval Limit: $${approvalLimit}, Total Expenses: ${visibleExpenses.length}, Pending: ${pendingExpenses.length}, Approved: ${approvedExpenses.length}, Denied: ${deniedExpenses.length}, Total Amount: $${totalAmount}, Pending Amount: $${pendingAmount}`;
    } catch (error) {
      console.error('Error getting authenticated user summary:', error);
      return `User: ${userId}, Error getting summary`;
    }
  }

  // Get user approval limit
  private getUserApprovalLimit(userId: string): number {
    return this.profile?.userId === userId.replace(/^user:/, '') ? Number(this.profile.limit) || 0 : 0;
  }

  private getUserDepartment(userId: string): string {
    return this.profile?.userId === userId.replace(/^user:/, '') ? this.profile.department : 'Unknown';
  }

}

export const authDataService = new AuthDataService();
