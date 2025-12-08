import React from 'react';
import { Container } from '../components/ui/Container';

const AboutPage: React.FC = () => {
  return (
    <div className="h-full bg-gray-50 dark:bg-[#181F1C]">
      <div className="p-6 md:p-8">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            About OptiProfit
          </h1>
          <div className="bg-white dark:bg-[#1F2623] shadow-lg rounded-lg p-8 border border-gray-100 dark:border-gray-700">
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-6">
              OptiProfit is designed to help optical businesses streamline their operations,
              accurately calculate profit margins, and make data-driven decisions to enhance profitability.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-6">
              Our mission is to provide intuitive and powerful tools that save you time and help you grow your business.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Key Features</h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Accurate profit margin calculations</li>
                  <li>• Insurance coverage analysis</li>
                  <li>• Frame comparison tools</li>
                  <li>• Brand and provider management</li>
                  <li>• Data persistence and history</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Benefits</h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Save time on calculations</li>
                  <li>• Make informed pricing decisions</li>
                  <li>• Track performance over time</li>
                  <li>• Optimize inventory selection</li>
                  <li>• Increase overall profitability</li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default AboutPage;
