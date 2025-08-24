
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Eye, EyeOff, Database } from 'lucide-react';
import { dataService } from '@/lib/data';
import { USERS, Budget } from '@/lib/fga';

interface BudgetOverviewProps {
  currentUser: string;
  persona: any;
}

const BudgetOverview = ({ currentUser, persona }: BudgetOverviewProps) => {
  const [budgets, setBudgets] = useState<Record<string, Budget>>({});
  const [loading, setLoading] = useState(true);
  const [authSystem, setAuthSystem] = useState<'OpenFGA' | 'Not Available'>('Not Available');

  useEffect(() => {
    loadBudgets();
  }, [currentUser]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const visibleBudgets = await dataService.getVisibleBudgets(currentUser);
      setBudgets(visibleBudgets);
      
      // Get authorization system status
      const authStatus = dataService.getAuthorizationStatus();
      setAuthSystem(authStatus.system);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSpendingTrend = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100;
    return percentage > 80 ? 'high' : percentage > 60 ? 'medium' : 'low';
  };

  const getBudgetInsights = () => {
    const user = USERS[currentUser];
    if (!user) return '';

    if (user.department === 'Finance') {
      return "Full company budget visibility for financial oversight";
    } else if (user.role.includes('VP') || user.role.includes('Head')) {
      return `Department head view - ${user.department} budget details`;
    } else {
      return "Limited to your department budget only";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/70 backdrop-blur border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading budget information...</p>
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
              <CardTitle className="text-xl text-gray-900">Budget Overview</CardTitle>
              <CardDescription>{getBudgetInsights()}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
                {Object.keys(budgets).length} department(s)
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {authSystem}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {authSystem === 'Not Available' ? (
        <Card className="bg-white/70 backdrop-blur border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>OpenFGA authorization system not configured.</p>
              <p className="text-sm mt-2">Please configure OpenFGA in the AI Assistant settings.</p>
            </div>
          </CardContent>
        </Card>
      ) : Object.keys(budgets).length === 0 ? (
        <Card className="bg-white/70 backdrop-blur border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <EyeOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No budget information visible to your role.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(budgets).map(([department, budget]) => {
            const spentPercentage = (budget.spent / budget.allocated) * 100;
            const trend = getSpendingTrend(budget.spent, budget.allocated);
            
            return (
              <Card key={department} className="bg-white/70 backdrop-blur border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{department}</CardTitle>
                    <Badge variant={trend === 'high' ? 'destructive' : trend === 'medium' ? 'secondary' : 'default'}>
                      {Math.round(spentPercentage)}% Used
                    </Badge>
                  </div>
                  <CardDescription>{budget.period}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(budget.allocated)}
                      </div>
                      <div className="text-xs text-gray-500">Allocated</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(budget.spent)}
                      </div>
                      <div className="text-xs text-gray-500">Spent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(budget.remaining)}
                      </div>
                      <div className="text-xs text-gray-500">Remaining</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget Utilization</span>
                      <span>{Math.round(spentPercentage)}%</span>
                    </div>
                    <Progress 
                      value={spentPercentage} 
                      className="h-3"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      {trend === 'high' ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">High utilization</span>
                        </>
                      ) : trend === 'medium' ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600">Moderate spending</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">On track</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((budget.remaining / budget.allocated) * 100)}% available
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Card for Finance Users */}
      {currentUser === 'frank_finance' && authSystem === 'OpenFGA' && Object.keys(budgets).length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Company-wide Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(Object.values(budgets).reduce((sum, budget) => sum + budget.allocated, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Allocated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(Object.values(budgets).reduce((sum, budget) => sum + budget.spent, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(Object.values(budgets).reduce((sum, budget) => sum + budget.remaining, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((Object.values(budgets).reduce((sum, budget) => sum + budget.spent, 0) / 
                              Object.values(budgets).reduce((sum, budget) => sum + budget.allocated, 0)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Utilization</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetOverview;
