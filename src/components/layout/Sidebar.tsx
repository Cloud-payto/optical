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
  PackageOpen,
  Archive,
  ShoppingCart
} from 'lucide-react';

interface NavigationItem {
  name: string;
  to?: string;
  icon: any;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Home', to: '/', icon: Home },
  { name: 'Calculator', to: '/calculator', icon: Calculator },
  { name: 'Dashboard', to: '/dashboard', icon: BarChart3 },
  {
    name: 'Frames',
    icon: Warehouse,
    children: [
      { name: 'Orders', to: '/frames/orders', icon: ShoppingCart },
      { name: 'Inventory', to: '/inventory', icon: PackageOpen },
      { name: 'Archive', to: '/frames/archive', icon: Archive },
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
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(['Frames', 'Vendors']); // Open by default
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (children?: NavigationItem[]) => {
    if (!children) return false;
    return children.some(child => child.to && isActive(child.to));
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.includes(item.name);
    const isItemActive = item.to ? isActive(item.to) : isParentActive(item.children);

    if (hasChildren) {
      return (
        <li key={item.name}>
          <button
            onClick={() => !isCollapsed && toggleDropdown(item.name)}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } ${
              isItemActive
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
            }`}
            title={isCollapsed ? item.name : undefined}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Dropdown Items */}
          {!isCollapsed && isOpen && (
            <ul className="mt-1 ml-3 space-y-1 border-l-2 border-gray-700/50 pl-3">
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <li key={child.name}>
                    <Link
                      to={child.to!}
                      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 space-x-3 ${
                        isActive(child.to!)
                          ? 'bg-violet-600/90 text-white shadow-md'
                          : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
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
    }

    // Regular nav item without children
    return (
      <li key={item.name}>
        <Link
          to={item.to!}
          className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          } ${
            isActive(item.to!)
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
              : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
          }`}
          title={isCollapsed ? item.name : undefined}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
        </Link>
      </li>
    );
  };

  return (
    <div className={`bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white transition-all duration-300 flex flex-col h-screen border-r border-gray-800 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl p-2 shadow-lg">
                <img
                  src="/images/icons/logo_trans_white(128).png"
                  alt="OptiProfit Logo"
                  className="h-8 w-8"
                />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">OptiProfit</span>
            </div>
          )}
          {isCollapsed && (
            <div className="bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl p-2 mx-auto shadow-lg">
              <img
                src="/images/icons/logo_trans_white(128).png"
                alt="OptiProfit Logo"
                className="h-8 w-8"
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-800/60 transition-colors"
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
      <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
        <ul className="space-y-1">
          {navigation.map(renderNavItem)}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800/50 bg-gray-900/50">
        {!isCollapsed && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-800/40 rounded-lg px-3 py-2">
              <User className="h-4 w-4" />
              <span className="truncate">Welcome, {user?.email?.split('@')[0]}</span>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className={`flex items-center w-full px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-600/90 hover:text-white transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20 ${
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