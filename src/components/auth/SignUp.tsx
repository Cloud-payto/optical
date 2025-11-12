import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePasswordStrength, validatePasswordsMatch } from '../../utils/validation';
import toast from 'react-hot-toast';

interface SignUpProps {
  onToggleMode: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
  const { signUp, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation states
  const emailValidation = validateEmail(formData.email);
  const passwordStrength = validatePasswordStrength(formData.password);
  const passwordsMatch = validatePasswordsMatch(formData.password, formData.confirmPassword);

  // Check if form is valid
  const isFormValid =
    emailValidation.isValid &&
    passwordStrength.score >= 3 && // Require at least medium strength
    passwordsMatch.isValid &&
    formData.email &&
    formData.password &&
    formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({
      ...touched,
      [field]: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true
    });

    // Validate form
    if (!isFormValid) {
      if (!emailValidation.isValid) {
        toast.error(emailValidation.error || 'Invalid email');
      } else if (passwordStrength.score < 3) {
        toast.error('Please use a stronger password');
      } else if (!passwordsMatch.isValid) {
        toast.error(passwordsMatch.error || 'Passwords do not match');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(formData.email, formData.password);
      // Success handling is done in AuthContext
    } catch (error) {
      // Error handling is done in AuthContext
      console.error('Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get border color based on validation state
  const getInputBorderColor = (field: keyof typeof touched, isValid: boolean) => {
    if (!touched[field]) return 'border-gray-300 dark:border-gray-600';
    return isValid
      ? 'border-green-500 dark:border-green-500'
      : 'border-red-500 dark:border-red-500';
  };

  // Password strength indicator
  const renderPasswordStrengthBar = () => {
    if (!formData.password) return null;

    const widthPercentage = (passwordStrength.score / 5) * 100;
    const colorClass = {
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
    }[passwordStrength.color];

    return (
      <div className="mt-2">
        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${colorClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${widthPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className={`mt-1 text-xs ${
          passwordStrength.color === 'red' ? 'text-red-600 dark:text-red-400' :
          passwordStrength.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-600 dark:text-green-400'
        }`}>
          {passwordStrength.feedback}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Start managing your optical inventory with OptiProfit
        </p>
      </div>

      <motion.form
        className="mt-8 space-y-6"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MailIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`block w-full pl-10 pr-10 py-2.5 border ${getInputBorderColor('email', emailValidation.isValid)} rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && formData.email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {emailValidation.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {touched.email && !emailValidation.isValid && emailValidation.error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {emailValidation.error}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className={`block w-full pl-10 pr-10 py-2.5 border ${getInputBorderColor('password', passwordStrength.score >= 3)} rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                )}
              </button>
            </div>
            {formData.password && renderPasswordStrengthBar()}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className={`block w-full pl-10 pr-10 py-2.5 border ${getInputBorderColor('confirmPassword', passwordsMatch.isValid)} rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                )}
              </button>
            </div>
            {touched.confirmPassword && !passwordsMatch.isValid && passwordsMatch.error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {passwordsMatch.error}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <motion.button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            whileHover={{ scale: isSubmitting || !isFormValid ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting || !isFormValid ? 1 : 0.98 }}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </motion.button>
        </div>

        {/* Toggle to Sign In */}
        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            onClick={onToggleMode}
          >
            Already have an account? Sign in
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default SignUp;
