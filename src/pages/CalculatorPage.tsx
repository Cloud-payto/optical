import React, { useState, useEffect } from 'react';
import ProfitCalculator from '../components/ProfitCalculator';
import CompareFrames from '../components/CompareFrames';
import { Container } from '../components/ui/Container';
import { useDemo } from '../contexts/DemoContext';

const CalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison'>('calculator');
  const { isDemo, currentStepData } = useDemo();

  // Switch to comparison tab when demo reaches comparison steps
  useEffect(() => {
    if (isDemo && currentStepData) {
      // Check if we're on a comparison demo step
      if (currentStepData.id === 'comparison-intro' || 
          currentStepData.id === 'comparison-overview' || 
          currentStepData.id === 'comparison-results') {
        setActiveTab('comparison');
      }
      // Switch back to calculator for calculator-specific steps
      else if (currentStepData.page === '/calculator' && 
               !currentStepData.id.includes('comparison')) {
        setActiveTab('calculator');
      }
    }
  }, [isDemo, currentStepData]);

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 md:p-8">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Profit Tools
          </h1>
          
          {/* Toggle Tabs */}
          <div className="flex mb-8">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'calculator' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Single Profit Calculator
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                data-demo="comparison-tab"
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'comparison' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Profit Comparison
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
            {activeTab === 'calculator' ? (
              <ProfitCalculator />
            ) : (
              <CompareFrames />
            )}
          </div>
        </Container>
      </div>
    </div>
  );
};

export default CalculatorPage;
