import { setDemoPersona } from '@/lib/api';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { USERS } from '@/lib/fga';
import ExpenseReports from '@/components/ExpenseReports';
import AIAssistant from '@/components/AIAssistant';
import AddExpenseModal from '@/components/AddExpenseModal';

const DemoApp = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => { setDemoPersona('dina_dev'); return 'dina_dev'; });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Landing
            </Button>
            <Badge variant="secondary" className="text-sm">
              Demo Mode
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">SmartSpend</h1>
          <p className="text-lg text-gray-600">Intelligent Expense Management with Fine-Grained Authorization</p>
        </div>
            
            {/* Persona Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👤 Persona Selector
            </CardTitle>
            <CardDescription>
              Switch between different user roles to see how authorization works
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Select value={currentUser} onValueChange={value => { setDemoPersona(value); setCurrentUser(value); }}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a user persona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(USERS).map(([userId, user]) => (
                    <SelectItem key={userId} value={userId}>
                      <div className="flex items-center gap-2">
                        <span>{user.avatar}</span>
                        <span>{user.name}</span>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
          {/* Current User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {USERS[currentUser].avatar} {USERS[currentUser].name}
                </CardTitle>
                <CardDescription>{USERS[currentUser].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{USERS[currentUser].role}</div>
                    <div className="text-sm text-gray-500">Role</div>
                </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{USERS[currentUser].department}</div>
                    <div className="text-sm text-gray-500">Department</div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Expense Reports */}
            <ExpenseReports 
              key={`expense-reports-${currentUser}`}
              ref={expenseReportsRef}
              currentUser={currentUser} 
              persona={USERS[currentUser]}
              isAuthenticated={false}
            />
          </div>

          {/* Right Column - AI Assistant */}
          <div>
            <AIAssistant 
              currentUser={currentUser} 
              persona={USERS[currentUser]} 
              isAuthenticated={false}
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

        {/* Add Expense Modal */}
        <AddExpenseModal demoUser={currentUser}
          isOpen={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onExpenseAdded={handleExpenseAdded}
          isAuthenticated={false}
        />
      </div>
    </div>
  );
};

export default DemoApp;
