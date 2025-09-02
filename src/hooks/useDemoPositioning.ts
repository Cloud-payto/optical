import { useEffect, useState, useRef } from 'react';
import { useFloating, offset, flip, shift, arrow, autoUpdate } from '@floating-ui/react';
import type { DemoStep } from '../contexts/DemoContext';

interface UseDemoPositioningOptions {
  step: DemoStep | null;
  isActive: boolean;
}

export const useDemoPositioning = ({ step, isActive }: UseDemoPositioningOptions) => {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  // Determine the optimal placement based on step data
  const getPlacement = () => {
    if (!step?.position || step.position === 'center') {
      return 'bottom';
    }
    return step.position;
  };

  const { refs, floatingStyles, placement, middlewareData } = useFloating({
    placement: getPlacement(),
    open: isActive && !!targetElement && step?.position !== 'center',
    middleware: [
      offset(12), // 12px gap as requested
      flip({
        fallbackPlacements: ['top', 'bottom', 'left', 'right'],
        crossAxis: false,
      }),
      shift({ 
        padding: 16,
        crossAxis: true,
        limiter: {
          fn: ({ availableWidth, availableHeight, x, y }) => {
            // Responsive tooltip width: 320px on desktop, 280px on mobile
            const tooltipWidth = window.innerWidth >= 640 ? 320 : 280;
            const tooltipHeight = 250; // Estimated tooltip height
            
            return {
              x: Math.max(16, Math.min(x, availableWidth - tooltipWidth - 16)),
              y: Math.max(16, Math.min(y, availableHeight - tooltipHeight - 16)),
            };
          },
        },
      }),
      arrow({ 
        element: arrowRef,
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Enhanced element finder with retry logic
  useEffect(() => {
    if (!isActive || !step) {
      setTargetElement(null);
      return;
    }

    const findElement = () => {
      if (step.selector) {
        const element = document.querySelector(step.selector) as HTMLElement;
        if (element) {
          setTargetElement(element);
          refs.setReference(element);
          
          // Scroll element into view if needed (with some delay for smooth UX)
          setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }, 100);
          
          return true;
        }
      } else {
        setTargetElement(null);
        refs.setReference(null);
        return true;
      }
      return false;
    };

    // Try to find element immediately
    if (!findElement()) {
      // If not found, retry after a short delay (for page transitions)
      const timeout = setTimeout(() => {
        if (!findElement()) {
          console.warn(`Demo element not found: ${step.selector}`);
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [isActive, step, refs]);

  // Calculate arrow positioning
  const getArrowStyles = () => {
    const { arrow: arrowData } = middlewareData;
    
    if (!arrowData || !targetElement) return { display: 'none' };

    const staticSide = {
      top: 'bottom',
      right: 'left', 
      bottom: 'top',
      left: 'right',
    }[placement.split('-')[0]];

    return {
      left: arrowData.x != null ? `${arrowData.x}px` : '',
      top: arrowData.y != null ? `${arrowData.y}px` : '',
      right: '',
      bottom: '',
      [staticSide!]: '-4px',
      display: 'block',
    };
  };

  const isCenterPosition = !step?.selector || step?.position === 'center';

  return {
    targetElement,
    arrowRef,
    floatingStyles,
    placement,
    getArrowStyles,
    isCenterPosition,
    refs,
  };
};