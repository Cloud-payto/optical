import { DriveStep } from 'driver.js';

export interface ExtendedDemoStep extends DriveStep {
  id: string;
  page: string;
  requiresNavigation?: boolean;
  tabToClick?: string;
  dataToInject?: any;
}

// 14-step demo flow using Driver.js
export const demoSteps: ExtendedDemoStep[] = [
  // Step 1: Welcome Modal
  {
    id: 'welcome',
    page: '/frames/orders',
    popover: {
      title: 'Welcome to OptiProfit Demo! 🎉',
      description: `
        <div class="space-y-3">
          <p>Discover how OptiProfit transforms your optical business with automated email parsing, inventory management, and profit calculations.</p>
          <p><strong>This demo will show you:</strong></p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>Automated vendor email processing</li>
            <li>Frame lifecycle management</li>
            <li>Vendor pricing integration</li>
            <li>Real-time profit calculations</li>
          </ul>
          <p class="text-xs text-gray-600">Demo takes ~5 minutes. You can skip or exit anytime.</p>
        </div>
      `,
      side: 'center',
      align: 'center'
    },
    requiresNavigation: true
  },

  // Step 2: Navigate to Pending Orders
  {
    id: 'pending-orders-nav',
    page: '/frames/orders',
    element: '[data-demo="pending-tab"]',
    popover: {
      title: 'Step 1: Vendor Order Processing',
      description: 'Here you can see a demo order from Modern Optical. OptiProfit automatically parsed the vendor email and extracted 3 frames. Let\'s explore the pending orders.',
      side: 'bottom',
      align: 'center'
    }
  },

  // Step 3: Inventory Lifecycle - Pending
  {
    id: 'inventory-lifecycle-pending',
    page: '/frames/inventory',
    element: '[data-demo="inventory-pending-tab"]',
    popover: {
      title: 'Step 2: Pending Inventory',
      description: 'Click "Pending" to see the frames from the order email. These are items confirmed by the vendor but not yet in your physical inventory.',
      side: 'bottom',
      align: 'start'
    },
    tabToClick: 'pending'
  },

  // Step 4: Navigate to Vendors Page
  {
    id: 'vendors-navigation',
    page: '/brands',
    element: '[data-demo="vendor-card"]',
    popover: {
      title: 'Step 3: Vendor Management',
      description: 'Now let\'s see how vendors are automatically imported. Modern Optical has been added to your vendors with account number MO-12345, extracted from the email.',
      side: 'top',
      align: 'center'
    },
    requiresNavigation: true
  },

  // Step 5: Display Modern Optical Vendor Card
  {
    id: 'vendor-card-display',
    page: '/brands',
    element: '[data-demo="vendor-card"]',
    popover: {
      title: 'Step 4: Vendor Information',
      description: 'Notice the account number (#MO-12345) and the 3 brands detected from your orders. The system automatically organizes vendor data for easy management.',
      side: 'right',
      align: 'center'
    }
  },

  // Step 6: Edit Vendor Modal
  {
    id: 'edit-vendor-modal',
    page: '/brands',
    element: '[data-demo="edit-vendor-btn"]',
    popover: {
      title: 'Step 5: Add Pricing Information',
      description: 'Click "Edit" to add your discount tiers and actual costs. This pricing data will auto-populate in the profit calculator.',
      side: 'bottom',
      align: 'center'
    }
  },

  // Step 7: Calculator Navigation with Modal
  {
    id: 'calculator-intro',
    page: '/calculator',
    popover: {
      title: 'Profit Calculator ✨',
      description: `
        <div class="space-y-3">
          <p>The heart of OptiProfit - calculate precise frame profits using your vendor pricing data.</p>
          <p><strong>Watch how:</strong></p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>Vendor data auto-populates</li>
            <li>Real-time profit calculations</li>
            <li>Margin analysis with visual feedback</li>
          </ul>
        </div>
      `,
      side: 'center',
      align: 'center'
    },
    requiresNavigation: true
  },

  // Step 8: Company Dropdown Selection
  {
    id: 'company-dropdown',
    page: '/calculator',
    element: '[data-demo="company-dropdown"]',
    popover: {
      title: 'Step 6: Select Vendor',
      description: 'Click the Company dropdown and select "Modern Optical". Notice how it auto-populates from your vendor list.',
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 9: Brand Dropdown Selection
  {
    id: 'brand-dropdown',
    page: '/calculator',
    element: '[data-demo="brand-dropdown"]',
    popover: {
      title: 'Step 7: Select Brand',
      description: 'Now select "Modern Optics Collection" from the brand dropdown. Watch the magic happen!',
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 10: Cost Fields Auto-Population
  {
    id: 'cost-auto-populate',
    page: '/calculator',
    element: '[data-demo="cost-fields"]',
    popover: {
      title: 'Step 8: Auto-Population ✨',
      description: 'See how Wholesale Cost ($85), Your Cost ($55), and Tariff Tax ($3) automatically filled in from your vendor pricing data. No manual entry needed!',
      side: 'right',
      align: 'center'
    }
  },

  // Step 11: Retail Price Input
  {
    id: 'retail-price-input',
    page: '/calculator',
    element: '[data-demo="retail-price"]',
    popover: {
      title: 'Step 9: Set Retail Price',
      description: 'Enter your retail price (try $150). Watch as profit and margin calculations update in real-time.',
      side: 'left',
      align: 'center'
    }
  },

  // Step 12: Real-time Profit Display
  {
    id: 'profit-calculation',
    page: '/calculator',
    element: '[data-demo="profit-display"]',
    popover: {
      title: 'Step 10: Live Profit Analysis',
      description: 'Your profit breakdown updates instantly: $92 profit with 61.3% margin! The visual indicator shows this is an excellent margin (green = good profit).',
      side: 'left',
      align: 'center'
    }
  },

  // Step 13: Profit Comparison Tab
  {
    id: 'comparison-tab',
    page: '/calculator',
    element: '[data-demo="comparison-tab"]',
    popover: {
      title: 'Step 11: Compare Vendors',
      description: 'Click "Comparison" to compare profits across different vendors and brands side-by-side. Perfect for finding the most profitable frames.',
      side: 'top',
      align: 'center'
    },
    tabToClick: 'comparison'
  },

  // Step 14: Demo Complete
  {
    id: 'demo-complete',
    page: '/calculator',
    popover: {
      title: 'Demo Complete! 🎊',
      description: `
        <div class="space-y-3">
          <p><strong>You've experienced the complete OptiProfit workflow:</strong></p>
          <ol class="list-decimal list-inside space-y-1 text-sm">
            <li>Automated email parsing</li>
            <li>Inventory lifecycle management</li>
            <li>Vendor integration with account numbers</li>
            <li>Profit calculations with real-time updates</li>
          </ol>
          <p class="text-sm font-medium text-green-600">Ready to optimize your practice's profitability?</p>
          <p class="text-xs text-gray-600">All demo data will be cleaned up automatically.</p>
        </div>
      `,
      side: 'center',
      align: 'center'
    }
  }
];

export default demoSteps;