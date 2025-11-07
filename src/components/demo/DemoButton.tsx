import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { useDemo } from '../../hooks/useDemo';

interface DemoButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  children?: React.ReactNode;
}

const DemoButton: React.FC<DemoButtonProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  children
}) => {
  const { startDemo, isActive } = useDemo();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    ghost: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
  };

  const buttonVariants = {
    idle: {
      scale: 1,
      boxShadow: variant === 'primary' ? '0 4px 14px 0 rgba(59, 130, 246, 0.3)' : '0 0 0 0 transparent'
    },
    hover: {
      scale: 1.02,
      boxShadow: variant === 'primary' ? '0 6px 20px 0 rgba(59, 130, 246, 0.4)' : '0 2px 8px 0 rgba(59, 130, 246, 0.2)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const sparkleVariants = {
    idle: { 
      rotate: 0,
      scale: 1
    },
    hover: { 
      rotate: 180,
      scale: 1.1,
      transition: {
        duration: 0.3
      }
    }
  };

  if (isActive) {
    return null; // Hide button when demo is active
  }

  return (
    <motion.button
      onClick={startDemo}
      className={`
        relative inline-flex items-center gap-2 font-medium rounded-lg
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
    >
      {/* Sparkle icon with animation */}
      <motion.div variants={sparkleVariants}>
        <Sparkles className="w-4 h-4" />
      </motion.div>

      {/* Button text */}
      <span>{children || 'Watch Demo'}</span>

      {/* Play icon */}
      <Play className="w-4 h-4 fill-current" />

      {/* Animated background gradient (for primary variant) */}
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg opacity-0"
          whileHover={{
            opacity: 1,
            transition: { duration: 0.3 }
          }}
        />
      )}

      {/* Shine effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-lg"
        initial={{ x: '-100%' }}
        whileHover={{
          x: '100%',
          transition: {
            duration: 0.6,
            ease: 'easeInOut'
          }
        }}
      />
    </motion.button>
  );
};

export default DemoButton;