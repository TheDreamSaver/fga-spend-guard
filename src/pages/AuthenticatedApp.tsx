import { setAccessTokenProvider } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import ExpenseReports from '@/components/ExpenseReports';
import AIAssistant from '@/components/AIAssistant';
import AddExpenseModal from '@/components/AddExpenseModal';

const AuthenticatedApp = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  const [apiReady, setApiReady] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) return;
    setAccessTokenProvider(() => getAccessTokenSilently());
    setApiReady(true);
    return () => setAccessTokenProvider(null);
  }, [isAuthenticated, getAccessTokenSilently]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const expenseReportsRef = useRef<{ refresh: () => void } | null>(null);

  const handleExpenseAdded = () => {
    console.log('✅ Expense added successfully - refreshing expense data');
    // Refresh only the expense reports instead of full page reload
    setTimeout(() => {
      if (expenseReportsRef.current) {
        expenseReportsRef.current.refresh();
      }
    }, 500);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleBackToLanding = () => {
    // Sign out and go to landing page
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // Show loading state
  if (isLoading || (isAuthenticated && !apiReady)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please sign in to access the expense management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => loginWithRedirect()}
              className="w-full"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Landing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user ID for FGA
  const identity = user?.[import.meta.env.VITE_AUTH0_FGA_USER_CLAIM || 'sub'] || '';
  const fgaUserId = identity ? `user:${identity}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={handleBackToLanding}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Landing
            </Button>
            <Badge variant="default" className="text-sm bg-green-600">
              Authenticated Mode
            </Badge>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">SmartSpend</h1>
          <p className="text-lg text-gray-600">Intelligent Expense Management with Fine-Grained Authorization</p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Welcome, {user?.name || user?.email}
            </CardTitle>
            <CardDescription>
              You are signed in and have access to expenses based on your role and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Email</h4>
                <p className="text-lg">{user?.email}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600">FGA User ID</h4>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">{fgaUserId}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Status</h4>
                <Badge variant="default" className="bg-green-600">
                  Authenticated
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Expense Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Expense
              </Button>
            </div>
          </CardContent>
        </Card>
          
        {/* Main Layout - User Details and Chat Widget Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Details and Expense Reports */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expense Reports */}
            <ExpenseReports 
              key={`expense-reports-${fgaUserId}`}
              ref={expenseReportsRef}
              currentUser={fgaUserId} 
              isAuthenticated={true}
            />
          </div>

          {/* Right Column - AI Assistant */}
          <div>
            <AIAssistant 
              currentUser={fgaUserId} 
              isAuthenticated={true}
              onExpenseAction={() => {
                // Refresh only the expense reports instead of full page reload
                console.log('🤖 AI action detected, refreshing expense data');
                if (expenseReportsRef.current) {
                  expenseReportsRef.current.refresh();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onExpenseAdded={handleExpenseAdded}
        isAuthenticated={true}
        userEmail={identity}
      />
    </div>
  );
};

export default AuthenticatedApp;
