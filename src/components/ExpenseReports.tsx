
import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Eye, EyeOff, AlertTriangle, Database, Receipt, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { dataService } from '@/lib/data';
import { USERS, Expense } from '@/lib/fga';

interface ExpenseReportsProps {
  currentUser: string;
  persona: any;
}

interface ExpensePermission {
  expenseId: string;
  canApprove: boolean;
  canDeny: boolean;
  canReset: boolean;
  approvalMessage: string | null;
  denialMessage: string | null;
}

type SortField = 'id' | 'submittedBy' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export interface ExpenseReportsRef {
  refresh: () => void;
}

const ExpenseReports = forwardRef<ExpenseReportsRef, ExpenseReportsProps>(
  ({ currentUser, persona }, ref) => {
    
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [permissions, setPermissions] = useState<Record<string, ExpensePermission>>({});
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [loadingPermissions, setLoadingPermissions] = useState<Record<string, boolean>>({});
    const [authSystem, setAuthSystem] = useState<'OpenFGA' | 'Not Available'>('Not Available');
    const [sortState, setSortState] = useState<SortState>({ field: 'id', direction: 'asc' });

    const loadExpenses = useCallback(async () => {
      setLoadingExpenses(true);
      try {
        const visibleExpenses = await dataService.getVisibleExpenses(currentUser);
        setExpenses(visibleExpenses);

        // Get authorization system status
        const authStatus = await dataService.getAuthorizationStatus();
        setAuthSystem(authStatus === 'Configured' ? 'OpenFGA' : 'Not Available');

        // Initialize loading states for permissions
        const initialLoadingStates: Record<string, boolean> = {};
        visibleExpenses.forEach(expense => {
          initialLoadingStates[expense.id] = true;
        });
        setLoadingPermissions(initialLoadingStates);

        // Load permissions for all expenses
        const permissionsMap: Record<string, ExpensePermission> = {};
        
        if (visibleExpenses.length > 0) {
          try {
            // Use batch permission checking for better performance
            const expenseIds = visibleExpenses.map(exp => exp.id);
            
            const [approvalResults, denialResults, resetResults] = await Promise.all([
              dataService.batchCheckApprovalPermissions(currentUser, expenseIds),
              dataService.batchCheckDenialPermissions(currentUser, expenseIds),
              dataService.batchCheckResetPermissions(currentUser, expenseIds)
            ]);
            
            // Combine results into permissions map
            for (const expense of visibleExpenses) {
              const approvalCheck = approvalResults[expense.id];
              const denialCheck = denialResults[expense.id];
              const resetCheck = resetResults[expense.id];
              
            permissionsMap[expense.id] = {
              expenseId: expense.id,
                canApprove: approvalCheck?.canApprove || false,
                canDeny: denialCheck?.canDeny || false,
                canReset: resetCheck || false,
                approvalMessage: approvalCheck?.reason || null,
                denialMessage: denialCheck?.reason || null
            };
            }
          } catch (error) {
            console.error('Error loading batch permissions:', error);
            // Set default permissions if there's an error
            visibleExpenses.forEach(expense => {
            permissionsMap[expense.id] = {
              expenseId: expense.id,
              canApprove: false,
              canDeny: false,
              canReset: false,
              approvalMessage: 'Error loading permissions',
              denialMessage: 'Error loading permissions'
            };
            });
          }
        }
        
        // Mark all permissions as loaded
        setLoadingPermissions({});
        setPermissions(permissionsMap);
      } catch (error) {
        console.error('Error loading expenses:', error);
        toast.error('Failed to load expenses');
      } finally {
        setLoadingExpenses(false);
      }
    }, [currentUser]);

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
      refresh: loadExpenses
    }), [loadExpenses]);

    useEffect(() => {
      loadExpenses();
    }, [loadExpenses]);

    // Sorting function
    const handleSort = (field: SortField) => {
      setSortState(prev => {
        // Prevent unnecessary re-renders by checking if the sort state is actually changing
        if (prev.field === field) {
          const newDirection = prev.direction === 'asc' ? 'desc' : 'asc';
          return prev.direction === newDirection ? prev : { field, direction: newDirection };
        }
        return { field, direction: 'asc' };
      });
    };

    // Get sorted expenses
    const sortedExpenses = useMemo(() => {
      if (!expenses || expenses.length === 0) return [];
      
      // Create a new array to avoid mutating the original
      const expensesToSort = [...expenses];
      
      // Remove any potential duplicates based on ID
      const uniqueExpenses = expensesToSort.filter((expense, index, self) => 
        index === self.findIndex(e => e.id === expense.id)
      );
      
      return uniqueExpenses.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortState.field) {
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'submittedBy':
            aValue = a.submittedBy;
            bValue = b.submittedBy;
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortState.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortState.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }, [expenses, sortState.field, sortState.direction]);

    // Get sort icon for a column
    const getSortIcon = (field: SortField) => {
      if (sortState.field !== field) {
        return <ChevronUp className="w-4 h-4 text-gray-400" />;
      }
      return sortState.direction === 'asc' 
        ? <ChevronUp className="w-4 h-4 text-blue-600" />
        : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    const handleApprove = async (expenseId: string) => {
      try {
        const success = await dataService.approveExpense(expenseId, currentUser);
        if (success) {
          // Update only the specific expense
          setExpenses(prevExpenses => 
            prevExpenses.map(expense => 
              expense.id === expenseId 
                ? { ...expense, status: 'Approved', approvedBy: currentUser, approvedDate: new Date().toISOString().split('T')[0] }
                : expense
            )
          );
          toast.success("Expense approved successfully!");
        } else {
          toast.error("Failed to approve expense. You may not have permission.");
        }
      } catch (error) {
        console.error('Error approving expense:', error);
        toast.error("Failed to approve expense");
      }
    };

    const handleDeny = async (expenseId: string) => {
      try {
        const success = await dataService.denyExpense(expenseId, currentUser);
        if (success) {
          // Update only the specific expense
          setExpenses(prevExpenses => 
            prevExpenses.map(expense => 
              expense.id === expenseId 
                ? { ...expense, status: 'Denied', approvedBy: currentUser, approvedDate: new Date().toISOString().split('T')[0] }
                : expense
            )
          );
          toast.success("Expense denied successfully!");
        } else {
          toast.error("Failed to deny expense. You may not have permission.");
        }
      } catch (error) {
        console.error('Error denying expense:', error);
        toast.error("Failed to deny expense");
      }
    };

    const handleDelete = async (expenseId: string) => {
      if (!confirm(`Are you sure you want to delete expense ${expenseId}? This action cannot be undone.`)) {
        return;
      }

      try {
        const result = await dataService.deleteExpense(expenseId, currentUser);
        if (result.success) {
          // Remove the expense from the local state
          setExpenses(prevExpenses => 
            prevExpenses.filter(expense => expense.id !== expenseId)
          );
          // Also remove from permissions
          setPermissions(prevPermissions => {
            const newPermissions = { ...prevPermissions };
            delete newPermissions[expenseId];
            return newPermissions;
          });
          toast.success("Expense deleted successfully!");
          // Reload page after short delay to ensure UI is consistent
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error(result.message || "Failed to delete expense");
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error("Failed to delete expense");
      }
    };

    const handleReset = async (expenseId: string) => {
      try {
        const success = await dataService.resetExpenseStatus(expenseId, currentUser);
        if (success) {
          // Update only the specific expense
          setExpenses(prevExpenses => 
            prevExpenses.map(expense => 
              expense.id === expenseId 
                ? { ...expense, status: 'Pending', approvedBy: undefined, approvedDate: undefined }
                : expense
            )
          );
          toast.success("Expense status reset to pending.");
        } else {
          toast.error("Failed to reset expense status. You may not have permission.");
        }
      } catch (error) {
        console.error('Error resetting expense status:', error);
        toast.error("Failed to reset expense status");
      }
    };

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Approved':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'Denied':
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-600" />;
  }
};

    const getDescriptionText = () => {
      const user = USERS[currentUser];
      if (!user) return '';

      if (user.department === 'Finance') {
        return 'All company expenses (audit view)';
      } else if (user.role.includes('VP') || user.role.includes('Head')) {
        return `${user.department} department expenses`;
      } else if (user.role.includes('Manager')) {
        return 'Your team\'s expenses';
      } else {
        return 'Your expense reports';
      }
    };

    if (loadingExpenses) {
      return (
        <div className="space-y-6">
          <Card className="bg-white/70 backdrop-blur border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading expense reports...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Expense Reports
                </CardTitle>
                <CardDescription>{getDescriptionText()}</CardDescription>
            </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
                <span>{expenses.length} visible</span>
                <div className="flex items-center gap-1 ml-2">
                  <Database className="w-4 h-4" />
                  <span>{authSystem}</span>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {authSystem === 'Not Available' ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>OpenFGA authorization system not configured.</p>
                <p className="text-sm mt-2">Please configure OpenFGA in the AI Assistant settings.</p>
              </div>
            ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <EyeOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No expense reports visible to your role.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('submittedBy')}
                  >
                    <div className="flex items-center gap-1">
                      Submitter
                      {getSortIcon('submittedBy')}
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      {getSortIcon('amount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {sortedExpenses.map((expense) => {
                    const permission = permissions[expense.id];
                    const isLoadingPermissions = loadingPermissions[expense.id];
                    const canUserApprove = permission?.canApprove || false;
                    const approvalMessage = permission?.approvalMessage || null;
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-mono text-sm">{expense.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{expense.submittedBy}</span>
                          <span className="text-xs text-gray-500">{expense.department}</span>
                        </div>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="font-semibold">
                        ${expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(expense.status)}
                          <Badge variant={
                            expense.status === 'Approved' ? 'default' :
                            expense.status === 'Denied' ? 'destructive' : 'secondary'
                          }>
                            {expense.status}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          {isLoadingPermissions ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-xs text-gray-500">Loading permissions...</span>
                            </div>
                          ) : (
                            <>
                              {expense.status === 'Pending' && (
                                <div className="flex gap-2">
                                  {permission?.canApprove && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleApprove(expense.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Approve
                                    </Button>
                                  )}
                                  {permission?.canDeny && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeny(expense.id)}
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      Deny
                                    </Button>
                                  )}
                                </div>
                              )}
                              {(expense.status === 'Approved' || expense.status === 'Denied') && permission?.canReset && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReset(expense.id)}
                                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                  >
                                    Reset to Pending
                                  </Button>
                                </div>
                              )}
                              {permission && !permission.canApprove && !permission.canDeny && permission.approvalMessage && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  {permission.approvalMessage}
                                </div>
                              )}
                              {permission && permission.canDeny && !permission.canApprove && permission.approvalMessage && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  {permission.approvalMessage}
                                </div>
                              )}
                              {/* Delete button - only available for expense owner */}
                              {expense.submittedBy === currentUser && (
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(expense.id)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
  }
);

ExpenseReports.displayName = 'ExpenseReports';

export default ExpenseReports;
