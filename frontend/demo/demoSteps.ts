import { DriveStep } from 'driver.js';

/**
 * Automated action configuration for demo steps
 */
export interface AutomatedAction {
  type: 'select' | 'input' | 'click' | 'toggle';
  selector?: string; // CSS selector (if not provided, uses step.element)
  value?: any; // Value to set (for select/input types)
  delay?: number; // Delay AFTER popover appears, BEFORE action executes (ms)
  animationDuration?: number; // How long to show the action happening (ms)
}

export interface ExtendedDemoStep extends DriveStep {
  id: string;
  page: string;
  requiresNavigation?: boolean;
  waitForElement?: boolean;
  tabToClick?: string;
  automatedAction?: AutomatedAction; // Automated action to perform when step is highlighted
  autoAdvanceDelay?: number; // How long to wait before auto-advancing to next step (ms, default 3000)
}

/**
 * Enhanced 20-Step Demo Flow for OptiProfit
 *
 * Showcases: Email Parsing → Inventory Management → Filtering/Sorting → Return Reports → Vendor Pricing → Profit Calculator
 *
 * Key Data-Demo Attributes Required:
 * - [data-demo="pending-orders-tab"] - Orders page tab
 * - [data-demo="inventory-pending-tab"] - Inventory pending tab
 * - [data-demo="brand-filter"] - Brand filter dropdown
 * - [data-demo="sort-dropdown"] - Sort dropdown
 * - [data-demo="add-to-return"] - Add to return report button
 * - [data-demo="return-report-btn"] - Open return report button
 * - [data-demo="vendor-card"] - Vendor card in brands page
 * - [data-demo="edit-brand-btn"] - Edit brand button
 * - [data-demo="brand-pricing-modal"] - Brand pricing modal
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
          <p class="font-medium">Discover how OptiProfit transforms your optical business in just 6 minutes.</p>
          <p><strong>This interactive demo will show you:</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>Automated vendor email processing</li>
            <li>Smart inventory filtering & sorting</li>
            <li>Return report generation</li>
            <li>Vendor pricing management</li>
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

  // Step 2: Email Parsing Showcase (FIXED)
  {
    id: 'email-parsing-showcase',
    page: '/frames/orders',
    element: '[data-demo="pending-orders-tab"]',
    popover: {
      title: '📧 Step 1: Automated Email Processing',
      description: `
        <p class="text-sm">OptiProfit automatically parsed this vendor email from <strong>Modern Optical</strong> and extracted <strong>Order #6817</strong> with <strong>18 frames</strong>.</p>
        <p class="text-sm mt-2">Customer: <strong>MARANA EYE CARE</strong> (Account #93277)</p>
        <p class="text-sm mt-2">✨ No manual data entry needed – just forward your order confirmation emails!</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 3: Navigate to Inventory
  {
    id: 'navigate-to-inventory',
    page: '/frames/inventory',
    element: '[data-demo="inventory-pending-tab"]',
    popover: {
      title: '📦 Step 2: Navigate to Inventory',
      description: `
        <p class="text-sm">Let's view the pending inventory from this order.</p>
        <p class="text-sm mt-2">Click the "Pending" tab to see frames that have been ordered but not yet received.</p>
      `,
      side: 'bottom',
      align: 'start'
    },
    requiresNavigation: true,
    waitForElement: true,
    tabToClick: 'pending'
  },

  // Step 4: View All 18 Frames (FIXED)
  {
    id: 'view-all-frames',
    page: '/frames/inventory',
    popover: {
      title: '👓 All 18 Frames from Order #6817',
      description: `
        <p class="text-sm">Here are all <strong>18 frames</strong> from the Modern Optical order:</p>
        <ul class="text-sm mt-2 space-y-1 ml-2">
          <li>• <strong>7 B.M.E.C. frames</strong> (BIG AIR, BIG BEAT, BIG BOLT, etc.)</li>
          <li>• <strong>3 GB+ COLLECTION frames</strong> (BEAUTIFUL, DETERMINED, WONDROUS)</li>
          <li>• <strong>8 MODERN PLASTICS II frames</strong> (CLEO, PATRICK, ESTIMATE, etc.)</li>
        </ul>
        <p class="text-sm mt-2 text-purple-600">✨ Let's explore the powerful filtering features!</p>
      `,
      side: 'center',
      align: 'center'
    }
  },

  // Step 5: Show Filter Options (NEW)
  {
    id: 'show-filters',
    page: '/frames/inventory',
    element: '[data-demo="brand-filter"]',
    autoAdvanceDelay: 3000, // Give user time to read before auto-selecting
    popover: {
      title: '🎯 Step 3: Smart Filtering',
      description: `
        <p class="text-sm">OptiProfit makes it easy to find specific frames with powerful filters:</p>
        <ul class="text-sm mt-2 space-y-1 ml-2 list-disc list-inside">
          <li>Filter by <strong>Vendor</strong></li>
          <li>Filter by <strong>Brand</strong></li>
          <li>Filter by <strong>Color</strong></li>
        </ul>
        <p class="text-sm mt-2">Watch as we filter to see only <strong>B.M.E.C.</strong> frames...</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 6: Filter by Brand (NEW) - NOW WITH AUTOMATION
  {
    id: 'filter-by-brand',
    page: '/frames/inventory',
    element: '[data-demo="brand-filter"]',
    automatedAction: {
      type: 'select',
      value: 'B.M.E.C.',
      delay: 1000, // Wait 1s after popover appears
      animationDuration: 800
    },
    autoAdvanceDelay: 3000, // Wait 3s to see filtered results
    popover: {
      title: '🎨 Filter by Brand',
      description: `
        <p class="text-sm">Watch as we select <strong>"B.M.E.C."</strong> from the brand filter...</p>
        <p class="text-sm mt-2">The table will instantly update to show only B.M.E.C. frames!</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 7: View Filtered Results (NEW)
  {
    id: 'view-filtered-results',
    page: '/frames/inventory',
    autoAdvanceDelay: 4000, // Give time to see filtered results
    popover: {
      title: '✅ Filtered Results',
      description: `
        <p class="text-sm font-medium text-green-600">Now showing only <strong>7 B.M.E.C. frames</strong>:</p>
        <ul class="text-xs mt-2 space-y-0.5 ml-2">
          <li>• BIG AIR (Black)</li>
          <li>• BIG BEAT (Black/Brown)</li>
          <li>• BIG BOLT (Navy Fade)</li>
          <li>• BIG DUDE (Rust/Brown)</li>
          <li>• BIG FLOW (Navy/Gun/Navy)</li>
          <li>• BIG FRONT (Aqua/Brown Demi)</li>
          <li>• BIG RIVER (Grey/Gunmetal)</li>
        </ul>
        <p class="text-sm mt-2">💡 You can combine filters to narrow down even further!</p>
      `,
      side: 'center',
      align: 'center'
    }
  },

  // Step 8: Show Sorting Options (NEW)
  {
    id: 'show-sorting',
    page: '/frames/inventory',
    element: '[data-demo="sort-dropdown"]',
    autoAdvanceDelay: 3000,
    popover: {
      title: '📊 Step 4: Smart Sorting',
      description: `
        <p class="text-sm">OptiProfit offers multiple sorting options:</p>
        <ul class="text-sm mt-2 space-y-1 ml-2 list-disc list-inside">
          <li>Newest First / Oldest First</li>
          <li><strong>Return Window (Closing Soon)</strong> 🔥</li>
          <li>Brand (A-Z)</li>
          <li>Stock (High-Low)</li>
        </ul>
        <p class="text-sm mt-2 text-orange-600">Watch as we sort by shortest return window...</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 9: Sort by Return Window (NEW) - NOW WITH AUTOMATION
  {
    id: 'sort-by-return-window',
    page: '/frames/inventory',
    element: '[data-demo="sort-dropdown"]',
    automatedAction: {
      type: 'select',
      value: 'return_window',
      delay: 1000,
      animationDuration: 800
    },
    autoAdvanceDelay: 3500, // Give time to see sorted results
    popover: {
      title: '⏰ Return Window Priority',
      description: `
        <p class="text-sm">Watch as we select <strong>"Return Window (Closing Soon)"</strong>...</p>
        <p class="text-sm mt-2">This shows frames with the <strong>shortest time left</strong> to process returns – critical for managing vendor return policies!</p>
        <p class="text-sm mt-2 text-xs text-gray-600">💡 Most vendors have 30-90 day return windows</p>
      `,
      side: 'bottom',
      align: 'start'
    }
  },

  // Step 9.5: Expand Frame Details (NEW)
  {
    id: 'expand-frame-details',
    page: '/frames/inventory',
    element: '[data-demo="frame-expand-btn"]',
    automatedAction: {
      type: 'click',
      selector: '[data-demo="frame-expand-btn"]',
      delay: 1000,
      animationDuration: 600
    },
    autoAdvanceDelay: 4000, // Give time to see expanded details
    popover: {
      title: '🔍 Step 5: View Frame Details',
      description: `
        <p class="text-sm">Watch as we <strong>expand the first frame</strong> to show complete details.</p>
        <p class="text-sm mt-2">The expanded view shows:</p>
        <ul class="text-xs mt-2 space-y-0.5 ml-2 list-disc list-inside">
          <li>High-resolution frame image</li>
          <li>Complete specifications (UPC, SKU, dimensions)</li>
          <li>Order information and vendor details</li>
          <li>Return window status</li>
        </ul>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 10: Add to Return Report (UPDATED)
  {
    id: 'add-to-return-report',
    page: '/frames/inventory',
    element: '[data-demo="add-to-return"]',
    popover: {
      title: '🔄 Step 6: Add to Return Report',
      description: `
        <p class="text-sm">Now that you can see all the frame details, you can add it to your return report.</p>
        <p class="text-sm mt-2">Click the <strong>🔄 icon</strong> to add this frame to your return list.</p>
        <p class="text-sm mt-2 text-purple-600">✨ OptiProfit will generate a professional PDF return form!</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 11: Open Return Report Modal (NEW)
  {
    id: 'open-return-report',
    page: '/frames/inventory',
    element: '[data-demo="return-report-btn"]',
    popover: {
      title: '📋 Generate Return Report',
      description: `
        <p class="text-sm">Once you've added frames, click the <strong>"Return Report"</strong> button.</p>
        <p class="text-sm mt-2">The system will generate a professional PDF with:</p>
        <ul class="text-xs mt-2 space-y-0.5 ml-2 list-disc list-inside">
          <li>Frame details (SKU, color, size)</li>
          <li>Order information</li>
          <li>Vendor contact details</li>
          <li>Return authorization number</li>
        </ul>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 12: Navigate to Vendors/Brands (FIXED) - AUTO-EXPANDS VIA COMPONENT
  {
    id: 'navigate-to-vendors',
    page: '/brands',
    element: '[data-demo="vendor-card"]',
    // ❌ REMOVED: automatedAction click that was causing race condition
    // The CompanyCard component handles auto-expansion via useEffect when isDemo={true}
    autoAdvanceDelay: 5000, // Increased to give time to see the expanded brands
    popover: {
      title: '🏢 Step 6: Vendor Management',
      description: `
        <p class="text-sm"><strong>Modern Optical</strong> was automatically added from the email with account <strong>#93277</strong>.</p>
        <p class="text-sm mt-2">Watch as the vendor card <strong>automatically expands</strong> to show <strong>3 brands</strong> from your order:</p>
        <ul class="text-xs mt-2 space-y-0.5 ml-2">
          <li>• <strong>B.M.E.C.</strong> (7 frames) - $55.25 your cost</li>
          <li>• <strong>GB+ COLLECTION</strong> (3 frames) - $45.00 your cost</li>
          <li>• <strong>MODERN PLASTICS II</strong> (8 frames) - $35.75 your cost</li>
        </ul>
      `,
      side: 'top',
      align: 'center'
    },
    requiresNavigation: true,
    waitForElement: true
  },

  // Step 13: Edit Brand Pricing (NEW)
  {
    id: 'edit-brand-pricing',
    page: '/brands',
    element: '[data-demo="view-brand-details-btn"]',
    popover: {
      title: '💰 Step 7: View Brand Pricing',
      description: `
        <p class="text-sm">Click the <strong>"View Details"</strong> button next to any brand to see and edit pricing.</p>
        <p class="text-sm mt-2">You can customize:</p>
        <ul class="text-xs mt-2 space-y-0.5 ml-2 list-disc list-inside">
          <li>Your negotiated cost</li>
          <li>Wholesale/MSRP pricing</li>
          <li>Discount percentages</li>
          <li>Tariff/tax rates</li>
        </ul>
        <p class="text-sm mt-2 text-purple-600">✨ This data auto-populates in the profit calculator!</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 14: View Brand Pricing Details (FIXED)
  {
    id: 'view-brand-pricing',
    page: '/brands',
    element: '[data-demo="brand-pricing-modal"]',
    popover: {
      title: '💵 B.M.E.C. Pricing Details',
      description: `
        <p class="text-sm">Here's the pricing data for <strong>B.M.E.C.</strong>:</p>
        <ul class="text-sm mt-2 space-y-1 bg-blue-50 border border-blue-200 rounded p-3">
          <li>• Wholesale Cost: <strong>$85.00</strong></li>
          <li>• Your Cost: <strong>$55.25</strong></li>
          <li>• Discount: <strong>35%</strong></li>
        </ul>
        <p class="text-sm mt-2 text-green-600">✅ Excellent negotiated pricing!</p>
      `,
      side: 'center',
      align: 'center'
    }
  },

  // Step 15: Calculator Navigation
  {
    id: 'calculator-navigation',
    page: '/calculator',
    element: '[data-demo="company-dropdown"]', // ✅ FIXED: Added target element to wait for
    popover: {
      title: '🧮 Step 8: Profit Calculator',
      description: `
        <p class="text-sm">The heart of OptiProfit – calculate precise frame profits using your vendor pricing data.</p>
        <p class="text-sm mt-2"><strong>Watch how:</strong></p>
        <ul class="text-sm mt-1 space-y-1 list-disc list-inside">
          <li>Vendor data auto-populates from your brands</li>
          <li>Real-time profit calculations</li>
          <li>Margin analysis with visual feedback</li>
          <li>Insurance toggle for accurate net profit</li>
        </ul>
      `,
      side: 'center',
      align: 'center'
    },
    requiresNavigation: true,
    waitForElement: true
  },

  // Step 16: Open Company Dropdown
  {
    id: 'open-vendor-dropdown',
    page: '/calculator',
    element: '[data-demo="company-dropdown"]',
    waitForElement: true,
    automatedAction: {
      type: 'click',
      selector: '[data-demo="company-dropdown"]',
      delay: 800,
      animationDuration: 600
    },
    autoAdvanceDelay: 2000, // Wait for dropdown to open
    popover: {
      title: '🏢 Step 9: Select Vendor',
      description: `
        <p class="text-sm">Watch as we open the <strong>Company</strong> dropdown.</p>
        <p class="text-sm mt-2">Your vendors from the Brands page automatically populate here!</p>
      `,
      side: 'top',
      align: 'start'
    }
  },

  // Step 16.5: Select Modern Optical
  {
    id: 'select-modern-optical',
    page: '/calculator',
    element: '[data-demo="company-option-modern-optical"]',
    waitForElement: true,
    automatedAction: {
      type: 'click',
      selector: '[data-demo="company-option-modern-optical"]',
      delay: 500,
      animationDuration: 800
    },
    autoAdvanceDelay: 2500, // Wait for selection to complete
    popover: {
      title: '✨ Selecting Modern Optical',
      description: `
        <p class="text-sm">We're automatically selecting <strong>"Modern Optical"</strong> from the list.</p>
        <p class="text-sm mt-2">This triggers the brand dropdown to populate with Modern Optical's brands!</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 17: Open Brand Dropdown
  {
    id: 'open-brand-dropdown',
    page: '/calculator',
    element: '[data-demo="brand-dropdown"]',
    waitForElement: true,
    automatedAction: {
      type: 'click',
      selector: '[data-demo="brand-dropdown"]',
      delay: 800,
      animationDuration: 600
    },
    autoAdvanceDelay: 2000, // Wait for dropdown to open
    popover: {
      title: '🎨 Step 10: Select Brand',
      description: `
        <p class="text-sm">Now we'll open the <strong>Brand</strong> dropdown.</p>
        <p class="text-sm mt-2">All brands from Modern Optical are now available!</p>
      `,
      side: 'top',
      align: 'start'
    }
  },

  // Step 17.5: Select B.M.E.C.
  {
    id: 'select-bmec-brand',
    page: '/calculator',
    element: '[data-demo="brand-option-bmec"]',
    waitForElement: true,
    automatedAction: {
      type: 'click',
      selector: '[data-demo="brand-option-bmec"]',
      delay: 500,
      animationDuration: 800
    },
    autoAdvanceDelay: 3000, // Wait for auto-population to complete
    popover: {
      title: '✨ Selecting B.M.E.C.',
      description: `
        <p class="text-sm">Automatically selecting <strong>"B.M.E.C."</strong> from Modern Optical's brands.</p>
        <p class="text-sm mt-2 font-medium text-purple-600">✨ Watch the costs auto-populate in the next step!</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 18: Cost Auto-Population (FIXED)
  {
    id: 'cost-auto-populate',
    page: '/calculator',
    element: '[data-demo="cost-fields"]',
    waitForElement: true,
    popover: {
      title: '✨ Step 11: Auto-Population Magic',
      description: `
        <p class="text-sm font-medium text-green-600">🎉 The costs automatically filled in!</p>
        <ul class="text-sm mt-2 space-y-1 bg-green-50 border border-green-200 rounded p-3">
          <li>• Wholesale Cost: <strong>$85.00</strong></li>
          <li>• Your Cost: <strong>$55.25</strong></li>
          <li>• Tariff Tax: <strong>$0.00</strong></li>
        </ul>
        <p class="text-sm mt-2">This data came directly from your <strong>B.M.E.C.</strong> pricing setup in the Brands page – <strong>zero manual entry required</strong>!</p>
      `,
      side: 'right',
      align: 'center'
    }
  },

  // Step 19: Retail Price Input
  {
    id: 'retail-price-input',
    page: '/calculator',
    element: '[data-demo="retail-price"]',
    waitForElement: true, // ✅ ADDED: Wait for element to be fully rendered
    popover: {
      title: '💵 Step 12: Set Retail Price',
      description: `
        <p class="text-sm">The retail price field is now <strong>editable</strong> – try changing it to <strong>$150</strong> (or any value).</p>
        <p class="text-sm mt-2">Watch as profit and margin calculations update <strong>in real-time</strong>!</p>
        <p class="text-sm mt-2 text-gray-600">💡 Toggle insurance on/off to see how it affects profit.</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 20: Profit Display & Completion (FIXED)
  {
    id: 'profit-calculation-display',
    page: '/calculator',
    element: '[data-demo="profit-display"]',
    waitForElement: true, // ✅ ADDED: Wait for element to be fully rendered
    popover: {
      title: '📊 Step 13: Live Profit Analysis',
      description: `
        <p class="text-sm font-medium text-green-600">🎊 Your profit breakdown is live!</p>
        <div class="bg-green-50 border border-green-200 rounded p-3 mt-2">
          <p class="text-sm"><strong>Profit:</strong> $94.75</p>
          <p class="text-sm"><strong>Margin:</strong> 63.2%</p>
          <p class="text-xs text-green-700 mt-1">✅ Excellent margin (green = good profit)</p>
        </div>
        <p class="text-sm mt-2">Change any value to see instant recalculation!</p>
      `,
      side: 'left',
      align: 'center'
    }
  },

  // Step 21: Demo Complete
  {
    id: 'demo-complete',
    page: '/calculator',
    popover: {
      title: '🎉 Demo Complete!',
      description: `
        <div class="space-y-3 text-sm">
          <p class="font-medium text-lg">You've experienced the complete OptiProfit workflow:</p>
          <ol class="list-decimal list-inside space-y-1 ml-2">
            <li>Automated email parsing (18 frames from Order #6817)</li>
            <li>Smart filtering & sorting (by brand, return window)</li>
            <li>Return report generation (PDF export)</li>
            <li>Vendor pricing management (3 brands)</li>
            <li>Real-time profit calculations (63% margin!)</li>
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
