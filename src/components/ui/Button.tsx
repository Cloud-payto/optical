import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'default' | 'primary' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const buttonVariants = {
  default: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-[#1F2623] dark:text-gray-100 dark:hover:bg-gray-700',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  link: 'bg-transparent text-blue-600 hover:underline hover:bg-transparent dark:text-blue-400 p-0 h-auto',
};

const buttonSizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-12 px-6 text-base',
};

const buttonRounded = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const buttonBaseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none';

const buttonAnimation: Variants = {
  hover: {
    scale: 1.03,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.98,
  },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'default',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      rounded = 'md',
      ...props
    },
    ref
  ) => {
    const isDisabled = isLoading || disabled;
    
    return (
      <motion.button
        ref={ref}
        className={`${buttonBaseClasses} ${buttonVariants[variant]} ${buttonSizes[size]} ${buttonRounded[rounded]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        disabled={isDisabled}
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        variants={buttonAnimation}
        {...props}
      >
        {isLoading && (
          <Loader2 className={`mr-2 h-4 w-4 animate-spin ${
            iconPosition === 'right' ? 'order-2 ml-2' : 'mr-2'
          }`} />
        )}
        {!isLoading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {!isLoading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps };
