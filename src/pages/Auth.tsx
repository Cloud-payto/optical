import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Zap } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const { signIn, signUp, loading, authError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    // Validate sign up fields
    if (!isLogin) {
      if (password !== confirmPassword) {
        return;
      }
    }

    try {
      setFormLoading(true);
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      // Error handling is done in the auth context
      console.error('Auth error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-8 left-8">
          <div className="bg-blue-500 rounded-full p-3 shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Homepage Image */}
        <div className="max-w-2xl w-full">
          <img
            src="/images/homepage_2-min.png"
            alt="OptiProfit Dashboard"
            className="w-full h-auto rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-8">
          {/* Toggle between Login/Register at top */}
          <div className="flex justify-end space-x-2 text-sm">
            <span className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFirstName('');
                setLastName('');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isLogin ? 'REGISTER' : 'LOGIN'}
            </button>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'Login' : 'Register'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isLogin
                ? 'Welcome back! Sign in to access your account.'
                : 'Create an Account to access all the features.'}
            </p>
          </div>

          {/* Show auth error if present */}
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{authError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields - Only for Sign Up */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last Name"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password - Only for Sign Up */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm Password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formLoading || !email || !password || (!isLogin && password !== confirmPassword)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 uppercase tracking-wide"
            >
              {formLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : (
                isLogin ? 'Login' : 'Register'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">OR</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}