import { NavigateFunction } from 'react-router-dom';
import { Driver } from 'driver.js';

export interface DemoNavigationHelper {
  navigate: NavigateFunction;
  currentPath: string;
}

export class DemoController {
  private driver: Driver | null = null;
  private navigation: DemoNavigationHelper | null = null;
  private cleanup: (() => void)[] = [];

  constructor() {
    this.handleKeyboard = this.handleKeyboard.bind(this);
  }

  setNavigation(navigation: DemoNavigationHelper) {
    this.navigation = navigation;
  }

  setDriver(driver: Driver) {
    this.driver = driver;
  }

  // Navigate to a specific page if needed
  async navigateToPage(targetPage: string): Promise<void> {
    if (!this.navigation) return;

    if (this.navigation.currentPath !== targetPage) {
      console.log(`🧭 Navigating from ${this.navigation.currentPath} to ${targetPage}`);
      this.navigation.navigate(targetPage);
      
      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
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
  async waitForElement(selector: string, timeout = 5000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector) as HTMLElement;
        
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime >= timeout) {
          console.warn(`⏰ Timeout waiting for element: ${selector}`);
          resolve(null);
          return;
        }
        
        setTimeout(checkElement, 100);
      };
      
      checkElement();
    });
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