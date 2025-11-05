import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS, Step } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../contexts/DemoContext';

const DemoTour: React.FC = () => {
  const navigate = useNavigate();
  const { isDemo, endDemo, demoData, setDemoData } = useDemo();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Start the tour when demo is activated
  useEffect(() => {
    if (isDemo) {
      setRun(true);
      setStepIndex(0);
    } else {
      setRun(false);
    }
  }, [isDemo]);

  // Define the tour steps
  const steps: Step[] = [
    // Step 1: Welcome
    {
      target: 'body',
      content: 'Welcome to OptiProfit! Let me show you how to automate your optical inventory management. This interactive tour will walk you through the complete workflow: Email → Pending → Confirm → Current Inventory → Returns → Brands → Calculator.',
      placement: 'center',
      disableBeacon: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },

    // Step 2: Email Forwarding (on Inventory page)
    {
      target: '[data-tour="email-forwarding"]',
      content: 'This is your unique forwarding email. Forward vendor order confirmations here and OptiProfit will automatically parse them.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 3: Navigate to Pending Tab
    {
      target: '[data-tour="pending-tab"]',
      content: 'Click the Pending tab to see orders waiting for confirmation. We have a demo order from Modern Optical with 5 frames.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },

    // Step 4: Review Pending Items
    {
      target: '[data-tour="pending-inventory-list"]',
      content: 'Here are 5 frames from your Modern Optical order, automatically extracted from the email.',
      placement: 'right',
      disableBeacon: true,
    },

    // Step 5: Item Details
    {
      target: '[data-tour="pending-item"]',
      content: 'Each frame shows brand, model, color, size, and quantity parsed from the vendor email.',
      placement: 'right',
      disableBeacon: true,
    },

    // Step 6: Navigate to Pending Inventory Tab
    {
      target: '[data-tour="inventory-pending-tab"]',
      content: 'Now click "Pending" under Inventory to view these frames in a better workflow.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },

    // Step 7: Confirm Order Button
    {
      target: '[data-tour="confirm-order-btn"]',
      content: 'Review the pending items and click "Confirm Order" to move them to your Current Inventory.',
      placement: 'top',
      disableBeacon: true,
      spotlightClicks: true,
    },

    // Step 8: Current Inventory Tab (auto-navigate)
    {
      target: '[data-tour="current-tab"]',
      content: 'Your confirmed frames now appear in Current Inventory. Click the "Current" tab to see them.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },

    // Step 9: Inventory Filters
    {
      target: '[data-tour="inventory-filters"]',
      content: 'Filter by vendor, brand, color, or sort by various criteria to quickly find frames.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 10: Current Inventory Item
    {
      target: '[data-tour="inventory-row"]',
      content: 'Click on any frame to see full details: vendor, brand, model, UPC, quantity in stock, costs, and order history.',
      placement: 'right',
      disableBeacon: true,
    },

    // Step 11: Mark as Sold Demo
    {
      target: '[data-tour="inventory-actions"]',
      content: 'Use the action menu to mark frames as sold, create returns, or edit details.',
      placement: 'left',
      disableBeacon: true,
    },

    // Step 12: Navigate to Returns
    {
      target: 'body',
      content: 'Now let\'s view the Returns page. We\'ll navigate there automatically.',
      placement: 'center',
      disableBeacon: true,
    },

    // Step 13: Returns Feature
    {
      target: '[data-tour="returns-table"]',
      content: 'The Returns section tracks all returned items, return reasons, and refund amounts. Generate professional return reports for frames approaching their return window.',
      placement: 'top',
      disableBeacon: true,
    },

    // Step 14: Navigate to My Vendors
    {
      target: 'body',
      content: 'Now let\'s set up your vendor pricing for profit calculations. We\'ll navigate to My Vendors.',
      placement: 'center',
      disableBeacon: true,
    },

    // Step 15: Add/Import Vendor
    {
      target: '[data-tour="import-vendor-btn"]',
      content: 'We\'ve already imported Modern Optical from your orders. You can also add vendors manually.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 16: Vendor Card
    {
      target: '[data-tour="vendor-card"]',
      content: 'Here\'s Modern Optical with brands detected from your orders: B.M.E.C., GB+ Collection, and Modern Plastics II.',
      placement: 'top',
      disableBeacon: true,
    },

    // Step 17: Add Brand Pricing
    {
      target: '[data-tour="edit-vendor-btn"]',
      content: 'Click "Edit" to add your actual costs. Enter wholesale cost, your cost, and retail pricing for each brand. This is crucial for accurate profit calculations.',
      placement: 'bottom',
      disableBeacon: true,
    },

    // Step 18: Navigate to Calculator
    {
      target: 'body',
      content: 'Now let\'s calculate real profit margins using your vendor pricing. We\'ll navigate to the Calculator.',
      placement: 'center',
      disableBeacon: true,
    },

    // Step 19: Calculator Company Dropdown
    {
      target: '[data-tour="company-dropdown"]',
      content: 'Select "Modern Optical" from the Company dropdown. This is the vendor you imported earlier.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },

    // Step 20: Calculator Brand Dropdown
    {
      target: '[data-tour="brand-dropdown"]',
      content: 'Now select "B.M.E.C." from the Brand dropdown. Watch how the cost fields auto-populate!',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },

    // Step 21: Auto-populated Costs
    {
      target: '[data-tour="cost-fields"]',
      content: 'See how Your Cost ($42.50), Wholesale Cost ($50.00), and Discount % (15%) automatically filled in? This is the pricing you added in My Vendors. No manual entry needed!',
      placement: 'right',
      disableBeacon: true,
    },

    // Step 22: Retail Price Input
    {
      target: '[data-tour="retail-price"]',
      content: 'Now enter the retail price you charge customers for this frame. Try $150.00. You can also toggle insurance on/off to see how it affects profit.',
      placement: 'right',
      disableBeacon: true,
      spotlightClicks: true,
    },

    // Step 23: Profit Display
    {
      target: '[data-tour="profit-display"]',
      content: 'OptiProfit calculated your complete profit breakdown! Total Profit, Profit Margin %, Patient Payment (if insurance), and more. Try changing the retail price or insurance settings to see live updates!',
      placement: 'left',
      disableBeacon: true,
    },

    // Step 24: Demo Complete
    {
      target: 'body',
      content: 'Demo Complete! You\'ve seen the full OptiProfit workflow: Email → Review → Confirm → Inventory → Returns → Vendor Setup → Profit Calculation. Your demo data has been removed. Ready to optimize your practice\'s profitability?',
      placement: 'center',
      disableBeacon: true,
    },
  ];

  // Handle Joyride callbacks for navigation and state management
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    console.log('Joyride callback:', { status, type, index, action });

    // Handle tour finish/skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log('Demo tour finished or skipped');
      setRun(false);
      endDemo();
      return;
    }

    // Handle step changes for navigation
    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextIndex);

      // Handle page navigation based on step
      setTimeout(() => {
        // Step 12: Navigate to Returns
        if (nextIndex === 12) {
          navigate('/reports/returns');
        }
        // Step 14: Navigate to My Vendors
        else if (nextIndex === 14) {
          navigate('/brands');
        }
        // Step 18: Navigate to Calculator
        else if (nextIndex === 18) {
          navigate('/calculator');
        }
        // Step 7: After confirming order, move demo data
        else if (index === 6 && action === ACTIONS.NEXT) {
          // Move pending items to current inventory
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

    // Handle target not found - wait and retry
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('Target not found for step:', index);
      // Retry after a delay
      setTimeout(() => {
        setStepIndex(index);
      }, 500);
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
      steps={steps}
      run={run}
      stepIndex={stepIndex}
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
    />
  );
};

export default DemoTour;
