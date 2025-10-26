import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, LogIn, Shield, Users } from 'lucide-react';
import { useEffect } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  // Handle Auth0 callback - if user is authenticated, redirect to app
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleDemoMode = () => {
    navigate('/demo');
  };

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        audience: 'https://smartspend',
        connection: 'Username-Password-Authentication',
        scope: 'openid profile email',
      },
      appState: {
        returnTo: '/app'
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">SmartSpend</h1>
          <p className="text-2xl text-gray-600">Intelligent Expense Management with Fine-Grained Authorization</p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Experience the power of modern authorization with Auth0FGA and AI-driven expense insights
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-blue-600" />
              <CardTitle>Fine-Grained Authorization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based access control powered by Auth0FGA for precise permission management
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-green-600" />
              <CardTitle>Multi-Role Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Support for Software Engineers, Managers, VPs, and Finance Analysts with appropriate access levels
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <LogIn className="h-12 w-12 mx-auto text-purple-600" />
              <CardTitle>Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Enterprise-grade authentication with Auth0 for production-ready security
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-6 mt-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-gray-800">Choose Your Experience</h2>
            <p className="text-lg text-gray-600">Try the demo or sign in with your account</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              onClick={handleDemoMode}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg min-w-[200px]"
            >
              <Play className="mr-2 h-6 w-6" />
              Demo Mode
            </Button>
            
            <div className="text-gray-400 text-sm">or</div>
            
            <Button 
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="border-gray-300 hover:bg-gray-50 px-8 py-4 text-lg min-w-[200px]"
            >
              <LogIn className="mr-2 h-6 w-6" />
              Sign In
            </Button>
          </div>
        </div>

        {/* Demo Mode Description */}
        <Card className="mt-12 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Demo Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-left space-y-2">
              <p>• Switch between different user personas (Software Engineer, Manager, VP, Finance)</p>
              <p>• Experience role-based authorization without authentication</p>
              <p>• Perfect for demonstrations and testing authorization flows</p>
              <p>• Uses sample data and predefined user roles</p>
            </CardDescription>
          </CardContent>
        </Card>

        {/* Sign In Description */}
        <Card className="mt-6 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-green-600" />
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-left space-y-2">
              <p>• Secure authentication with Auth0</p>
              <p>• Real user roles based on your email and permissions</p>
              <p>• Production-ready authorization system</p>
              <p>• Personalized expense management experience</p>
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;
