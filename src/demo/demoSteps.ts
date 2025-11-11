import { DriveStep } from 'driver.js';

export interface ExtendedDemoStep extends DriveStep {
  id: string;
  page: string;
  requiresNavigation?: boolean;
  waitForElement?: boolean;
  tabToClick?: string;
}

/**
 * 11-Step Demo Flow for OptiProfit
 *
 * Showcases: Email Parsing → Pending Frames → Vendor Import → Pricing Calculation
 *
 * Key Data-Demo Attributes Required:
 * - [data-demo="pending-orders-tab"] - Orders page tab
 * - [data-demo="inventory-pending-tab"] - Inventory pending tab
 * - [data-demo="vendor-card"] - Vendor card in brands page
 * - [data-demo="vendor-pricing"] - Brand pricing display
 * - [data-demo="company-dropdown"] - Calculator vendor selector
 * - [data-demo="brand-dropdown"] - Calculator brand selector
 * - [data-demo="cost-fields"] - Calculator auto-populated costs
 * - [data-demo="retail-price"] - Calculator retail input
 * - [data-demo="profit-display"] - Calculated profit section
 */
export const demoSteps: ExtendedDemoStep[] = [
  // Step 1: Welcome Intro Modal
  {
    id: 'welcome-intro',
    page: '/frames/orders',
    popover: {
      title: '🎉 Welcome to OptiProfit Demo!',
      description: `
        <div class="space-y-3 text-sm">
          <p class="font-medium">Discover how OptiProfit transforms your optical business in just 5 minutes.</p>
          <p><strong>This demo will show you:</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>Automated vendor email processing</li>
            <li>Frame inventory lifecycle management</li>
            <li>Vendor pricing integration</li>
            <li>Real-time profit calculations</li>
          </ul>
          <p class="text-xs text-gray-600 mt-3">💡 Tip: Use arrow keys to navigate • Press ESC to exit anytime</p>
        </div>
      `,
      side: 'center',
      align: 'center'
    },
    requiresNavigation: true
  },

  // Step 2: Email Parsing Showcase
  {
    id: 'email-parsing-showcase',
    page: '/frames/orders',
    element: '[data-demo="pending-orders-tab"]',
    popover: {
      title: '📧 Step 1: Automated Email Processing',
      description: `
        <p class="text-sm">OptiProfit automatically parsed this vendor email from <strong>Modern Optical</strong> and extracted <strong>3 frames</strong>.</p>
        <p class="text-sm mt-2">No manual data entry needed – just forward your order confirmation emails!</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 3: Pending Inventory Tab
  {
    id: 'pending-inventory-tab',
    page: '/frames/inventory',
    element: '[data-demo="inventory-pending-tab"]',
    popover: {
      title: '📦 Step 2: Pending Inventory',
      description: `
        <p class="text-sm">The "Pending" tab shows frames confirmed by vendors but not yet physically received.</p>
        <p class="text-sm mt-2">These are the 3 frames from the Modern Optical order: <strong>Metropolitan (Black)</strong>, <strong>Executive (Tortoise)</strong>, and <strong>Heritage (Brown)</strong>.</p>
      `,
      side: 'bottom',
      align: 'start'
    },
    requiresNavigation: true,
    waitForElement: true,
    tabToClick: 'pending'
  },

  // Step 4: Vendor Auto-Import Navigation
  {
    id: 'vendor-auto-import',
    page: '/brands',
    element: '[data-demo="vendor-card"]',
    popover: {
      title: '🏢 Step 3: Vendor Auto-Import',
      description: `
        <p class="text-sm"><strong>Modern Optical</strong> was automatically added to your vendors with account <strong>#MO-12345</strong>, extracted directly from the email.</p>
        <p class="text-sm mt-2">Notice the 3 brands detected from your orders: Modern Optics Collection, Classic Series, and more.</p>
      `,
      side: 'top',
      align: 'center'
    },
    requiresNavigation: true,
    waitForElement: true
  },

  // Step 5: Vendor Pricing Display
  {
    id: 'vendor-pricing-display',
    page: '/brands',
    element: '[data-demo="vendor-pricing"]',
    popover: {
      title: '💰 Step 4: Brand Pricing',
      description: `
        <p class="text-sm">Here's the pricing data for <strong>Modern Optics Collection</strong>:</p>
        <ul class="text-sm mt-2 space-y-1">
          <li>• Wholesale Cost: <strong>$85</strong></li>
          <li>• Your Cost: <strong>$55</strong> (35% discount)</li>
          <li>• MSRP: <strong>$150</strong></li>
        </ul>
        <p class="text-sm mt-2 text-blue-600">✨ This data auto-populates in the profit calculator!</p>
      `,
      side: 'right',
      align: 'center'
    }
  },

  // Step 6: Calculator Navigation
  {
    id: 'calculator-navigation',
    page: '/calculator',
    popover: {
      title: '🧮 Profit Calculator',
      description: `
        <p class="text-sm">The heart of OptiProfit – calculate precise frame profits using your vendor pricing data.</p>
        <p class="text-sm mt-2"><strong>Watch how:</strong></p>
        <ul class="text-sm mt-1 space-y-1 list-disc list-inside">
          <li>Vendor data auto-populates</li>
          <li>Real-time profit calculations</li>
          <li>Margin analysis with visual feedback</li>
        </ul>
      `,
      side: 'center',
      align: 'center'
    },
    requiresNavigation: true,
    waitForElement: true
  },

  // Step 7: Company Dropdown Selection
  {
    id: 'select-vendor-dropdown',
    page: '/calculator',
    element: '[data-demo="company-dropdown"]',
    popover: {
      title: '🏢 Step 5: Select Vendor',
      description: `
        <p class="text-sm">Click the <strong>Company</strong> dropdown and select <strong>"Modern Optical"</strong>.</p>
        <p class="text-sm mt-2">Notice how it auto-populates from your vendor list – no manual entry!</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 8: Brand Dropdown Selection
  {
    id: 'select-brand-dropdown',
    page: '/calculator',
    element: '[data-demo="brand-dropdown"]',
    popover: {
      title: '🎨 Step 6: Select Brand',
      description: `
        <p class="text-sm">Now select <strong>"Modern Optics Collection"</strong> from the brand dropdown.</p>
        <p class="text-sm mt-2 font-medium text-purple-600">✨ Watch the magic happen in the next step!</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 9: Cost Auto-Population
  {
    id: 'cost-auto-populate',
    page: '/calculator',
    element: '[data-demo="cost-fields"]',
    popover: {
      title: '✨ Step 7: Auto-Population Magic',
      description: `
        <p class="text-sm font-medium text-green-600">🎉 See how the costs automatically filled in?</p>
        <ul class="text-sm mt-2 space-y-1">
          <li>• Wholesale Cost: <strong>$85</strong></li>
          <li>• Your Cost: <strong>$55</strong></li>
          <li>• Tariff Tax: <strong>$3</strong></li>
        </ul>
        <p class="text-sm mt-2">This data came directly from your vendor pricing setup – <strong>zero manual entry</strong>!</p>
      `,
      side: 'right',
      align: 'center'
    }
  },

  // Step 10: Retail Price Input
  {
    id: 'retail-price-input',
    page: '/calculator',
    element: '[data-demo="retail-price"]',
    popover: {
      title: '💵 Step 8: Set Retail Price',
      description: `
        <p class="text-sm">Enter your retail price (try <strong>$150</strong>).</p>
        <p class="text-sm mt-2">Watch as profit and margin calculations update <strong>in real-time</strong>!</p>
        <p class="text-sm mt-2 text-gray-600">💡 Toggle insurance on/off to see how it affects profit.</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 11: Profit Display & Completion
  {
    id: 'profit-calculation-display',
    page: '/calculator',
    element: '[data-demo="profit-display"]',
    popover: {
      title: '📊 Step 9: Live Profit Analysis',
      description: `
        <p class="text-sm font-medium text-green-600">🎊 Your profit breakdown is live!</p>
        <div class="bg-green-50 border border-green-200 rounded p-3 mt-2">
          <p class="text-sm"><strong>Profit:</strong> $92</p>
          <p class="text-sm"><strong>Margin:</strong> 61.3%</p>
          <p class="text-xs text-green-700 mt-1">✅ Excellent margin (green = good profit)</p>
        </div>
        <p class="text-sm mt-2">Change any value to see instant recalculation!</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 12: Demo Complete
  {
    id: 'demo-complete',
    page: '/calculator',
    popover: {
      title: '🎉 Demo Complete!',
      description: `
        <div class="space-y-3 text-sm">
          <p class="font-medium text-lg">You've experienced the complete OptiProfit workflow:</p>
          <ol class="list-decimal list-inside space-y-1 ml-2">
            <li>Automated email parsing</li>
            <li>Inventory lifecycle management</li>
            <li>Vendor integration with account numbers</li>
            <li>Profit calculations with real-time updates</li>
          </ol>
          <div class="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
            <p class="text-sm font-medium text-blue-800">✨ Ready to optimize your practice's profitability?</p>
            <p class="text-xs text-blue-600 mt-1">All demo data will be cleaned up automatically.</p>
          </div>
        </div>
      `,
      side: 'center',
      align: 'center'
    }
  }
];

export default demoSteps;
