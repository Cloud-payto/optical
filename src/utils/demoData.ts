import { Company } from '../types';

export const demoCompanies: Company[] = [
  {
    id: 'demo-1',
    name: 'Luxottica',
    brands: [
      { 
        id: 'demo-1-1', 
        name: 'Ray-Ban', 
        wholesaleCost: 150.00, 
        yourCost: 15.00, 
        tariffTax: 6.00 
      },
      { 
        id: 'demo-1-2', 
        name: 'Oakley', 
        wholesaleCost: 180.00, 
        yourCost: 18.00, 
        tariffTax: 7.20 
      },
      { 
        id: 'demo-1-3', 
        name: 'Vogue', 
        wholesaleCost: 120.00, 
        yourCost: 12.00, 
        tariffTax: 4.80 
      }
    ],
    contactInfo: {
      companyEmail: 'orders@luxottica.com',
      companyPhone: '(555) 987-6543',
      supportEmail: 'support@luxottica.com',
      website: 'https://www.luxottica.com',
      repName: 'David Rodriguez',
      repEmail: 'david.rodriguez@luxottica.com',
      repPhone: '(555) 987-6545'
    }
  },
  {
    id: 'demo-2',
    name: 'Safilo',
    brands: [
      { 
        id: 'demo-2-1', 
        name: 'Safilo Collection', 
        wholesaleCost: 110.00, 
        yourCost: 11.00 
      },
      { 
        id: 'demo-2-2', 
        name: 'Safilo Premium', 
        wholesaleCost: 140.00, 
        yourCost: 14.00, 
        tariffTax: 5.50 
      },
      { 
        id: 'demo-2-3', 
        name: 'Carrera', 
        wholesaleCost: 160.00, 
        yourCost: 16.00, 
        tariffTax: 6.40 
      }
    ],
    contactInfo: {
      companyEmail: 'contact@safilo.com',
      website: 'https://www.safilo.com',
      repName: 'Anna Thompson',
      repEmail: 'anna.thompson@safilo.com',
      repPhone: '(555) 345-6789'
    }
  }
];

export const setupDemoData = () => {
  // Save demo companies to localStorage
  localStorage.setItem('optiprofit_companies', JSON.stringify(demoCompanies));
  
  // Clear any existing calculations for clean demo
  localStorage.removeItem('optiprofit_calculations');
  
  console.log('Demo data setup complete!');
};

export const clearDemoData = () => {
  // Optionally clear demo data when demo ends
  // localStorage.removeItem('optiprofit_companies');
  // localStorage.removeItem('optiprofit_calculations');
};