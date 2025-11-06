import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS, Step } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../contexts/DemoContext';

const DemoTour: React.FC = () => {
  const navigate = useNavigate();
  const { isDemo, endDemo, demoData, setDemoData } = useDemo();
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  // Start the tour when demo is activated
  useEffect(() => {
    if (isDemo) {
      setRun(true);
      setTourKey(prev => prev + 1); // Force complete remount
      // Navigate to inventory page
      navigate('/frames/inventory');
    } else {
      setRun(false);
    }
  }, [isDemo, navigate]);

  // Define the tour steps (only using elements that actually exist)
  const steps: Step[] = [
    // Step 1: Welcome
    {
      target: 'body',
      content: 'Welcome to OptiProfit! Let me show you how to automate your optical inventory management. This interactive tour will walk you through: Pending Orders → Confirm → Current Inventory → Returns → Brands → Calculator.',
      placement: 'center',
      disableBeacon: true,
    },

    // Step 2: Pending Orders Tab
    {
      target: '[data-tour="pending-tab"]',
      content: 'Here are your Pending Orders. We have a demo order from Modern Optical with 5 frames waiting for confirmation.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 3: Navigate to Pending Inventory Tab
    {
      target: '[data-tour="inventory-pending-tab"]',
      content: 'Click "Pending" under Inventory to view these frames in your pending inventory.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 4: Confirm Order Button
    {
      target: '[data-tour="confirm-order-btn"]',
      content: 'Review the pending items and click "Confirm Order" to move them to your Current Inventory.',
      placement: 'top',
      disableBeacon: true,
    },

    // Step 5: Current Inventory Tab
    {
      target: '[data-tour="current-tab"]',
      content: 'After confirming, your frames appear here in Current Inventory. This is your live stock of available frames.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 6: Current Inventory Item
    {
      target: '[data-tour="inventory-row"]',
      content: 'Each frame shows brand, model, color, size, quantity in stock, and pricing. Click to see full details.',
      placement: 'right',
      disableBeacon: true,
    },

    // Step 7: Navigate to Returns
    {
      target: 'body',
      content: 'Now let\'s view the Returns page where you can track items being returned to vendors.',
      placement: 'center',
      disableBeacon: true,
    },

    // Step 8: Returns Feature
    {
      target: '[data-tour="returns-table"]',
      content: 'The Returns section tracks all returned items, return reasons, and refund amounts. Generate professional return reports for your vendors.',
      placement: 'top',
      disableBeacon: true,
    },

    // Step 9: Navigate to My Vendors
    {
      target: 'body',
      content: 'Now let\'s set up your vendor pricing for profit calculations. We\'ll navigate to My Vendors.',
      placement: 'center',
      disableBeacon: true,
    },

    // Step 10: Vendor Card
    {
      target: '[data-tour="vendor-card"]',
      content: 'Here\'s Modern Optical with brands detected from your orders: B.M.E.C., GB+ Collection, and Modern Plastics II.',
      placement: 'top',
      disableBeacon: true,
    },

    // Step 11: Edit Vendor Button
    {
      target: '[data-tour="edit-vendor-btn"]',
      content: 'Click "Edit" to add your actual costs. Enter wholesale cost, your cost, and retail pricing for each brand. This is crucial for accurate profit calculations.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 12: Navigate to Calculator
    {
      target: 'body',
      content: 'Now let\'s calculate real profit margins using your vendor pricing. We\'ll navigate to the Calculator.',
      placement: 'center',
      disableBeacon: true,
    },

    // Step 13: Calculator Company Dropdown
    {
      target: '[data-tour="company-dropdown"]',
      content: 'Select "Modern Optical" from the Company dropdown. This is the vendor you just set up.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 14: Calculator Brand Dropdown
    {
      target: '[data-tour="brand-dropdown"]',
      content: 'Now select "B.M.E.C." from the Brand dropdown. Watch how the cost fields auto-populate!',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 15: Auto-populated Costs
    {
      target: '[data-tour="cost-fields"]',
      content: 'See how Your Cost, Wholesale Cost, and Discount % automatically filled in? This is the pricing you added in My Vendors. No manual entry needed!',
      placement: 'right',
      disableBeacon: true,
    },

    // Step 16: Retail Price Input
    {
      target: '[data-tour="retail-price"]',
      content: 'Enter the retail price you charge customers. Try $150.00. Toggle insurance on/off to see how it affects profit.',
      placement: 'right',
      disableBeacon: true,
    },

    // Step 17: Profit Display
    {
      target: '[data-tour="profit-display"]',
      content: 'OptiProfit calculated your complete profit breakdown! Total Profit, Profit Margin %, and more. Try changing values to see live updates!',
      placement: 'left',
      disableBeacon: true,
    },

    // Step 18: Demo Complete
    {
      target: 'body',
      content: 'Demo Complete! You\'ve seen the full OptiProfit workflow: Pending → Confirm → Inventory → Returns → Vendors → Profit Calculator. Ready to start managing your practice?',
      placement: 'center',
      disableBeacon: true,
    },
  ];

  // Handle Joyride callbacks for navigation and state management
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action, lifecycle } = data;

    console.log('🎯 Joyride callback:', { status, type, index, action, lifecycle });

    // Handle tour finish/skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log('✅ Demo tour finished or skipped');
      setRun(false);
      endDemo();
      return;
    }

    // Handle errors
    if (status === STATUS.ERROR) {
      console.error('❌ Joyride error at step:', index);
      setRun(false);
      endDemo();
      return;
    }

    // Handle target not found separately - DON'T advance the step
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn(`⚠️ Target not found for step ${index}. Waiting...`);
      // Don't change stepIndex, just wait for the element to appear
      return;
    }

    // Handle step changes ONLY when step actually changes
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      const nextIndex = index + 1;
      console.log(`➡️ Moving from step ${index} to step ${nextIndex}`);

      // DON'T set stepIndex here - let Joyride manage it
      // setStepIndex(nextIndex);

      // Handle page navigation and data changes based on CURRENT step (before advancing)
      setTimeout(() => {
        // After step 6 (Current Inventory Item): Navigate to Returns
        if (index === 6) {
          console.log('🚀 Navigating to Returns page');
          navigate('/reports/returns');
        }
        // After step 8 (Returns Feature): Navigate to My Vendors
        else if (index === 8) {
          console.log('🚀 Navigating to Brands page');
          navigate('/brands');
        }
        // After step 11 (Edit Vendor Button): Navigate to Calculator
        else if (index === 11) {
          console.log('🚀 Navigating to Calculator page');
          navigate('/calculator');
        }
        // After step 3 (Confirm Order Button): Move demo data
        else if (index === 3) {
          console.log('📦 Moving pending items to current inventory');
          setDemoData((prev) => ({
            ...prev,
            currentInventory: prev.pendingInventory.map((item) => ({
              ...item,
              status: 'current' as const,
            })),
            pendingInventory: [],
          }));
        }
      }, 300);
    }

    // Handle going back
    else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      const prevIndex = index - 1;
      console.log(`⬅️ Going back from step ${index} to step ${prevIndex}`);
    }
  };

  // Custom styles to match OptiProfit branding
  const styles = {
    options: {
      arrowColor: '#fff',
      backgroundColor: '#fff',
      overlayColor: 'rgba(0, 0, 0, 0.4)',
      primaryColor: '#8b5cf6', // Purple brand color
      textColor: '#374151',
      width: 380,
      zIndex: 10000,
    },
    buttonNext: {
      backgroundColor: '#8b5cf6',
      borderRadius: '8px',
      fontSize: '16px',
      padding: '10px 20px',
    },
    buttonBack: {
      color: '#6b7280',
      marginRight: '10px',
    },
    buttonSkip: {
      color: '#6b7280',
    },
    tooltip: {
      borderRadius: '8px',
      fontSize: '16px',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipContent: {
      padding: '20px 20px 10px',
    },
    tooltipFooter: {
      marginTop: '15px',
      padding: '10px 20px 20px',
    },
  };

  // Locale customization
  const locale = {
    back: 'Previous',
    close: 'Close',
    last: 'Finish',
    next: 'Next',
    skip: 'Skip Demo',
  };

  if (!isDemo) return null;

  return (
    <Joyride
      key={tourKey}
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={styles}
      locale={locale}
      disableCloseOnEsc={false}
      disableOverlayClose={false}
      spotlightPadding={4}
      scrollToFirstStep
      scrollOffset={100}
      debug
    />
  );
};

export default DemoTour;
