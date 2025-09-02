import React from 'react';
import { Container } from '../components/ui/Container';

const DashboardPage: React.FC = () => {

  // Sample data for the dashboard
  const topSellingBrands = [
    { brand: 'Visionary Optics', unitsSold: 120, profit: '$6,500' },
    { brand: 'Style Frames', unitsSold: 95, profit: '$5,200' },
    { brand: 'ClearView Eyewear', unitsSold: 80, profit: '$4,800' },
    { brand: 'Modern Specs', unitsSold: 70, profit: '$4,200' },
    { brand: 'Classic Frames', unitsSold: 65, profit: '$3,800' },
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 md:p-8">
        <Container size="xl">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-demo="metrics-cards">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 font-medium">Total Frame Profit</p>
              <p className="text-2xl font-bold text-gray-900">$25,450</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 font-medium">Total Frames Sold</p>
              <p className="text-2xl font-bold text-gray-900">1,245</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 font-medium">Average Profit per Frame</p>
              <p className="text-2xl font-bold text-gray-900">$20.44</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 font-medium">Top Selling Brand</p>
              <p className="text-2xl font-bold text-gray-900">Visionary Optics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Selling Brands Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Top Selling Brands</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Brand
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Units Sold
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topSellingBrands.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.brand}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.unitsSold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.profit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sales Trends Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Sales Trends</h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 font-medium">Monthly Profit</p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-gray-900">$2,120</p>
                    <span className="ml-2 text-sm font-medium text-green-600">+15%</span>
                  </div>
                  <p className="text-sm text-gray-500">This Month</p>
                </div>
                <div className="h-48 mt-6">
                  <div className="h-full w-full
                    bg-gradient-to-t from-gray-50 to-white
                    rounded-lg border border-gray-200 p-4">
                    <div className="h-full flex items-end space-x-1">
                      {[50, 80, 60, 90, 70, 110, 80].map((height, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-8 bg-blue-500 rounded-t-sm" 
                            style={{ height: `${height}%` }}
                          />
                          <span className="mt-2 text-xs text-gray-500">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default DashboardPage;
