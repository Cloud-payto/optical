# OptiProfit Demo System - Complete Redesign Plan

## Overview
This document outlines the complete redesign of the OptiProfit demo system to follow the **real operational workflow** that users actually experience:

**Email → Review → Confirm → Current Inventory → Returns → Import Vendor → Add Pricing → Calculator**

## Design Philosophy - INTERACTIVE GUIDED TOUR
- **Real Software, Real Interactions**: Users actually USE the software during demo, not watch a simulation
- **Pre-populated Demo Data**: Demo data exists in memory (emails, inventory, vendors) to provide context
- **Guided Actions**: Tooltips say "Click here to confirm", "Select Modern Optical", "Enter $150 for retail price"
- **Real Calculations**: Calculator computes actual profits with all nuanced fields (insurance, tariff, etc.)
- **Learn By Doing**: Users perform real actions and see real results
- **Follow Real Workflow**: Email → Review → Confirm → Inventory → Returns → Import Vendor → Add Pricing → Calculator
- **Temporary Demo Data**: All fake data exists ONLY during the demo session and is immediately removed when demo ends

## Interactive Demo Flow
**NOT automated playback** - Users actually click buttons, fill forms, select dropdowns, etc.

Example:
- ❌ **OLD**: Demo automatically shows "calculated profit"
- ✅ **NEW**: Tooltip says "Now select 'Modern Optical' from the Company dropdown", user clicks dropdown, selects company, sees costs auto-populate, then tooltip says "Enter $150 for retail price", user types it, calculator computes real profit

## Demo Data Lifecycle
1. **Demo Start**: User clicks "Start Demo" → Fake data injected into state/memory (emails, pending inventory, vendors WITHOUT pricing)
2. **During Demo**: User interacts with real components - clicks tabs, confirms orders, edits vendors, uses calculator
3. **All Fields Work**: Insurance toggle, coverage amounts, tariff tax, retail price multiplier - everything functions normally
4. **Demo End**: User clicks "Skip Demo", "Finish", or "Exit" → All fake data immediately removed from memory
5. **Clean State**: After demo, user returns to their actual account data with zero demo artifacts

---

## Demo Steps (18 Total - Interactive)

### Phase 1: Email Processing (Steps 1-3)

#### **Step 1: Welcome & Introduction**
- **Page**: `/frames/inventory` (Emails tab)
- **Position**: Center modal
- **Title**: "Welcome to OptiProfit Demo!"
- **Description**:
  > "Let me show you how OptiProfit transforms vendor emails into actionable inventory and profit insights. We'll walk through the complete workflow from receiving an order email to calculating profits."
- **Fake Data**: None yet
- **Action**: User clicks "Next"

#### **Step 2: Incoming Vendor Email**
- **Page**: `/frames/inventory` (Emails tab active)
- **Position**: Highlight emails table
- **Title**: "Step 1: Vendor Sends Order Confirmation"
- **Description**:
  > "Your vendor sends an order confirmation email. OptiProfit automatically receives and parses it. Here's a demo email from Modern Optical with 5 frames on order."
- **Fake Data Injected** (based on real Modern Optical email structure):
  ```javascript
  {
    id: "demo-email-001",
    from: "noreply@modernoptical.com",
    subject: "Your Receipt for Order Number 99999",  // Fake order number
    receivedAt: "2025-11-05T09:15:00Z",
    vendor: "Modern Optical",
    orderNumber: "99999",  // Fake order number
    customerAccount: "99999",  // Fake account number (real format: 5 digits)
    placedBy: "Demo Rep",  // Fake rep name
    status: "parsed",
    itemCount: 5
  }
  ```
- **Action**: Highlight the email row in the table

#### **Step 3: Review Email Details**
- **Page**: `/frames/inventory` (Emails tab, email detail view open)
- **Position**: Highlight email detail panel (right side or modal)
- **Title**: "Review Email Contents"
- **Description**:
  > "Click on the email to see the parsed order details. OptiProfit extracted 5 frames from the confirmation email, including brand, model, UPC, quantity, and costs."
- **Fake Data**: Email detail shows parsed items
- **Action**: User sees email detail, clicks "Confirm Order" button

---

### Phase 2: Pending Inventory (Steps 4-5)

#### **Step 4: Pending Orders Overview**
- **Page**: `/frames/inventory` (Pending tab active)
- **Position**: Highlight pending orders table
- **Title**: "Step 2: Review Pending Orders"
- **Description**:
  > "After parsing the email, the 5 frames appear in your Pending Orders. This is where you review items before confirming them into your current inventory."
- **Fake Data Injected** (using real Modern Optical brands):
  ```javascript
  [
    {
      id: "demo-pending-001",
      vendor: "Modern Optical",
      brand: "B.M.E.C.",
      model: "BIG AIR",
      color: "BLACK",
      size: "54",
      upc: "675254228656",  // Real UPC from sample email
      quantity: 1,
      wholesaleCost: null,  // Pricing not in email, to be added in My Vendors
      status: "pending",
      orderId: "99999",
      receivedDate: "2025-11-05"
    },
    {
      id: "demo-pending-002",
      vendor: "Modern Optical",
      brand: "B.M.E.C.",
      model: "BIG BOLT",
      color: "NAVY FADE",
      size: "58",
      upc: "675254222883",
      quantity: 1,
      wholesaleCost: null,
      status: "pending",
      orderId: "99999",
      receivedDate: "2025-11-05"
    },
    {
      id: "demo-pending-003",
      vendor: "Modern Optical",
      brand: "GB+ COLLECTION",
      model: "BEAUTIFUL",
      color: "BLACK/GOLD",
      size: "56",
      upc: "675254228748",
      quantity: 1,
      wholesaleCost: null,
      status: "pending",
      orderId: "99999",
      receivedDate: "2025-11-05"
    },
    {
      id: "demo-pending-004",
      vendor: "Modern Optical",
      brand: "GB+ COLLECTION",
      model: "WONDROUS",
      color: "PINK CRYST/PK",
      size: "54",
      upc: "675254313710",
      quantity: 1,
      wholesaleCost: null,
      status: "pending",
      orderId: "99999",
      receivedDate: "2025-11-05"
    },
    {
      id: "demo-pending-005",
      vendor: "Modern Optical",
      brand: "MODERN PLASTICS II",
      model: "PATRICK",
      color: "BLACK",
      size: "55",
      upc: "675254314656",
      quantity: 1,
      wholesaleCost: null,
      status: "pending",
      orderId: "99999",
      receivedDate: "2025-11-05"
    }
  ]
  ```
- **Action**: Highlight the pending table

#### **Step 5: Confirm Order**
- **Page**: `/frames/inventory` (Pending tab, items selected)
- **Position**: Highlight "Confirm Order" button
- **Title**: "Confirm Your Order"
- **Description**:
  > "Select the items you want to confirm into your current inventory. Click 'Confirm Order' to move them from pending to current inventory."
- **Action**: User clicks "Confirm Order", items move to Current Inventory tab

---

### Phase 3: Current Inventory (Steps 6-7)

#### **Step 6: Current Inventory View**
- **Page**: `/frames/inventory` (Current tab active)
- **Position**: Highlight current inventory table
- **Title**: "Step 3: View Current Inventory"
- **Description**:
  > "Your confirmed frames now appear in Current Inventory. This is your live stock of available frames. You can track quantities, costs, and status for each item."
- **Fake Data**: Pending items now moved to "current" status
- **Action**: Highlight the current inventory table with 10 frames (5 from demo + 5 existing)

#### **Step 7: Inventory Details**
- **Page**: `/frames/inventory` (Current tab, row expanded)
- **Position**: Highlight expanded row details
- **Title**: "Track Frame Details"
- **Description**:
  > "Click on any frame to see full details: vendor, brand, model, UPC, quantity in stock, costs, and order history. This helps you manage your inventory efficiently."
- **Action**: Show expanded row with full frame details

---

### Phase 4: Returns Processing (Step 8)

#### **Step 8: Process Returns**
- **Page**: `/reports/returns`
- **Position**: Center or highlight returns table
- **Title**: "Step 4: Handle Returns"
- **Description**:
  > "Sometimes frames need to be returned to vendors. The Returns section tracks all returned items, return reasons, and updates your inventory automatically when returns are processed."
- **Fake Data Injected**:
  ```javascript
  [
    {
      id: "demo-return-001",
      vendor: "Modern Optical",
      brand: "B.M.E.C.",
      model: "BIG AIR (Defective)",
      color: "BLACK",
      size: "54",
      upc: "675254228656",
      quantity: 1,
      reason: "Defective hinge - frame warped",
      returnDate: "2025-11-03",
      status: "completed",
      refundAmount: 45.00  // Estimated wholesale cost
    }
  ]
  ```
- **Action**: Show returns table

---

### Phase 5: Vendor Management (Steps 9-11)

#### **Step 9: Import Vendor to My Vendors**
- **Page**: `/brands` (My Vendors page)
- **Position**: Highlight "Import from Orders" button
- **Title**: "Step 5: Import Vendor Data"
- **Description**:
  > "Now let's import Modern Optical into 'My Vendors'. This allows you to add pricing information and use this vendor in the profit calculator. Click 'Import from Orders'."
- **Action**: Highlight import button

#### **Step 10: Vendor Added Successfully**
- **Page**: `/brands` (vendor card visible)
- **Position**: Highlight the newly added Modern Optical vendor card
- **Title**: "Vendor Imported!"
- **Description**:
  > "Modern Optical has been added to your vendors. Notice the brands detected from your orders: B.M.E.C., GB+ Collection, and Modern Plastics II. But we need to add your actual costs to calculate accurate profits."
- **Fake Data Injected**:
  ```javascript
  {
    id: "demo-vendor-001",
    name: "Modern Optical",
    importedFrom: "orders",
    brands: [
      {
        id: "brand-001",
        name: "B.M.E.C.",
        wholesaleCost: null,  // Not yet filled
        yourCost: null,
        discountPercent: null
      },
      {
        id: "brand-002",
        name: "GB+ Collection",
        wholesaleCost: null,
        yourCost: null,
        discountPercent: null
      },
      {
        id: "brand-003",
        name: "Modern Plastics II",
        wholesaleCost: null,
        yourCost: null,
        discountPercent: null
      }
    ]
  }
  ```
- **Action**: Highlight vendor card

#### **Step 11: Add Vendor Pricing**
- **Page**: `/brands` (edit modal open for Modern Optical)
- **Position**: Highlight pricing fields in modal
- **Title**: "Step 6: Add Your Costs"
- **Description**:
  > "Click 'Edit' on Modern Optical to add your actual costs. Enter the wholesale cost and what you actually pay. OptiProfit calculates your discount percentage automatically. This is crucial for accurate profit calculations."
- **Fake Data to Fill**:
  ```javascript
  {
    brands: [
      {
        name: "B.M.E.C.",
        wholesaleCost: 50.00,  // Estimated wholesale
        yourCost: 42.50,  // 15% discount
        discountPercent: 15.00
      },
      {
        name: "GB+ Collection",
        wholesaleCost: 55.00,
        yourCost: 46.75,  // 15% discount
        discountPercent: 15.00
      },
      {
        name: "Modern Plastics II",
        wholesaleCost: 45.00,
        yourCost: 38.25,  // 15% discount
        discountPercent: 15.00
      }
    ]
  }
  ```
- **Action**: User fills in costs, saves

---

### Phase 6: Profit Calculator (Steps 12-17) - INTERACTIVE

#### **Step 12: Calculator Introduction**
- **Page**: `/calculator`
- **Position**: Center
- **Title**: "Step 7: Calculate Frame Profits"
- **Description**:
  > "Now for the magic! The profit calculator automatically imports your vendor pricing. Let's calculate how much profit you'll make selling a B.M.E.C. frame from Modern Optical."
- **User Action**: Clicks "Next"
- **Demo Behavior**: Navigate to calculator page

#### **Step 13: Select Company**
- **Page**: `/calculator`
- **Position**: Highlight company dropdown
- **Title**: "Select Your Vendor Company"
- **Description**:
  > "Click the Company dropdown and select 'Modern Optical' from the list. This is the vendor you imported earlier."
- **User Action**: User actually clicks dropdown, selects "Modern Optical"
- **Demo Behavior**: Waits for user to select company, then advances to next step
- **Data Reaction**: Company selection triggers React state update

#### **Step 14: Select Brand**
- **Page**: `/calculator`
- **Position**: Highlight brand dropdown (now enabled after company selection)
- **Title**: "Select Brand"
- **Description**:
  > "Now select 'B.M.E.C.' from the Brand dropdown. Watch what happens to the cost fields!"
- **User Action**: User clicks brand dropdown, selects "B.M.E.C."
- **Demo Behavior**: Waits for brand selection
- **Data Reaction**: Your Cost ($42.50), Wholesale Cost ($50.00), Discount (15%) auto-populate from vendor pricing

#### **Step 15: See Auto-Population**
- **Page**: `/calculator`
- **Position**: Highlight cost input fields (Your Cost, Wholesale Cost, Discount %)
- **Title**: "Costs Auto-Populated!"
- **Description**:
  > "See how Your Cost ($42.50), Wholesale Cost ($50.00), and Discount % (15%) automatically filled in? This is the pricing you added in My Vendors. No manual entry needed!"
- **User Action**: User observes the auto-filled values, clicks "Next"
- **Demo Behavior**: Highlight the auto-filled fields with green glow

#### **Step 16: Enter Retail Price**
- **Page**: `/calculator`
- **Position**: Highlight Retail Price input field
- **Title**: "Set Your Retail Price"
- **Description**:
  > "Now enter the retail price you charge customers for this frame. Try $150.00. You can also toggle insurance on/off, adjust coverage amounts, and see how it affects profit."
- **User Action**: User types "150" into Retail Price field, can optionally toggle insurance/adjust coverage
- **Demo Behavior**: Calculator recomputes profit in real-time as user types
- **Data Reaction**: Real `calculateProfit()` or `calculateNonInsuranceProfit()` function executes with actual logic

#### **Step 17: View Real Profit Results**
- **Page**: `/calculator`
- **Position**: Highlight profit display section (ProfitDisplay component)
- **Title**: "Your Profit Breakdown"
- **Description**:
  > "OptiProfit calculated your complete profit breakdown! Total Profit, Profit Margin %, Patient Payment (if insurance), and more. All computed using the real calculator logic. Try changing the retail price or insurance settings to see live updates!"
- **User Action**: User observes calculated results, can optionally adjust values to see recalculation
- **Demo Behavior**: Show all calculated fields with real values
- **Real Calculation**: All fields computed by actual `calculateProfit()` function with insurance coverage, reimbursement, tariff tax, etc.

---

### Phase 7: Dashboard & Conclusion (Step 18)

#### **Step 18: Dashboard Overview & Completion**
- **Page**: `/dashboard`
- **Position**: Center
- **Title**: "Demo Complete!"
- **Description**:
  > "You've completed the full OptiProfit workflow! Email → Review → Confirm → Inventory → Returns → Import Vendor → Add Pricing → Calculate Profit. The Dashboard tracks your performance metrics. Ready to optimize your practice's profitability?"
- **User Action**: User clicks "Finish" button
- **Demo Behavior**:
  1. Show completion message
  2. Clear all demo data from memory
  3. Navigate user to their clean dashboard
- **Fake Data** (Dashboard metrics - displayed during demo):
  ```javascript
  {
    totalFrameProfit: 14567.89,
    totalFramesSold: 127,
    avgProfitPerFrame: 114.70,
    topBrand: "B.M.E.C."
  }
  ```
- **Data Cleanup**: ALL demo data immediately removed from React Context state

---

## Fake Data Structure

**⚠️ IMPORTANT: All demo data is stored ONLY in React state/context during the demo session. NO data is persisted to localStorage, Supabase, or any database. When demo ends, all fake data is immediately cleared from memory.**

### Email Data (In-Memory Only)
```javascript
{
  emails: [
    {
      id: "demo-email-001",
      from: "noreply@modernoptical.com",
      subject: "Your Receipt for Order Number 99999",
      receivedAt: "2025-11-05T09:15:00Z",
      vendor: "Modern Optical",
      orderNumber: "99999",  // Fake order number
      customerAccount: "99999",  // Fake account
      placedBy: "Demo Rep",  // Fake rep
      status: "parsed",
      itemCount: 5,
      parsedData: {
        orderDate: "2025-11-05",
        shipDate: "2025-11-08",
        items: [/* 5 items listed in Step 4 */]
      }
    }
  ]
}
```

### Pending Inventory Data (In-Memory Only)
- 5 items from the email using **real Modern Optical brands**: B.M.E.C., GB+ Collection, Modern Plastics II
- Real UPCs from sample email (but fake order/account numbers)
- Status: "pending"
- Linked to fake order ID "99999"

### Current Inventory Data (In-Memory Only)
- After confirmation in demo, pending items move to "current"
- Status changes from "pending" to "current"
- All 5 demo frames in current inventory

### Returns Data (In-Memory Only)
- 1 completed return: B.M.E.C. BIG AIR (defective)

### Vendor Data (In-Memory Only)
- Modern Optical with 3 brands: B.M.E.C., GB+ Collection, Modern Plastics II
- Initially no pricing, then pricing added in Step 11
- Uses estimated wholesale costs (not real pricing)

### Calculator Data (In-Memory Only)
- Auto-populated from demo vendor pricing
- Example calculation for B.M.E.C. frame

### Dashboard Metrics (In-Memory Only)
- Aggregated fake performance data
- Shows realistic numbers but completely fabricated

---

## Implementation Notes

### DemoContext Changes - INTERACTIVE APPROACH
1. **New `demoSteps` array**: 18 steps following real workflow with **user action tracking**
2. **Demo data state**: Stored in React Context state (NOT localStorage/database)
   ```javascript
   const [demoData, setDemoData] = useState({
     emails: [],
     pendingInventory: [],
     currentInventory: [],
     returns: [],
     vendors: [],  // Pre-populated but WITHOUT pricing initially
   });
   ```
3. **`startDemo()` function**: Injects fake data into state, navigates to first step
4. **`nextStep()` function**:
   - For passive steps: Advances immediately when user clicks "Next"
   - For interactive steps: **Waits for user action** (e.g., waits until user selects company, then advances)
5. **User action detection**: Listen for specific events (dropdown selection, button clicks, form submissions)
6. **`endDemo()` function**: Clears ALL demo data from state immediately
7. **Navigation**: Properly navigate between pages and tabs
8. **Data isolation**: Demo data merged with real data, tagged with `isDemo: true` flag
9. **Real component interaction**: Demo doesn't block or override component behavior - users actually use the software

### DemoOverlay Changes - INTERACTIVE TOOLTIPS
1. **Improved tooltip positioning**: Better handling for different page layouts
2. **Tab-specific targeting**: Ability to highlight tabs within pages (e.g., "Pending" tab)
3. **Modal support**: Highlight modals (e.g., vendor edit modal)
4. **Table row highlighting**: Highlight specific rows in tables
5. **Action-based progression**: Tooltips say "Click X to continue" instead of "Next" button advancing automatically
6. **Waiting state**: Show loading indicator when waiting for user action (e.g., "Waiting for you to select a company...")
7. **Skip option always available**: User can skip interactive steps if they want to move faster

### Data Injection Strategy
- **Step-by-step injection**: Don't inject all data at once
- **Progressive reveal**: Show data as user progresses through steps
- **In-memory only**: ALL demo data stored in React Context state, never persisted
- **Clean state transitions**: Data transforms as demo progresses (e.g., pending → current)
- **Immediate cleanup**: `endDemo()` sets all demo data arrays to empty `[]`
- **No persistence**: No localStorage, no Supabase writes, no database entries
- **Real vendor structure**: Uses authentic Modern Optical brands and UPC formats with fake order/account numbers

### Key Selectors Needed
```javascript
// Inventory Page
'[data-demo="emails-tab"]'
'[data-demo="pending-tab"]'
'[data-demo="current-tab"]'
'[data-demo="email-row"]'
'[data-demo="pending-table"]'
'[data-demo="confirm-order-btn"]'
'[data-demo="current-inventory-table"]'

// Brands Page
'[data-demo="import-vendor-btn"]'
'[data-demo="vendor-card"]'
'[data-demo="edit-vendor-btn"]'
'[data-demo="pricing-fields"]'

// Calculator Page
'[data-demo="company-dropdown"]'
'[data-demo="brand-dropdown"]'
'[data-demo="cost-fields"]'
'[data-demo="profit-display"]'

// Returns Page
'[data-demo="returns-table"]'

// Dashboard
'[data-demo="metrics-cards"]'
```

---

## User Experience Flow

### Entry Point
- User clicks "Start Demo" button (on homepage or in app)
- Demo starts at `/frames/inventory` with Emails tab active

### Navigation Flow
1. Inventory (Emails) → Inventory (Pending) → Inventory (Current)
2. Current Inventory → Returns
3. Returns → My Vendors (Brands)
4. Brands → Calculator
5. Calculator → Dashboard
6. Dashboard → Demo complete

### Exit Options
- "Skip Demo" button available at any step
- "Escape" key exits demo
- "Finish" button on final step
- All fake data cleared on exit

### Keyboard Shortcuts
- **Right Arrow / Space**: Next step
- **Left Arrow**: Previous step
- **Escape**: Exit demo

---

## Success Metrics

After completing the demo, users should understand:
1. ✅ How vendor emails automatically populate inventory
2. ✅ The pending → current inventory workflow
3. ✅ How to handle returns
4. ✅ How to import vendors and add pricing
5. ✅ How calculator auto-populates from vendor data
6. ✅ How to calculate frame profitability
7. ✅ Where to monitor overall performance

---

## Next Steps

1. ✅ Review and approve this demo plan
2. ⏳ Update DemoContext.tsx with new 15-step flow
3. ⏳ Create fake data injection/removal functions
4. ⏳ Add `data-demo` attributes to relevant components
5. ⏳ Update DemoOverlay.tsx for better positioning
6. ⏳ Test complete flow with fake data
7. ⏳ Polish transitions and tooltips
8. ⏳ Deploy and gather user feedback
