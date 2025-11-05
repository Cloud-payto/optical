import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// Demo data types
export interface DemoEmail {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  vendor: string;
  orderNumber: string;
  customerAccount: string;
  placedBy: string;
  status: string;
  itemCount: number;
  isDemo: true;
}

export interface DemoPendingItem {
  id: string;
  vendor: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  upc: string;
  quantity: number;
  wholesaleCost: number | null;
  status: 'pending';
  orderId: string;
  receivedDate: string;
  isDemo: true;
}

export interface DemoCurrentItem extends DemoPendingItem {
  status: 'current';
}

export interface DemoReturn {
  id: string;
  vendor: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  upc: string;
  quantity: number;
  reason: string;
  returnDate: string;
  status: string;
  refundAmount: number;
  isDemo: true;
}

export interface DemoVendor {
  id: string;
  name: string;
  importedFrom: string;
  brands: DemoBrand[];
  isDemo: true;
}

export interface DemoBrand {
  id: string;
  name: string;
  wholesaleCost: number | null;
  yourCost: number | null;
  tariffTax: number | null;
  discountPercent: number | null;
}

export interface DemoData {
  emails: DemoEmail[];
  pendingInventory: DemoPendingItem[];
  currentInventory: DemoCurrentItem[];
  returns: DemoReturn[];
  vendors: DemoVendor[];
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  page: string;
  selector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requiresUserAction?: boolean; // If true, wait for user action before advancing
  actionType?: 'click' | 'select' | 'input' | 'navigate';
  waitForSelector?: string; // Selector to watch for user interaction
  highlightElement?: string;
}

export interface DemoContextType {
  isDemo: boolean;
  currentStep: number;
  currentStepData: DemoStep | null;
  demoData: DemoData;
  setDemoData: React.Dispatch<React.SetStateAction<DemoData>>;
  startDemo: () => void;
  endDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipToStep: (stepIndex: number) => void;
  totalSteps: number;
  // User action tracking
  notifyUserAction: (actionType: string, data?: any) => void;
  waitingForUserAction: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Demo steps following the real operational workflow
const demoSteps: DemoStep[] = [
  // Phase 1: Email Processing
  {
    id: 'welcome',
    title: 'Welcome to OptiProfit Demo!',
    description: 'Let me show you how OptiProfit transforms vendor emails into actionable inventory and profit insights. We\'ll walk through the complete workflow from receiving an order email to calculating profits.',
    page: '/frames/inventory',
    position: 'center'
  },
  {
    id: 'email-received',
    title: 'Step 1: Vendor Sends Order Confirmation',
    description: 'Your vendor sends an order confirmation email. OptiProfit automatically receives and parses it. Here\'s a demo email from Modern Optical with 5 frames on order in the Pending Orders tab.',
    page: '/frames/inventory',
    selector: '[data-demo="pending-tab"]',
    position: 'bottom'
  },
  {
    id: 'email-details',
    title: 'Review Order Email',
    description: 'Here you can see the parsed order email. OptiProfit extracted the order details including vendor, order number, and items. This is the first step in the inventory workflow.',
    page: '/frames/inventory',
    selector: '[data-demo="email-row"]',
    position: 'right'
  },

  // Phase 2: Pending Inventory
  {
    id: 'pending-orders',
    title: 'Step 2: Review Pending Inventory',
    description: 'Now let\'s view the 5 frames from that order in your Pending Inventory. Click the "Pending" tab under Inventory to see the items waiting to be confirmed.',
    page: '/frames/inventory',
    selector: '[data-demo="inventory-pending-tab"]',
    position: 'bottom',
    requiresUserAction: true,
    actionType: 'click',
    waitForSelector: '[data-demo="inventory-pending-tab"]'
  },
  {
    id: 'confirm-order',
    title: 'Confirm Your Order',
    description: 'Review the pending items and click "Confirm Order" to move them into your current inventory.',
    page: '/frames/inventory',
    selector: '[data-demo="confirm-order-btn"]',
    position: 'top',
    requiresUserAction: true,
    actionType: 'click',
    waitForSelector: '[data-demo="confirm-order-btn"]'
  },

  // Phase 3: Current Inventory
  {
    id: 'current-inventory',
    title: 'Step 3: View Current Inventory',
    description: 'Your confirmed frames now appear in Current Inventory. This is your live stock of available frames. Click the "Current" tab to see them.',
    page: '/frames/inventory',
    selector: '[data-demo="current-tab"]',
    position: 'bottom',
    requiresUserAction: true,
    actionType: 'click',
    waitForSelector: '[data-demo="current-tab"]'
  },
  {
    id: 'inventory-details',
    title: 'Track Frame Details',
    description: 'Click on any frame to see full details: vendor, brand, model, UPC, quantity in stock, costs, and order history. This helps you manage your inventory efficiently.',
    page: '/frames/inventory',
    selector: '[data-demo="inventory-row"]',
    position: 'right'
  },

  // Phase 4: Returns
  {
    id: 'returns',
    title: 'Step 4: Handle Returns',
    description: 'Sometimes frames need to be returned to vendors. The Returns section tracks all returned items, return reasons, and updates your inventory automatically when returns are processed.',
    page: '/reports/returns',
    selector: '[data-demo="returns-table"]',
    position: 'center'
  },

  // Phase 5: Vendor Management
  {
    id: 'import-vendor',
    title: 'Step 5: Import Vendor Data',
    description: 'Now let\'s import Modern Optical into "My Vendors". This allows you to add pricing information and use this vendor in the profit calculator. Click "Import from Orders" or navigate to the Brands page.',
    page: '/brands',
    selector: '[data-demo="import-vendor-btn"]',
    position: 'bottom'
  },
  {
    id: 'vendor-added',
    title: 'Vendor Imported!',
    description: 'Modern Optical has been added to your vendors. Notice the brands detected from your orders: B.M.E.C., GB+ Collection, and Modern Plastics II. But we need to add your actual costs to calculate accurate profits.',
    page: '/brands',
    selector: '[data-demo="vendor-card"]',
    position: 'top'
  },
  {
    id: 'add-pricing',
    title: 'Step 6: Add Your Costs',
    description: 'Click "Edit" on Modern Optical to add your actual costs. Enter the wholesale cost and what you actually pay. OptiProfit calculates your discount percentage automatically. This is crucial for accurate profit calculations.',
    page: '/brands',
    selector: '[data-demo="edit-vendor-btn"]',
    position: 'bottom',
    requiresUserAction: true,
    actionType: 'click',
    waitForSelector: '[data-demo="edit-vendor-btn"]'
  },

  // Phase 6: Profit Calculator (INTERACTIVE)
  {
    id: 'calculator-intro',
    title: 'Step 7: Calculate Frame Profits',
    description: 'Now for the magic! The profit calculator automatically imports your vendor pricing. Let\'s calculate how much profit you\'ll make selling a B.M.E.C. frame from Modern Optical.',
    page: '/calculator',
    position: 'center'
  },
  {
    id: 'select-company',
    title: 'Select Your Vendor Company',
    description: 'Click the Company dropdown and select "Modern Optical" from the list. This is the vendor you imported earlier.',
    page: '/calculator',
    selector: '[data-demo="company-dropdown"]',
    position: 'bottom',
    requiresUserAction: true,
    actionType: 'select',
    waitForSelector: '[data-demo="company-dropdown"]'
  },
  {
    id: 'select-brand',
    title: 'Select Brand',
    description: 'Now select "B.M.E.C." from the Brand dropdown. Watch what happens to the cost fields!',
    page: '/calculator',
    selector: '[data-demo="brand-dropdown"]',
    position: 'bottom',
    requiresUserAction: true,
    actionType: 'select',
    waitForSelector: '[data-demo="brand-dropdown"]'
  },
  {
    id: 'auto-populate',
    title: 'Costs Auto-Populated!',
    description: 'See how Your Cost ($42.50), Wholesale Cost ($50.00), and Discount % (15%) automatically filled in? This is the pricing you added in My Vendors. No manual entry needed!',
    page: '/calculator',
    selector: '[data-demo="cost-fields"]',
    position: 'right'
  },
  {
    id: 'enter-retail-price',
    title: 'Set Your Retail Price',
    description: 'Now enter the retail price you charge customers for this frame. Try $150.00. You can also toggle insurance on/off, adjust coverage amounts, and see how it affects profit.',
    page: '/calculator',
    selector: '[data-demo="retail-price"]',
    position: 'right',
    requiresUserAction: true,
    actionType: 'input',
    waitForSelector: '[data-demo="retail-price"]'
  },
  {
    id: 'view-profit',
    title: 'Your Profit Breakdown',
    description: 'OptiProfit calculated your complete profit breakdown! Total Profit, Profit Margin %, Patient Payment (if insurance), and more. All computed using the real calculator logic. Try changing the retail price or insurance settings to see live updates!',
    page: '/calculator',
    selector: '[data-demo="profit-display"]',
    position: 'left'
  },

  // Phase 7: Conclusion
  {
    id: 'demo-complete',
    title: 'Demo Complete!',
    description: 'You\'ve completed the full OptiProfit workflow! Email → Review → Confirm → Inventory → Returns → Import Vendor → Add Pricing → Calculate Profit. The Dashboard tracks your performance metrics. Ready to optimize your practice\'s profitability?',
    page: '/dashboard',
    position: 'center'
  }
];

// Initial demo data - injected when demo starts
const initialDemoData: DemoData = {
  emails: [
    {
      id: 'demo-email-001',
      from: 'noreply@modernoptical.com',
      subject: 'Your Receipt for Order Number 99999',
      receivedAt: new Date().toISOString(),
      vendor: 'Modern Optical',
      orderNumber: '99999',
      customerAccount: '99999',
      placedBy: 'Demo Rep',
      status: 'parsed',
      itemCount: 5,
      isDemo: true
    }
  ],
  pendingInventory: [
    {
      id: 'demo-pending-001',
      vendor: 'Modern Optical',
      brand: 'B.M.E.C.',
      model: 'BIG AIR',
      color: 'BLACK',
      size: '54',
      upc: '675254228656',
      quantity: 1,
      wholesaleCost: null,
      status: 'pending',
      orderId: '99999',
      receivedDate: new Date().toISOString().split('T')[0],
      isDemo: true
    },
    {
      id: 'demo-pending-002',
      vendor: 'Modern Optical',
      brand: 'B.M.E.C.',
      model: 'BIG BOLT',
      color: 'NAVY FADE',
      size: '58',
      upc: '675254222883',
      quantity: 1,
      wholesaleCost: null,
      status: 'pending',
      orderId: '99999',
      receivedDate: new Date().toISOString().split('T')[0],
      isDemo: true
    },
    {
      id: 'demo-pending-003',
      vendor: 'Modern Optical',
      brand: 'GB+ COLLECTION',
      model: 'BEAUTIFUL',
      color: 'BLACK/GOLD',
      size: '56',
      upc: '675254228748',
      quantity: 1,
      wholesaleCost: null,
      status: 'pending',
      orderId: '99999',
      receivedDate: new Date().toISOString().split('T')[0],
      isDemo: true
    },
    {
      id: 'demo-pending-004',
      vendor: 'Modern Optical',
      brand: 'GB+ COLLECTION',
      model: 'WONDROUS',
      color: 'PINK CRYST/PK',
      size: '54',
      upc: '675254313710',
      quantity: 1,
      wholesaleCost: null,
      status: 'pending',
      orderId: '99999',
      receivedDate: new Date().toISOString().split('T')[0],
      isDemo: true
    },
    {
      id: 'demo-pending-005',
      vendor: 'Modern Optical',
      brand: 'MODERN PLASTICS II',
      model: 'PATRICK',
      color: 'BLACK',
      size: '55',
      upc: '675254314656',
      quantity: 1,
      wholesaleCost: null,
      status: 'pending',
      orderId: '99999',
      receivedDate: new Date().toISOString().split('T')[0],
      isDemo: true
    }
  ],
  currentInventory: [],
  returns: [
    {
      id: 'demo-return-001',
      vendor: 'Modern Optical',
      brand: 'B.M.E.C.',
      model: 'BIG AIR (Defective)',
      color: 'BLACK',
      size: '54',
      upc: '675254228656',
      quantity: 1,
      reason: 'Defective hinge - frame warped',
      returnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed',
      refundAmount: 45.00,
      isDemo: true
    }
  ],
  vendors: [
    {
      id: 'demo-vendor-001',
      name: 'Modern Optical',
      importedFrom: 'orders',
      brands: [
        {
          id: 'demo-brand-001',
          name: 'B.M.E.C.',
          wholesaleCost: 50.00,
          yourCost: 42.50,
          tariffTax: 0,
          discountPercent: 15.00
        },
        {
          id: 'demo-brand-002',
          name: 'GB+ COLLECTION',
          wholesaleCost: 55.00,
          yourCost: 46.75,
          tariffTax: 0,
          discountPercent: 15.00
        },
        {
          id: 'demo-brand-003',
          name: 'MODERN PLASTICS II',
          wholesaleCost: 45.00,
          yourCost: 38.25,
          tariffTax: 0,
          discountPercent: 15.00
        }
      ],
      isDemo: true
    }
  ]
};

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoData, setDemoData] = useState<DemoData>({
    emails: [],
    pendingInventory: [],
    currentInventory: [],
    returns: [],
    vendors: []
  });
  const [waitingForUserAction, setWaitingForUserAction] = useState(false);
  const navigate = useNavigate();

  const currentStepData = isDemo && currentStep < demoSteps.length ? demoSteps[currentStep] : null;

  const startDemo = () => {
    console.log('🎬 Starting interactive demo...');

    // Inject demo data into state
    setDemoData(initialDemoData);
    setIsDemo(true);
    setCurrentStep(0);

    // Navigate to first step
    navigate('/frames/inventory');
  };

  const endDemo = () => {
    console.log('🛑 Ending demo and clearing all demo data...');

    // Clear all demo data
    setDemoData({
      emails: [],
      pendingInventory: [],
      currentInventory: [],
      returns: [],
      vendors: []
    });

    setIsDemo(false);
    setCurrentStep(0);
    setWaitingForUserAction(false);
  };

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      const nextStepData = demoSteps[currentStep + 1];
      setCurrentStep(currentStep + 1);

      // Check if next step requires user action
      if (nextStepData.requiresUserAction) {
        setWaitingForUserAction(true);
        console.log(`⏳ Waiting for user action: ${nextStepData.actionType}`);
      } else {
        setWaitingForUserAction(false);
      }

      // Navigate to the next step's page if different
      if (nextStepData.page !== demoSteps[currentStep].page) {
        navigate(nextStepData.page);
      }
    } else {
      endDemo();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepData = demoSteps[currentStep - 1];
      setCurrentStep(currentStep - 1);
      setWaitingForUserAction(false);

      // Navigate to the previous step's page if different
      if (prevStepData.page !== demoSteps[currentStep].page) {
        navigate(prevStepData.page);
      }
    }
  };

  const skipToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < demoSteps.length) {
      const targetStep = demoSteps[stepIndex];
      setCurrentStep(stepIndex);
      setWaitingForUserAction(targetStep.requiresUserAction || false);
      navigate(targetStep.page);
    }
  };

  // User action notification - called when user completes required action
  const notifyUserAction = (actionType: string, data?: any) => {
    if (!isDemo || !currentStepData) return;

    console.log(`✅ User action detected: ${actionType}`, data);

    // Check if this action matches what we're waiting for
    if (waitingForUserAction && currentStepData.actionType === actionType) {
      console.log('✅ Required action completed! Advancing to next step...');

      // Handle specific demo data transformations based on action
      if (actionType === 'click' && currentStepData.id === 'confirm-order') {
        // Move pending items to current inventory
        console.log('📦 Moving pending items to current inventory...');
        setDemoData(prev => ({
          ...prev,
          currentInventory: prev.pendingInventory.map(item => ({
            ...item,
            status: 'current' as const
          })),
          pendingInventory: []
        }));
      }

      setWaitingForUserAction(false);

      // Auto-advance to next step after brief delay
      setTimeout(() => {
        nextStep();
      }, 800);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        currentStep,
        currentStepData,
        demoData,
        setDemoData,
        startDemo,
        endDemo,
        nextStep,
        prevStep,
        skipToStep,
        totalSteps: demoSteps.length,
        notifyUserAction,
        waitingForUserAction
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
