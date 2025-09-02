import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { Clock, Calculator, BarChart3, Package, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TimeSavingPage: React.FC = () => {
  const timeSavingFeatures = [
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Instant Profit Calculations",
      description: "No more manual calculations or spreadsheets. Get accurate profit margins in seconds.",
      timeSaved: "15 minutes per frame calculation"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Centralized Brand Management",
      description: "All your supplier information, costs, and contact details in one organized place.",
      timeSaved: "30 minutes per day searching for information"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Automated Analytics",
      description: "Track performance metrics automatically without manual data entry or analysis.",
      timeSaved: "2 hours per week on reporting"
    }
  ];

  const automatedTasks = [
    "Profit margin calculations with insurance adjustments",
    "Discount percentage computations",
    "Brand cost tracking and updates",
    "Contact information management",
    "Performance analytics generation",
    "Frame comparison analysis"
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 md:p-8">
        <Container>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Time-Saving Automation
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              OptiProfit automates the tedious, time-consuming tasks that slow down your optical business, 
              allowing you to focus on what matters most - serving your customers and growing your practice.
            </p>
          </motion.div>

          {/* Hero Image Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 mb-12 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 rounded-full p-4">
                <Clock className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Save Hours Every Week
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Our users report saving an average of <strong>8-12 hours per week</strong> on administrative 
              tasks, giving them more time to focus on patient care and business growth.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">8-12</div>
                <div className="text-sm text-gray-600">Hours saved per week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">90%</div>
                <div className="text-sm text-gray-600">Faster calculations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-600">Accuracy guaranteed</div>
              </div>
            </div>
          </motion.div>

          {/* Key Time-Saving Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Key Time-Saving Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {timeSavingFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 mx-auto">
                    <div className="text-blue-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-center">
                    {feature.description}
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-green-800">
                      ⏰ Saves: {feature.timeSaved}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Automated Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white rounded-lg p-8 mb-8 shadow-sm border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What Gets Automated
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automatedTasks.map((task, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{task}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Save Time and Increase Efficiency?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join the optical professionals who are already saving hours every week with OptiProfit's 
              automated solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/calculator"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Try the Calculator
                <Calculator className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </Container>
      </div>
    </div>
  );
};

export default TimeSavingPage;