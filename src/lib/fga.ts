// Fine-Grained Authorization (FGA) System
// This implements a proper authorization system with role-based access control

export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Denied';
  submittedBy: string;
  department: string;
  category: string;
  approvedBy?: string;
  approvedDate?: string;
}

// User definitions with proper permission structure
export const USERS: Record<string, User> = {
  'dina_dev': {
    id: 'dina_dev',
    name: 'Dina Dev',
    role: 'Software Engineer',
    department: 'Engineering',
    avatar: '👩‍💻',
    description: 'Can view own expenses only',
    permissions: [
      { resource: 'expense', action: 'read', conditions: { owner: 'dina_dev' } }
    ]
  },
  'raj_manager': {
    id: 'raj_manager',
    name: 'Raj Manager',
    role: 'Engineering Manager',
    department: 'Engineering',
    avatar: '👨‍💼',
    description: 'Approves up to $500 for direct reports',
    permissions: [
      { resource: 'expense', action: 'read', conditions: { manager: 'raj_manager' } },
      { resource: 'expense', action: 'approve', conditions: { manager: 'raj_manager', maxAmount: 500 } }
    ]
  },
  'chen_vp': {
    id: 'chen_vp',
    name: 'Chen VP',
    role: 'VP of Engineering',
    department: 'Engineering',
    avatar: '👔',
    description: 'Department head, approves up to $5,000',
    permissions: [
      { resource: 'expense', action: 'read', conditions: { department: 'Engineering' } },
      { resource: 'expense', action: 'approve', conditions: { department: 'Engineering', maxAmount: 5000 } }
    ]
  },
  'frank_finance': {
    id: 'frank_finance',
    name: 'Frank Finance',
    role: 'Financial Analyst',
    department: 'Finance',
    avatar: '💼',
    description: 'Can view all expenses for auditing',
    permissions: [
      { resource: 'expense', action: 'read', conditions: { all: true } }
    ]
  }
};

// FGA Service Class
export class FGAService {
  private static instance: FGAService;
  
  private constructor() {}
  
  static getInstance(): FGAService {
    if (!FGAService.instance) {
      FGAService.instance = new FGAService();
    }
    return FGAService.instance;
  }

  // Check if user can perform action on resource
  can(userId: string, action: string, resource: string, context?: Record<string, any>): boolean {
    const user = USERS[userId];
    if (!user) return false;

    const permission = user.permissions.find(p => 
      p.resource === resource && p.action === action
    );

    if (!permission) return false;

    // Check conditions
    if (permission.conditions) {
      return this.evaluateConditions(permission.conditions, context);
    }

    return true;
  }

  // Get visible expenses for user
  getVisibleExpenses(userId: string, expenses: Expense[]): Expense[] {
    const user = USERS[userId];
    if (!user) return [];

    const permission = user.permissions.find(p => 
      p.resource === 'expense' && p.action === 'read'
    );

    if (!permission) return [];

    if (permission.conditions?.all) {
      return expenses; // Can see all expenses
    }

    if (permission.conditions?.owner) {
      return expenses.filter(exp => exp.submittedBy === permission.conditions.owner);
    }

    if (permission.conditions?.department) {
      return expenses.filter(exp => exp.department === permission.conditions.department);
    }

    return [];
  }

  // Check if user can approve specific expense
  canApproveExpense(userId: string, expense: Expense): boolean {
    const user = USERS[userId];
    if (!user) return false;

    // Can't approve own expenses
    if (expense.submittedBy === userId) return false;

    const permission = user.permissions.find(p => 
      p.resource === 'expense' && p.action === 'approve'
    );

    if (!permission) return false;

    // Check amount limit
    if (permission.conditions?.maxAmount && expense.amount > permission.conditions.maxAmount) {
      return false;
    }

    // Check department condition
    if (permission.conditions?.department && expense.department !== permission.conditions.department) {
      return false;
    }

    return true;
  }

  // Get user's approval limit
  getApprovalLimit(userId: string): number {
    const user = USERS[userId];
    if (!user) return 0;

    const permission = user.permissions.find(p => 
      p.resource === 'expense' && p.action === 'approve'
    );

    return permission?.conditions?.maxAmount || 0;
  }

  // Get user's department
  getUserDepartment(userId: string): string | null {
    const user = USERS[userId];
    return user?.department || null;
  }

  // Evaluate conditions against context
  private evaluateConditions(conditions: Record<string, any>, context?: Record<string, any>): boolean {
    if (!context) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'all' && value === true) {
        return true;
      }

      if (context[key] !== value) {
        return false;
      }
    }

    return true;
  }

  // Get user permissions summary
  getUserPermissionsSummary(userId: string): string[] {
    const user = USERS[userId];
    if (!user) return [];

    return user.permissions.map(p => `${p.action} ${p.resource}`);
  }
}

// Export singleton instance
export const fgaService = FGAService.getInstance(); 