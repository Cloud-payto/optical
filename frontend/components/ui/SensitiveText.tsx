import React from 'react';
import { usePresentationMode } from '../../contexts/PresentationModeContext';

export type SensitiveTextType = 'account' | 'customer' | 'order';

interface SensitiveTextProps {
  children: React.ReactNode;
  type?: SensitiveTextType;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * SensitiveText - Wraps text that should be blurred in presentation mode
 *
 * Use this component to wrap any sensitive information like:
 * - Account numbers (type="account")
 * - Customer names (type="customer")
 * - Order numbers (type="order")
 *
 * When presentation mode is active, the text will be blurred to protect
 * sensitive information during demos and recordings.
 */
export const SensitiveText: React.FC<SensitiveTextProps> = ({
  children,
  type = 'account',
  className = '',
  as: Component = 'span',
}) => {
  const { isPresentationMode } = usePresentationMode();

  if (!isPresentationMode) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={`${className} sensitive-text-blur`}
      style={{
        filter: 'blur(5px)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'filter 0.2s ease',
      }}
      title="Hidden in presentation mode"
      data-sensitive-type={type}
    >
      {children}
    </Component>
  );
};

export default SensitiveText;
