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
  ChevronDown,
  Package,
  Scale,
  Warehouse,
  ShoppingCart,
  Glasses,
  Eye
} from 'lucide-react';

// Modern nested navigation structure
const navigationConfig = [
  { name: 'Home', to: '/', icon: Home },
  { name: 'Dashboard', to: '/dashboard', icon: BarChart3 },
  { name: 'Calculator', to: '/calculator', icon: Calculator },
  {
    name: 'Frames',
    icon: Glasses,
    children: [
      { name: 'Inventory', to: '/frames/inventory', icon: Warehouse },
      { name: 'Orders', to: '/frames/orders', icon: ShoppingCart },
    ]
  },
  {
    name: 'Lenses',
    icon: Eye,
    disabled: true,
    children: [
      { name: 'Inventory', to: '/lenses/inventory', icon: Warehouse },
      { name: 'Orders', to: '/lenses/orders', icon: ShoppingCart },
    ]
  },
  {
    name: 'Vendors',
    icon: Package,
    children: [
      { name: 'My Vendors', to: '/brands', icon: Package },
      { name: 'Vendor Comparison', to: '/vendor-comparison', icon: Scale },
    ]
  },
  { name: 'About', to: '/about', icon: Info },
];

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Frames']));
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isSectionActive = (children?: Array<{ to: string }>) => {
    if (!children) return false;
    return children.some(child => location.pathname === child.to);
  };

  const toggleSection = (name: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
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
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigationConfig.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections.has(item.name);
            const sectionActive = isSectionActive(item.children);

            if (hasChildren) {
              // Nested navigation item
              return (
                <li key={item.name}>
                  <button
                    onClick={() => !item.disabled && toggleSection(item.name)}
                    disabled={item.disabled}
                    className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : 'justify-between'
                    } ${
                      sectionActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">
                          {item.name}
                          {item.disabled && <span className="ml-2 text-xs">(Soon)</span>}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && !item.disabled && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* Child items */}
                  {!isCollapsed && isExpanded && !item.disabled && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.to}>
                            <Link
                              to={child.to}
                              className={`flex items-center px-3 py-2 rounded-lg transition-colors space-x-3 ${
                                isActive(child.to)
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              }`}
                            >
                              <ChildIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">{child.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            } else {
              // Simple navigation item
              return (
                <li key={item.name}>
                  <Link
                    to={item.to!}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : 'space-x-3'
                    } ${
                      isActive(item.to!)
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
            }
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <User className="h-4 w-4" />
              <span>Welcome, {user?.username || user?.email?.split('@')[0]}</span>
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
