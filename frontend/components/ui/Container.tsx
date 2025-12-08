import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padded?: boolean;
  centered?: boolean;
}

const maxWidths = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      as: Component = 'div',
      className = '',
      size = 'xl',
      padded = true,
      centered = true,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'w-full',
          maxWidths[size],
          {
            'mx-auto': centered,
            'px-4 sm:px-6 lg:px-8': padded,
          },
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = 'Container';

export { Container };
