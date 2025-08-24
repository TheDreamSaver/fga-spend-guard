import { Expense, User } from './fga';
import { OpenFGAService } from './openfga';
import StorageService from './storage';

class DataService {
  private static instance: DataService;
  private openfgaService: OpenFGAService;
  private storageService: StorageService;
  private isOpenFGAInitialized = false;

  private constructor() {
    this.openfgaService = OpenFGAService.getInstance();
    this.storageService = StorageService.getInstance();
    this.initializeOpenFGA();
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private async initializeOpenFGA() {
    try {
      await this.openfgaService.initialize();
      this.isOpenFGAInitialized = true;
      console.log('✅ OpenFGA initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenFGA:', error);
    }
  }

  private async waitForOpenFGA(): Promise<void> {
    if (!this.isOpenFGAInitialized) {
      await this.initializeOpenFGA();
    }
  }

  // Get visible expenses based on user authorization
  async getVisibleExpenses(userId: string): Promise<Expense[]> {
    await this.waitForOpenFGA();
    
    try {
      const allExpenses = await this.storageService.loadExpenses();
      
      // Use batch checking instead of individual calls
      const visibleExpenseIds = await this.openfgaService.listObjects(`user:${userId}`, 'can_view', 'expense');
      
      // Create a set for O(1) lookup
      const visibleExpenseIdSet = new Set(visibleExpenseIds.map(id => id.replace('expense:', '')));
      
      // Filter expenses based on the batch result
      const visibleExpenses = allExpenses.filter(expense => 
        visibleExpenseIdSet.has(expense.id)
      );

      return visibleExpenses;
    } catch (error) {
      console.error('Error getting visible expenses:', error);
      return [];
    }
  }

  // Approve an expense
  async approveExpense(expenseId: string, approvedBy: string): Promise<boolean> {
    await this.waitForOpenFGA();
    
    try {
      console.log(`🔧 DataService: Approving expense ${expenseId} by user ${approvedBy}`);
      
      // First check OpenFGA permissions
      const canApprove = await this.openfgaService.check(`user:${approvedBy}`, 'can_approve', `expense:${expenseId}`);
      if (!canApprove) {
        console.error(`User ${approvedBy} cannot approve expense ${expenseId}`);
        return false;
      }

      // Get the expense to check amount
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        console.error(`Expense ${expenseId} not found`);
        return false;
      }

      // Check approval limit
      const approvalLimit = this.getUserApprovalLimit(approvedBy);
      if (expense.amount > approvalLimit) {
        console.error(`User ${approvedBy} cannot approve expense ${expenseId}: amount $${expense.amount} exceeds limit $${approvalLimit}`);
        return false;
      }

      console.log(`✅ All checks passed, updating expense ${expenseId} in backend...`);
      const success = await this.storageService.updateExpense(expenseId, {
        status: 'Approved',
        approvedBy,
        approvedDate: new Date().toISOString().split('T')[0]
      });

      console.log(`✅ Backend update result for ${expenseId}: ${success}`);
      return success;
    } catch (error) {
      console.error('Error approving expense:', error);
      return false;
    }
  }

  // Deny an expense
  async denyExpense(expenseId: string, deniedBy: string): Promise<boolean> {
    await this.waitForOpenFGA();
    
    try {
      console.log(`🔧 DataService: Denying expense ${expenseId} by user ${deniedBy}`);
      
      // First check OpenFGA permissions
      const canApprove = await this.openfgaService.check(`user:${deniedBy}`, 'can_approve', `expense:${expenseId}`);
      if (!canApprove) {
        console.error(`User ${deniedBy} cannot deny expense ${expenseId}`);
        return false;
      }

      // Get the expense to verify it exists
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        console.error(`Expense ${expenseId} not found`);
        return false;
      }

      // Note: No amount limit check for denial - managers can deny any expense they have permission for
      // This allows them to reject expensive expenses that exceed their approval limit

      console.log(`✅ All checks passed, updating expense ${expenseId} in backend...`);
      const success = await this.storageService.updateExpense(expenseId, {
        status: 'Denied',
        approvedBy: deniedBy,
        approvedDate: new Date().toISOString().split('T')[0]
      });

      console.log(`✅ Backend update result for ${expenseId}: ${success}`);
      return success;
    } catch (error) {
      console.error('Error denying expense:', error);
      return false;
    }
  }

  // Reset expense status to pending
  async resetExpenseStatus(expenseId: string, resetBy: string): Promise<boolean> {
    await this.waitForOpenFGA();
    
    try {
      // Check if user can approve this expense (same permission as approval, but without amount limit)
      const canApprove = await this.openfgaService.check(`user:${resetBy}`, 'can_approve', `expense:${expenseId}`);
      if (!canApprove) {
        console.error(`User ${resetBy} cannot reset expense ${expenseId}`);
        return false;
      }

      const success = await this.storageService.updateExpense(expenseId, {
        status: 'Pending',
        approvedBy: undefined,
        approvedDate: undefined
      });

      return success;
    } catch (error) {
      console.error('Error resetting expense status:', error);
      return false;
    }
  }

  // Check if user can reset an expense status to pending (only OpenFGA permission, no amount limit)
  async canResetExpenseStatus(userId: string, expenseId: string): Promise<boolean> {
    await this.waitForOpenFGA();
    try {
      return await this.openfgaService.check(`user:${userId}`, 'can_approve', `expense:${expenseId}`);
    } catch (error) {
      console.error('Error checking reset permission:', error);
      return false;
    }
  }

  // Get expense by ID
  async getExpenseById(expenseId: string): Promise<Expense | null> {
    try {
      const expenses = await this.storageService.loadExpenses();
      return expenses.find(exp => exp.id === expenseId) || null;
    } catch (error) {
      console.error('Error getting expense by ID:', error);
      return null;
    }
  }

  // Check if user can approve an expense and return detailed reason
  async canApproveExpense(userId: string, expenseId: string): Promise<{ canApprove: boolean; reason?: string }> {
    await this.waitForOpenFGA();
    
    try {
      // First check OpenFGA permissions
      const canApprove = await this.openfgaService.check(`user:${userId}`, 'can_approve', `expense:${expenseId}`);
      if (!canApprove) {
        return { canApprove: false, reason: 'No approval permission for this expense' };
      }

      // Get the expense to check amount
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        return { canApprove: false, reason: 'Expense not found' };
      }

      // Check approval limit
      const approvalLimit = this.getUserApprovalLimit(userId);
      if (expense.amount > approvalLimit) {
        return { 
          canApprove: false, 
          reason: `Amount $${expense.amount} exceeds your approval limit of $${approvalLimit}` 
        };
      }

      return { canApprove: true };
    } catch (error) {
      console.error('Error checking approval permission:', error);
      return { canApprove: false, reason: 'Error checking permissions' };
    }
  }

  // Check if user can deny an expense (no amount limit)
  async canDenyExpense(userId: string, expenseId: string): Promise<{ canDeny: boolean; reason?: string }> {
    await this.waitForOpenFGA();
    
    try {
      // Check OpenFGA permissions
      const canApprove = await this.openfgaService.check(`user:${userId}`, 'can_approve', `expense:${expenseId}`);
      if (!canApprove) {
        return { canDeny: false, reason: 'No approval permission for this expense' };
      }

      // Get the expense to verify it exists
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        return { canDeny: false, reason: 'Expense not found' };
      }

      // No amount limit for denial - managers can deny any expense they have permission for
      return { canDeny: true };
    } catch (error) {
      console.error('Error checking denial permission:', error);
      return { canDeny: false, reason: 'Error checking permissions' };
    }
  }

  // Add new expense and create OpenFGA tuple
  async addNewExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    await this.waitForOpenFGA();
    
    const newExpense: Expense = {
      ...expense,
      id: await this.generateExpenseId(expense.submittedBy)
    };

    // Save to storage
    const saveSuccess = await this.storageService.addExpense(newExpense);
    if (!saveSuccess) {
      throw new Error('Failed to save expense to storage');
    }

    // Create OpenFGA tuple
    if (this.isOpenFGAInitialized) {
      try {
        console.log(`🔧 Creating FGA tuples for new expense ${newExpense.id} by ${expense.submittedBy}`);
        
        // Create owner relationship
        await this.openfgaService.addRelationship(`user:${expense.submittedBy}`, 'owner', `expense:${newExpense.id}`);
        console.log(`✅ Created owner tuple: user:${expense.submittedBy} -> owner -> expense:${newExpense.id}`);
        
        // Create department relationship
        await this.openfgaService.addRelationship(`department:${expense.department.toLowerCase()}`, 'department', `expense:${newExpense.id}`);
        console.log(`✅ Created department tuple: department:${expense.department.toLowerCase()} -> department -> expense:${newExpense.id}`);
        
        // Note: Manager approval is handled through the user hierarchy (can_manage relation on user type)
        // No need to create manager tuples on expenses
      } catch (error) {
        console.error('❌ Failed to create OpenFGA tuple for new expense:', error);
      }
    } else {
      console.warn('⚠️ OpenFGA not initialized, skipping tuple creation');
    }

    return newExpense;
  }

  // Generate expense ID based on submitter
  private async generateExpenseId(submittedBy: string): Promise<string> {
    // Get existing expenses to determine the next sequential ID
    const existingExpenses = await this.storageService.loadExpenses();
    
    // Determine prefix based on submitter to match FGA tuple format
    let prefix: string;
    if (submittedBy === 'dina_dev') {
      prefix = 'exp_1';
    } else if (submittedBy === 'raj_manager') {
      prefix = 'exp_2';
    } else if (submittedBy === 'chen_vp') {
      prefix = 'exp_3';
    } else if (submittedBy === 'frank_finance') {
      prefix = 'exp_4';
    } else {
      prefix = 'exp_9'; // Fallback for other users
    }
    
    // Find the highest existing ID for this prefix
    const existingIds = existingExpenses
      .filter(exp => exp.id.startsWith(prefix))
      .map(exp => {
        const numPart = exp.id.replace(prefix, '');
        return parseInt(numPart, 10);
      })
      .filter(num => !isNaN(num));
    
    const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    
    return `${prefix}${String(nextNumber).padStart(2, '0')}`;
  }

  // Delete an expense (only allowed for the owner)
  async deleteExpense(expenseId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await this.waitForOpenFGA();
    
    try {
      // First get the expense to check ownership
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        return { success: false, message: 'Expense not found' };
      }

      // Check if the user is the owner
      if (expense.submittedBy !== userId) {
        return { success: false, message: 'Only the expense owner can delete it' };
      }

      console.log(`🗑️ Deleting expense ${expenseId} for user ${userId}`);

      // Delete from storage first
      const storageSuccess = await this.storageService.deleteExpense(expenseId);
      if (!storageSuccess) {
        return { success: false, message: 'Failed to delete expense from storage' };
      }

      // Delete FGA tuples
      if (this.isOpenFGAInitialized) {
        const fgaSuccess = await this.openfgaService.removeAllExpenseTuples(expenseId);
        if (!fgaSuccess) {
          console.warn(`⚠️ Failed to delete FGA tuples for ${expenseId}, but storage deletion succeeded`);
        }
      }

      console.log(`✅ Successfully deleted expense ${expenseId}`);
      return { success: true, message: 'Expense deleted successfully' };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false, message: 'Error deleting expense' };
    }
  }

  // Reset data to default
  async resetData(): Promise<boolean> {
    try {
      return await this.storageService.resetToDefault();
    } catch (error) {
      console.error('Error resetting data:', error);
      return false;
    }
  }

  // Get user approval limit
  private getUserApprovalLimit(userId: string): number {
    const userLimits: Record<string, number> = {
      'dina_dev': 0, // Cannot approve
      'raj_manager': 500,
      'chen_vp': 5000,
      'frank_finance': 0 // Cannot approve
    };
    return userLimits[userId] || 0;
  }

  // Get user department
  private getUserDepartment(userId: string): string {
    const userDepartments: Record<string, string> = {
      'dina_dev': 'Engineering',
      'raj_manager': 'Engineering',
      'chen_vp': 'Engineering',
      'frank_finance': 'Finance'
    };
    return userDepartments[userId] || 'Unknown';
  }

  // Get user summary for AI assistant
  async getUserSummary(userId: string): Promise<string> {
    await this.waitForOpenFGA();
    
    try {
      const visibleExpenses = await this.getVisibleExpenses(userId);
      const pendingExpenses = visibleExpenses.filter(e => e.status === 'Pending');
      const approvedExpenses = visibleExpenses.filter(e => e.status === 'Approved');
      const deniedExpenses = visibleExpenses.filter(e => e.status === 'Denied');
      
      const totalAmount = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);
      const pendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      const approvalLimit = this.getUserApprovalLimit(userId);
      const department = this.getUserDepartment(userId);
      
      return `User: ${userId}, Department: ${department}, Approval Limit: $${approvalLimit}, Total Expenses: ${visibleExpenses.length}, Pending: ${pendingExpenses.length}, Approved: ${approvedExpenses.length}, Denied: ${deniedExpenses.length}, Total Amount: $${totalAmount}, Pending Amount: $${pendingAmount}`;
    } catch (error) {
      console.error('Error getting user summary:', error);
      return `User: ${userId}, Error getting summary`;
    }
  }

  // Get authorization status for UI display
  async getAuthorizationStatus(): Promise<string> {
    await this.waitForOpenFGA();
    
    if (this.isOpenFGAInitialized) {
      return 'Configured';
    } else {
      return 'Not Configured';
    }
  }

  // Batch check approval permissions for multiple expenses
  async batchCheckApprovalPermissions(userId: string, expenseIds: string[]): Promise<Record<string, { canApprove: boolean; reason?: string }>> {
    await this.waitForOpenFGA();
    
    const results: Record<string, { canApprove: boolean; reason?: string }> = {};
    
    try {
      // Get all expenses at once
      const allExpenses = await this.storageService.loadExpenses();
      const expenseMap = new Map(allExpenses.map(exp => [exp.id, exp]));
      
      // Get user's approval limit once
      const approvalLimit = this.getUserApprovalLimit(userId);
      
      // Check permissions for each expense
      for (const expenseId of expenseIds) {
        try {
          // Check OpenFGA permission
          const canApprove = await this.openfgaService.check(`user:${userId}`, 'can_approve', `expense:${expenseId}`);
          
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

  // Batch check denial permissions for multiple expenses
  async batchCheckDenialPermissions(userId: string, expenseIds: string[]): Promise<Record<string, { canDeny: boolean; reason?: string }>> {
    await this.waitForOpenFGA();
    
    const results: Record<string, { canDeny: boolean; reason?: string }> = {};
    
    try {
      // Get all expenses at once
      const allExpenses = await this.storageService.loadExpenses();
      const expenseMap = new Map(allExpenses.map(exp => [exp.id, exp]));
      
      // Check permissions for each expense
      for (const expenseId of expenseIds) {
        try {
          // Check OpenFGA permission
          const canApprove = await this.openfgaService.check(`user:${userId}`, 'can_approve', `expense:${expenseId}`);
          
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

  // Batch check reset permissions for multiple expenses
  async batchCheckResetPermissions(userId: string, expenseIds: string[]): Promise<Record<string, boolean>> {
    await this.waitForOpenFGA();
    
    const results: Record<string, boolean> = {};
    
    try {
      // Check permissions for each expense
      for (const expenseId of expenseIds) {
        try {
          const canReset = await this.openfgaService.check(`user:${userId}`, 'can_approve', `expense:${expenseId}`);
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
}

export const dataService = DataService.getInstance(); 