# Driver.js Interactive Demo System

## Overview

The OptiProfit interactive demo system uses [Driver.js](https://driverjs.com/) to provide a guided 14-step tour showcasing the application's key features. This document covers the architecture, implementation details, critical fixes, and maintenance guidelines.

## Architecture

### Core Components

```
src/
├── components/demo/
│   └── DemoProvider.tsx       # Main Driver.js configuration & event handlers
├── contexts/
│   └── DemoContext.tsx        # React context for demo state management
├── demo/
│   ├── demoSteps.ts           # 14-step demo flow configuration
│   ├── demoUtils.ts           # Navigation utilities & element waiting
│   └── mockData.ts            # Demo data (orders, vendors, inventory)
└── pages/
    └── Dashboard.tsx          # "Try Interactive Demo" button
```

### Data Flow

```
User clicks "Try Interactive Demo"
         ↓
DemoContext.startDemo() triggered
         ↓
DemoProvider detects isActive = true
         ↓
Driver.js initialized with config
         ↓
User clicks Next → onNextClick handler
         ↓
1. Navigate to target page (if needed)
2. Wait for elements to load
3. Call driverRef.current.moveNext()
         ↓
Driver.js highlights next element
         ↓
Repeat until step 14 → cleanup
```

## Critical Implementation Details

### The moveNext() Deadlock (Fixed)

**Problem:** Demo was stuck at step 1. Clicking "Next" logged messages but never progressed.

**Root Cause:** In [DemoProvider.tsx:56-140](src/components/demo/DemoProvider.tsx#L56-L140), the `onNextClick` handler performed navigation but **never called `moveNext()`**:

```typescript
// ❌ BROKEN - Driver.js waits forever
onNextClick: async (element, step) => {
  console.log("Allowing Driver.js to handle progression naturally");
  // ... navigation logic ...
  // MISSING: driverRef.current.moveNext();
}
```

**Fix:** Explicitly call `moveNext()` after navigation completes:

```typescript
// ✅ FIXED
onNextClick: async (element, step) => {
  const currentIndex = driverRef.current?.getActiveIndex() ?? 0;
  const nextIndex = currentIndex + 1;

  try {
    // Navigate and wait for page load
    if (nextStep.requiresNavigation && nextStep.page !== window.location.pathname) {
      await demoController.navigateToPage(nextStep.page);

      // Wait for target element
      if (nextStep.element && nextStep.element !== 'body') {
        await demoController.waitForElement(nextStep.element, 5000);
      }

      // Buffer for React rendering
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // ✅ CRITICAL: Progress to next step
    if (driverRef.current) {
      console.log(`✅ Moving to step ${nextIndex + 1}`);
      driverRef.current.moveNext();
    }
  } finally {
    // Re-enable buttons
  }
}
```

**Key Insight:** When you override Driver.js event handlers, you take **full control** of progression. Driver.js will NOT automatically advance - it waits for your handler to call `moveNext()`.

### Navigation Timing (Fixed)

**Problem:** Elements not found after navigation because Driver.js tried to highlight them before the page loaded.

**Root Cause:** Navigation logic was in `onHighlightStarted` which runs AFTER Driver.js tries to find the element:

```typescript
// ❌ BROKEN FLOW
onNextClick → moveNext() → onHighlightStarted → navigate
                              ↑
                    Element doesn't exist yet!
```

**Fix:** Move ALL navigation to `onNextClick` BEFORE calling `moveNext()`:

```typescript
// ✅ CORRECT FLOW
onNextClick → navigate → wait for element → moveNext() → onHighlightStarted
                                                              ↑
                                                Element exists now!
```

### Loading States (Added)

**Problem:** Users clicking "Next" rapidly during slow page loads caused race conditions.

**Fix:** Disable buttons during async operations:

```typescript
const nextButton = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement;
const prevButton = document.querySelector('.driver-popover-prev-btn') as HTMLButtonElement;
const closeButton = document.querySelector('.driver-popover-close-btn') as HTMLButtonElement;

try {
  // Disable buttons and show loading
  if (nextButton) {
    nextButton.disabled = true;
    nextButton.textContent = 'Loading...';
  }
  if (prevButton) prevButton.disabled = true;
  if (closeButton) closeButton.disabled = true;

  // ... async navigation ...

} finally {
  // Always re-enable buttons
  if (nextButton) {
    nextButton.disabled = false;
    nextButton.textContent = originalNextText || 'Next';
  }
  if (prevButton) prevButton.disabled = false;
  if (closeButton) closeButton.disabled = false;
}
```

### Element Waiting with Retry (Enhanced)

**Problem:** Elements sometimes not found on first attempt due to React rendering delays.

**Fix:** Retry logic in [demoUtils.ts:155-196](src/demo/demoUtils.ts#L155-L196):

```typescript
async waitForElement(
  selector: string,
  timeout = 5000,
  retries = 3
): Promise<HTMLElement | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await new Promise<HTMLElement | null>((resolve) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = document.querySelector(selector) as HTMLElement;

        if (element) {
          console.log(`✅ Element found: ${selector} (attempt ${attempt}/${retries})`);
          resolve(element);
          return;
        }

        if (Date.now() - startTime >= timeout) {
          console.warn(`⏰ Timeout on attempt ${attempt}/${retries} for: ${selector}`);
          resolve(null);
          return;
        }

        setTimeout(checkElement, 100);
      };

      checkElement();
    });

    if (result) return result;

    // Wait 500ms before retry
    if (attempt < retries) {
      console.log(`🔄 Retrying element lookup: ${selector} (${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.error(`❌ Element not found after ${retries} attempts: ${selector}`);
  return null;
}
```

**Result:** 3 attempts × 5 seconds = 15 seconds total wait time with intelligent retries.

## Step Configuration

### Extended Step Interface

```typescript
export interface ExtendedDemoStep extends DriveStep {
  id: string;                    // Unique identifier (e.g., 'welcome', 'company-dropdown')
  page: string;                  // Target page path (e.g., '/calculator')
  requiresNavigation?: boolean;  // True if need to navigate to different page
  waitForElement?: boolean;      // True if element loads dynamically
  tabToClick?: string;           // Auto-click tab after highlight (e.g., 'pending')
  dataToInject?: any;            // Data to inject for this step
  element?: string;              // CSS selector to highlight (from DriveStep)
  popover?: {                    // Popover configuration (from DriveStep)
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left' | 'center';
    align?: 'start' | 'center' | 'end';
  };
}
```

### Example Step Definitions

**Simple Step (No Navigation):**
```typescript
{
  id: 'company-dropdown',
  page: '/calculator',
  element: '[data-demo="company-dropdown"]',
  popover: {
    title: 'Step 6: Select Vendor',
    description: 'Click the Company dropdown and select "Modern Optical".',
    side: 'bottom',
    align: 'start'
  }
}
```

**Navigation Step:**
```typescript
{
  id: 'vendors-navigation',
  page: '/brands',
  element: '[data-demo="vendor-card"]',
  requiresNavigation: true,    // ✅ Navigate to /brands
  waitForElement: true,         // ✅ Wait for element to load
  popover: {
    title: 'Step 3: Vendor Management',
    description: 'Modern Optical has been added with account number MO-12345.',
    side: 'top',
    align: 'center'
  }
}
```

**Modal/Center Step:**
```typescript
{
  id: 'welcome',
  page: '/frames/orders',
  requiresNavigation: true,
  popover: {
    title: 'Welcome to OptiProfit Demo! 🎉',
    description: `
      <div class="space-y-3">
        <p>Discover how OptiProfit transforms your optical business.</p>
        <ul class="list-disc list-inside">
          <li>Automated vendor email processing</li>
          <li>Real-time profit calculations</li>
        </ul>
      </div>
    `,
    side: 'center',    // ✅ No element, shows in center
    align: 'center'
  }
}
```

**Tab Click Step:**
```typescript
{
  id: 'comparison-tab',
  page: '/calculator',
  element: '[data-demo="comparison-tab"]',
  tabToClick: 'comparison',    // ✅ Auto-click tab after highlight
  popover: {
    title: 'Step 11: Compare Vendors',
    description: 'Compare profits across different vendors side-by-side.',
    side: 'top',
    align: 'center'
  }
}
```

## Adding New Demo Steps

### 1. Add Data Attributes to JSX

First, mark elements in your components with `data-demo` attributes:

```tsx
// src/pages/Calculator.tsx
<Select data-demo="company-dropdown">
  {/* ... */}
</Select>

<Button data-demo="calculate-btn">
  Calculate
</Button>
```

### 2. Define Step in demoSteps.ts

Add your step to the array in [demoSteps.ts](src/demo/demoSteps.ts):

```typescript
{
  id: 'my-new-step',
  page: '/my-page',
  element: '[data-demo="my-element"]',
  requiresNavigation: true,  // Set if navigating from different page
  waitForElement: true,      // Set if element loads dynamically
  popover: {
    title: 'My Step Title',
    description: 'Explanation of what this step demonstrates.',
    side: 'right',
    align: 'center'
  }
}
```

### 3. Update Total Steps Count

In [DemoContext.tsx:35](src/contexts/DemoContext.tsx#L35), update `totalSteps`:

```typescript
const [state, setState] = useState<DemoState>({
  isActive: false,
  isLoading: false,
  currentStep: 0,
  totalSteps: 15,  // ✅ Was 14, now 15
  demoData: null,
  originalUserData: null
});
```

### 4. Add Demo Data (If Needed)

If your step needs specific data, add it to [mockData.ts](src/demo/mockData.ts):

```typescript
export const DEMO_DATA: DemoData = {
  orders: [...],
  vendors: [...],
  inventory: [...],
  myNewData: [...]  // ✅ Add your data
};
```

### 5. Test the Step

1. Run the app: `npm run dev`
2. Click "Try Interactive Demo" on dashboard
3. Navigate to your new step
4. Check console for errors:
   - `⚠️ Element not found` - Check data-demo attribute exists
   - `❌ Navigation failed` - Check page path is correct
   - `⏰ Timeout` - Increase waitForElement timeout or add waitForElement flag

## Step Validation

Before the demo starts, all steps are validated in [DemoProvider.tsx:256-296](src/components/demo/DemoProvider.tsx#L256-L296):

```typescript
const validateSteps = (): boolean => {
  console.log('🔍 Validating demo steps configuration...');
  let isValid = true;

  demoSteps.forEach((step, index) => {
    // Check required fields
    if (!step.id) {
      console.error(`❌ Step ${index + 1} missing required 'id' field`);
      isValid = false;
    }
    if (!step.page) {
      console.error(`❌ Step ${index + 1} missing required 'page' field`);
      isValid = false;
    }
    if (!step.popover) {
      console.error(`❌ Step ${index + 1} missing required 'popover' field`);
      isValid = false;
    }

    // Warn about navigation steps without elements
    if (step.requiresNavigation && !step.element && step.element !== 'body') {
      console.warn(`⚠️ Step ${index + 1} (${step.id}) requires navigation but has no target element`);
    }

    // Check elements exist on current page
    if (!step.requiresNavigation && step.page === location.pathname && step.element && step.element !== 'body') {
      const exists = document.querySelector(step.element);
      if (!exists) {
        console.warn(`⚠️ Step ${index + 1} (${step.id}) element not found: ${step.element}`);
      }
    }
  });

  return isValid;
};
```

**Console Output:**
```
🔍 Validating demo steps configuration...
⚠️ Step 5 (vendor-card-display) element not found: [data-demo="vendor-card"]
✅ All 14 steps validated successfully
```

## Troubleshooting

### Demo Won't Start

**Symptoms:** Clicking "Try Interactive Demo" does nothing.

**Check:**
1. Open browser console for errors
2. Verify `DemoProvider` is wrapping your app in [App.tsx](src/App.tsx)
3. Check `DemoContext` is providing `startDemo` function
4. Verify Driver.js CSS is imported: `import 'driver.js/dist/driver.css'`

**Debug:**
```typescript
// Add to Dashboard.tsx button click
const handleDemoStart = () => {
  console.log('🎬 Demo button clicked');
  startDemo();
};
```

### Demo Stuck at a Step

**Symptoms:** Clicking "Next" does nothing, console shows repeated "Next button clicked".

**Check:**
1. Verify `moveNext()` is called in `onNextClick` handler
2. Check if step requires navigation: `requiresNavigation: true`
3. Verify target page path matches route exactly
4. Check if element exists: `document.querySelector('[data-demo="..."]')`

**Debug:**
```typescript
// In onNextClick handler
console.log('Current step:', currentIndex);
console.log('Next step:', demoSteps[nextIndex]);
console.log('Current page:', window.location.pathname);
console.log('Target page:', nextStep.page);
console.log('Element exists:', !!document.querySelector(nextStep.element));
```

### Element Not Found After Navigation

**Symptoms:** Console shows `❌ Element not found after navigation: [data-demo="..."]`

**Solutions:**
1. Add `waitForElement: true` to step configuration
2. Increase timeout: `await demoController.waitForElement(selector, 10000)`
3. Check element renders conditionally (loading states, data dependencies)
4. Verify data-demo attribute exists in JSX

**Debug:**
```typescript
// Check if element appears after delay
setTimeout(() => {
  console.log('Element after 2s:', document.querySelector('[data-demo="my-element"]'));
}, 2000);
```

### Navigation Not Working

**Symptoms:** Page doesn't change when step requires navigation.

**Check:**
1. Verify `requiresNavigation: true` is set
2. Check page path matches route: `/calculator` not `calculator`
3. Verify React Router is set up correctly
4. Check navigation helper is initialized: `demoController.setNavigation({ navigate, currentPath })`

**Debug:**
```typescript
// In navigateToPage function
console.log('Navigation helper:', this.navigation);
console.log('Current path:', this.navigation?.currentPath);
console.log('Target path:', targetPage);
console.log('Actual URL:', window.location.pathname);
```

### Buttons Stay Disabled

**Symptoms:** "Next" button shows "Loading..." and never re-enables.

**Cause:** Error thrown before `finally` block re-enables buttons.

**Fix:** Ensure try/finally pattern is used:
```typescript
try {
  // ... async operations ...
} finally {
  // ✅ Always runs, even if error
  if (nextButton) {
    nextButton.disabled = false;
    nextButton.textContent = 'Next';
  }
}
```

### Overlays Stuck on Screen

**Symptoms:** Dark overlay remains after closing demo.

**Solutions:**
1. Check `onDestroyed` cleanup runs: [DemoProvider.tsx:171-189](src/components/demo/DemoProvider.tsx#L171-L189)
2. Verify `demoController.cleanupDemoData()` is called
3. Manually remove stuck elements:
```typescript
const overlays = document.querySelectorAll('.driver-overlay, .driver-popover-wrapper, .demo-spotlight-overlay');
overlays.forEach(overlay => overlay.remove());

document.body.style.overflow = '';
document.body.style.pointerEvents = '';
```

### Tab Click Not Working

**Symptoms:** Step with `tabToClick` doesn't switch tabs.

**Check:**
1. Verify selector exists in `demoUtils.ts` tab selectors:
```typescript
const tabSelectors: Record<string, string> = {
  'pending': '[data-demo="inventory-pending-tab"]',
  'current': '[data-demo="inventory-current-tab"]',
  'comparison': '[data-demo="comparison-tab"]',
  'myTab': '[data-demo="my-tab"]'  // ✅ Add your tab
};
```
2. Check data-demo attribute exists on tab button
3. Verify click event is enabled (not disabled by Driver.js)

## Demo Data Management

### Injecting Demo Data

Demo data is injected via sessionStorage in [demoUtils.ts:123-129](src/demo/demoUtils.ts#L123-L129):

```typescript
injectDemoData(data: any): void {
  sessionStorage.setItem('demoData', JSON.stringify(data));
  sessionStorage.setItem('isDemoMode', 'true');
  console.log('💉 Demo data injected into session storage');
}
```

### Checking Demo Mode in Components

```typescript
import { demoController } from '@/demo/demoUtils';

function MyComponent() {
  const isDemoMode = demoController.isDemoMode();
  const demoData = demoController.getDemoData();

  if (isDemoMode && demoData) {
    // Use demo data
    return <div>{demoData.orders.map(...)}</div>;
  }

  // Use real data
  return <div>{realOrders.map(...)}</div>;
}
```

### Cleanup on Demo End

Cleanup happens in [demoUtils.ts:132-141](src/demo/demoUtils.ts#L132-L141):

```typescript
cleanupDemoData(): void {
  sessionStorage.removeItem('demoData');
  sessionStorage.removeItem('isDemoMode');

  // Run any additional cleanup functions
  this.cleanup.forEach(fn => fn());
  this.cleanup = [];

  console.log('🧹 Demo data cleaned up');
}
```

## Keyboard Navigation

Driver.js supports keyboard controls via [demoUtils.ts:89-120](src/demo/demoUtils.ts#L89-L120):

- **Arrow Right / Space**: Next step
- **Arrow Left**: Previous step
- **Escape**: Close demo

```typescript
private handleKeyboard(event: KeyboardEvent): void {
  if (!this.driver) return;

  switch (event.key) {
    case 'ArrowRight':
    case ' ':
      event.preventDefault();
      this.driver.moveNext();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      this.driver.movePrevious();
      break;
    case 'Escape':
      event.preventDefault();
      this.driver.destroy();
      break;
  }
}
```

## Performance Considerations

### Element Waiting Strategy

Current implementation uses polling with 100ms intervals:

```typescript
const checkElement = () => {
  const element = document.querySelector(selector);
  if (element) {
    resolve(element);
    return;
  }
  setTimeout(checkElement, 100);  // Check every 100ms
};
```

**Alternative:** Use MutationObserver for better performance:

```typescript
async waitForElement(selector: string): Promise<HTMLElement> {
  const existing = document.querySelector(selector);
  if (existing) return existing as HTMLElement;

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element as HTMLElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
```

### Navigation Delays

Current 300ms buffer after navigation:
```typescript
await new Promise(resolve => setTimeout(resolve, 300));
```

**Considerations:**
- Too short: Elements may not be ready
- Too long: Demo feels sluggish
- Ideal: Wait for React render completion

**Alternative:** Wait for React's commit phase:

```typescript
// Use React's flushSync or startTransition
import { flushSync } from 'react-dom';

flushSync(() => {
  navigate(targetPage);
});
// DOM updates are guaranteed to be flushed here
```

## Implementation History

### Critical Fixes (Commit c06393b)

**Phase 1: Progression Deadlock**
- Added `moveNext()` call in `onNextClick` - [DemoProvider.tsx:128-129](src/components/demo/DemoProvider.tsx#L128-L129)
- Added `movePrevious()` call in `onPrevClick` - [DemoProvider.tsx:148](src/components/demo/DemoProvider.tsx#L148)
- Removed conflicting step sync logic - Line 328-330 comments

**Phase 2: Navigation Timing**
- Moved navigation from `onHighlightStarted` to `onNextClick` - Lines 56-140
- Added element waiting before `moveNext()` - Lines 98-111
- Added 300ms React render buffer - Line 111

**Phase 3: Loading States & Retries**
- Disabled buttons during async operations - Lines 88-93
- Re-enable in finally block - Lines 132-138
- Enhanced `waitForElement` with 3 retries - [demoUtils.ts:155-196](src/demo/demoUtils.ts#L155-L196)

**Phase 4: Validation**
- Added step validation function - [DemoProvider.tsx:256-296](src/components/demo/DemoProvider.tsx#L256-L296)
- Runs before demo starts - Line 299
- Checks required fields and element availability

## Testing Checklist

Before deploying demo changes:

- [ ] All 14 steps complete without errors
- [ ] Navigation between pages works smoothly
- [ ] Elements highlighted correctly
- [ ] Loading states show during navigation
- [ ] Previous button works at all steps
- [ ] Close button cleans up properly
- [ ] Keyboard navigation works (arrows, space, escape)
- [ ] Demo data injected and cleaned up
- [ ] No console errors or warnings
- [ ] Overlays removed after demo ends
- [ ] Tab clicks work (steps 3, 13)
- [ ] Mobile responsive (if applicable)
- [ ] Works in Chrome, Firefox, Safari
- [ ] Fast/slow connections tested

## References

- **Driver.js Documentation**: https://driverjs.com/
- **Driver.js GitHub**: https://github.com/kamranahmedse/driver.js
- **React Router**: https://reactrouter.com/
- **OptiProfit Demo Flow**: 14 steps covering orders → inventory → vendors → calculator

## Maintenance Notes

**When to Update:**
- Adding new features to OptiProfit → add demo steps
- Changing page routes → update `page` fields in steps
- Modifying UI elements → update `data-demo` attributes
- Upgrading Driver.js → test event handler compatibility

**Common Changes:**
- Adjust step descriptions for clarity
- Update mock data to match new features
- Add new tab selectors to `demoUtils.ts`
- Increase element wait timeouts for slow components

**Version Compatibility:**
- Driver.js: v1.3.1 (current)
- React Router: v6.x
- React: 18.x

---

**Last Updated:** 2025-01-07
**Maintainer:** Development Team
**Related Docs:** [STYLE_GUIDE.md](docs/technical/STYLE_GUIDE.md)
