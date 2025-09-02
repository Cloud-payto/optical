import React, { useState } from 'react';
import Login from '../components/auth/Login';
import SignUp from '../components/auth/SignUp';
import { Container } from '../components/ui/Container';
import { Calculator } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <Container size="sm" className="space-y-8">
        {/* Logo and App Name */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="bg-blue-600 rounded-lg p-2">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">OptiProfit</span>
          </div>
          <p className="text-gray-600">
            Frame Profitability Calculator for Optometry Practices
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {isLoginMode ? (
            <Login onToggleMode={toggleMode} />
          ) : (
            <SignUp onToggleMode={toggleMode} />
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 OptiProfit. All rights reserved.</p>
        </div>
      </Container>
    </div>
  );
};

export default AuthPage;