import { NavigateFunction } from 'react-router-dom';
import { AutomatedAction } from './demoSteps';
// Driver type removed - using any type for compatibility

export interface DemoNavigationHelper {
  navigate: NavigateFunction;
  currentPath: string;
}

export class DemoController {
  private driver: any | null = null;
  private navigation: DemoNavigationHelper | null = null;
  private cleanup: (() => void)[] = [];

  constructor() {
    this.handleKeyboard = this.handleKeyboard.bind(this);
  }

  setNavigation(navigation: DemoNavigationHelper) {
    this.navigation = navigation;
  }

  // Update current path when navigation occurs
  updateCurrentPath(newPath: string) {
    if (this.navigation) {
      this.navigation.currentPath = newPath;
    }
  }

  // Get current navigation helper
  getNavigation() {
    return this.navigation;
  }

  setDriver(driver: any) {
    this.driver = driver;
  }

  // Navigate to a specific page if needed
  async navigateToPage(targetPage: string): Promise<void> {
    if (!this.navigation) {
      console.warn('Navigation helper not available');
      throw new Error('Navigation helper not available');
    }

    if (this.navigation.currentPath !== targetPage) {
      console.log(`🧭 Navigating from ${this.navigation.currentPath} to ${targetPage}`);
      this.navigation.navigate(targetPage);

      // Wait for actual navigation to complete by checking the URL
      let attempts = 0;
      const maxAttempts = 30; // INCREASED: 3 seconds total for slower page loads

      while (attempts < maxAttempts && window.location.pathname !== targetPage) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.location.pathname === targetPage) {
        // Update current path after actual navigation
        this.navigation.currentPath = targetPage;
        console.log(`✅ Navigation to ${targetPage} completed (took ${attempts * 100}ms)`);
      } else {
        // P1 FIX: Retry navigation once if first attempt failed
        console.warn(`⚠️ First navigation attempt failed - still at ${window.location.pathname}. Retrying...`);

        // Retry navigation
        this.navigation.navigate(targetPage);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait longer for retry

        let retryAttempts = 0;
        const maxRetryAttempts = 20; // 2 more seconds
        while (retryAttempts < maxRetryAttempts && window.location.pathname !== targetPage) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retryAttempts++;
        }

        if (window.location.pathname === targetPage) {
          this.navigation.currentPath = targetPage;
          console.log(`✅ Navigation succeeded on retry (took ${retryAttempts * 100}ms)`);
        } else {
          const errorMsg = `Navigation to ${targetPage} failed after retry - still at ${window.location.pathname}`;
          console.error(`❌ ${errorMsg}`);
          throw new Error(errorMsg);
        }
      }
    } else {
      console.log(`📍 Already at ${targetPage}`);
    }
  }

  // Click a specific tab (for tab switching within pages)
  clickTab(tabName: string): void {
    const tabSelectors: Record<string, string> = {
      'pending': '[data-demo="inventory-pending-tab"]',
      'current': '[data-demo="inventory-current-tab"]',
      'comparison': '[data-demo="comparison-tab"]'
    };

    const selector = tabSelectors[tabName];
    if (selector) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log(`🖱️ Clicking tab: ${tabName}`);
        element.click();
      }
    }
  }

  /**
   * Execute an automated action (select dropdown, fill input, click button, etc.)
   */
  async executeAutomatedAction(action: AutomatedAction, fallbackSelector?: string): Promise<void> {
    // Wait for specified delay
    if (action.delay) {
      console.log(`⏳ Waiting ${action.delay}ms before automated action...`);
      await new Promise(resolve => setTimeout(resolve, action.delay));
    }

    const selector = action.selector || fallbackSelector;
    if (!selector) {
      console.error('❌ No selector provided for automated action');
      return;
    }

    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`⚠️ Automated action failed: Element not found: ${selector}`);
      return;
    }

    console.log(`🤖 Executing automated ${action.type} on ${selector}`, action.value ? `with value: ${action.value}` : '');

    try {
      switch (action.type) {
        case 'select':
          await this.automateSelect(element as HTMLSelectElement, action.value, action.animationDuration);
          break;
        case 'input':
          await this.automateInput(element as HTMLInputElement, action.value, action.animationDuration);
          break;
        case 'click':
          await this.automateClick(element as HTMLElement, action.animationDuration);
          break;
        case 'toggle':
          await this.automateToggle(element as HTMLElement, action.animationDuration);
          break;
      }
      console.log(`✅ Automated action completed successfully`);
    } catch (error) {
      console.error(`❌ Error executing automated action:`, error);
    }
  }

  /**
   * Automate selecting a value from a dropdown
   */
  private async automateSelect(
    select: HTMLSelectElement,
    value: string,
    animationDuration = 500
  ): Promise<void> {
    // Add visual feedback class
    select.classList.add('demo-animating');

    // Wait a bit to show the element is being interacted with
    await new Promise(resolve => setTimeout(resolve, 300));

    // Set the value
    select.value = value;

    // Trigger React's onChange event (must use React's synthetic event system)
    // This creates a native event that React can intercept
    const changeEvent = new Event('change', { bubbles: true });
    select.dispatchEvent(changeEvent);

    console.log(`  ↳ Selected value: "${value}"`);

    // Visual feedback duration
    await new Promise(resolve => setTimeout(resolve, animationDuration));
    select.classList.remove('demo-animating');
  }

  /**
   * Automate typing into an input field
   */
  private async automateInput(
    input: HTMLInputElement,
    value: string,
    animationDuration = 1000
  ): Promise<void> {
    input.classList.add('demo-animating');
    input.focus();

    // Simulate typing character by character for visual effect
    const valueStr = value.toString();
    const chars = valueStr.split('');

    for (let i = 0; i <= chars.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      input.value = valueStr.substring(0, i);

      // Trigger input event for React (for controlled components)
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
    }

    // Trigger change event at the end
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);

    console.log(`  ↳ Typed value: "${value}"`);

    await new Promise(resolve => setTimeout(resolve, 300));
    input.blur();
    input.classList.remove('demo-animating');
  }

  /**
   * Automate clicking an element
   */
  private async automateClick(
    element: HTMLElement,
    animationDuration = 500
  ): Promise<void> {
    // Add visual feedback
    element.classList.add('demo-animating');

    // Show a "pulse" effect
    const originalTransform = element.style.transform;
    element.style.transition = 'transform 0.2s ease';
    element.style.transform = 'scale(0.95)';

    await new Promise(resolve => setTimeout(resolve, 100));

    element.style.transform = 'scale(1)';

    await new Promise(resolve => setTimeout(resolve, 200));

    // Trigger the click
    element.click();

    console.log(`  ↳ Element clicked`);

    await new Promise(resolve => setTimeout(resolve, animationDuration));
    element.classList.remove('demo-animating');
    element.style.transform = originalTransform;
  }

  /**
   * Automate toggling a switch/checkbox
   */
  private async automateToggle(
    element: HTMLElement,
    animationDuration = 500
  ): Promise<void> {
    return this.automateClick(element, animationDuration);
  }

  // Handle keyboard navigation
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

  // Enable keyboard navigation
  enableKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleKeyboard);
    this.cleanup.push(() => {
      document.removeEventListener('keydown', this.handleKeyboard);
    });
  }

  // Disable keyboard navigation
  disableKeyboardNavigation(): void {
    document.removeEventListener('keydown', this.handleKeyboard);
  }

  // Inject demo data into application state
  injectDemoData(data: any): void {
    // Store demo data in sessionStorage to be picked up by components
    sessionStorage.setItem('demoData', JSON.stringify(data));
    sessionStorage.setItem('isDemoMode', 'true');
    
    console.log('💉 Demo data injected into session storage');
  }

  // Clean up demo data
  cleanupDemoData(): void {
    sessionStorage.removeItem('demoData');
    sessionStorage.removeItem('isDemoMode');
    
    // Run any additional cleanup functions
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
    
    console.log('🧹 Demo data cleaned up');
  }

  // Check if we're in demo mode
  isDemoMode(): boolean {
    return sessionStorage.getItem('isDemoMode') === 'true';
  }

  // Get demo data from session storage
  getDemoData(): any | null {
    const data = sessionStorage.getItem('demoData');
    return data ? JSON.parse(data) : null;
  }

  // Wait for element to appear (useful for dynamic content)
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

      // Wait before retry
      if (attempt < retries) {
        console.log(`🔄 Retrying element lookup: ${selector} (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.error(`❌ Element not found after ${retries} attempts: ${selector}`);
    return null;
  }

  // Highlight element with a pulse effect
  highlightElement(selector: string, duration = 2000): void {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;

    element.style.transition = 'all 0.3s ease';
    element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
    element.style.transform = 'scale(1.02)';

    const cleanup = () => {
      element.style.boxShadow = '';
      element.style.transform = '';
    };

    setTimeout(cleanup, duration);
    this.cleanup.push(cleanup);
  }

  // Scroll element into view smoothly
  scrollToElement(selector: string): void {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }

  // Create a spotlight effect on the active element
  createSpotlight(selector: string): void {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'demo-spotlight-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.6);
      z-index: 9999;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;

    // Create spotlight hole
    const rect = element.getBoundingClientRect();
    const spotlightRadius = Math.max(rect.width, rect.height) / 2 + 10;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    overlay.style.background = `radial-gradient(circle at ${centerX}px ${centerY}px, transparent ${spotlightRadius}px, rgba(0, 0, 0, 0.6) ${spotlightRadius + 2}px)`;

    document.body.appendChild(overlay);

    // Cleanup function
    const cleanup = () => {
      if (overlay.parentNode) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    };

    this.cleanup.push(cleanup);
  }

  // Get progress percentage
  getProgress(currentStep: number, totalSteps: number): number {
    return Math.round((currentStep / totalSteps) * 100);
  }
}

// Singleton instance
export const demoController = new DemoController();

export default demoController;