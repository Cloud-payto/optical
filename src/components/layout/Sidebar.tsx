import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calculator, 
  BarChart3, 
  Info, 
  Home,
  LogOut, 
  User,
  ChevronLeft,
  ChevronRight,
  Package,
  Scale
} from 'lucide-react';

const navigation = [
  { name: 'Home', to: '/', icon: Home },
  { name: 'Calculator', to: '/calculator', icon: Calculator },
  { name: 'Dashboard', to: '/dashboard', icon: BarChart3 },
  { name: 'Vendors', to: '/brands', icon: Package },
  { name: 'Vendor Comparison', to: '/vendor-comparison', icon: Scale },
  { name: 'About', to: '/about', icon: Info },
];

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 flex flex-col h-screen ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <img 
                src="/images/icons/logo_trans_white(128).png" 
                alt="OptiProfit Logo" 
                className="h-12 w-12"
              />
              <span className="text-lg font-bold">OptiProfit</span>
            </div>
          )}
          {isCollapsed && (
            <div className="bg-blue-600 rounded-lg p-1.5 mx-auto">
              <img 
                src="/images/icons/logo_trans_white(128).png" 
                alt="OptiProfit Logo" 
                className="h-8 w-8"
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.to}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isCollapsed ? 'justify-center' : 'space-x-3'
                  } ${
                    isActive(item.to)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <User className="h-4 w-4" />
              <span>Welcome, {user?.username}</span>
            </div>
          </div>
        )}
        
        <button
          onClick={logout}
          className={`flex items-center w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;