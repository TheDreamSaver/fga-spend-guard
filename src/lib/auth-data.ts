// Data Service for Authenticated Mode
// This service handles data operations for authenticated users

import { authOpenfgaService } from './auth-openfga';
import { Expense } from './fga';

class AuthDataService {
  private baseUrl = 'http://localhost:3001/api/auth';

  async getExpenses(): Promise<Expense[]> {
    try {
      const response = await fetch(`${this.baseUrl}/expenses`);
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
      const response = await fetch(`${this.baseUrl}/expenses`, {
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
      const response = await fetch(`${this.baseUrl}/expenses/${expenseId}`, {
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
      const response = await fetch(`${this.baseUrl}/expenses/${expenseId}`, {
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
      const success = await this.updateExpense(expenseId, { 
        status: 'Approved',
        approvedBy: currentUser,
        approvedAt: new Date().toISOString()
      } as Partial<Expense>);

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
      const updates: Partial<Expense & { denialReason?: string; deniedBy?: string; deniedAt?: string }> = { 
        status: 'Denied',
        deniedBy: currentUser,
        deniedAt: new Date().toISOString()
      };

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
      const success = await this.updateExpense(expenseId, { 
        status: 'Pending',
        approvedBy: undefined,
        approvedAt: undefined,
        deniedBy: undefined,
        deniedAt: undefined,
        denialReason: undefined
      } as Partial<Expense>);

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
      const response = await fetch(`${this.baseUrl}/auth/status`);
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
      
      // Get approval limit and department from hardcoded user data (same as demo mode)
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
    // Remove 'user:' prefix if present (for FGA format)
    const normalizedUserId = userId.replace(/^user:/, '');
    
    const userLimits: Record<string, number> = {
      'dina.dev@company.com': 0, // Cannot approve
      'raj.manager@company.com': 500,
      'chen.vp@company.com': 5000,
      'frank.finance@company.com': 0 // Cannot approve
    };
    return userLimits[normalizedUserId] || 0;
  }

  // Get user department
  private getUserDepartment(userId: string): string {
    // Remove 'user:' prefix if present (for FGA format)
    const normalizedUserId = userId.replace(/^user:/, '');
    
    const userDepartments: Record<string, string> = {
      'dina.dev@company.com': 'Engineering',
      'raj.manager@company.com': 'Engineering',
      'chen.vp@company.com': 'Engineering',
      'frank.finance@company.com': 'Finance'
    };
    return userDepartments[normalizedUserId] || 'Unknown';
  }
}

export const authDataService = new AuthDataService();
