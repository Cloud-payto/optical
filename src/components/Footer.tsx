import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white shadow-sm py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} OptiProfit. All rights reserved.</p>
        <p className="mt-1">Designed for optical practices to maximize frame profitability.</p>
      </div>
    </footer>
  );
};

export default Footer;