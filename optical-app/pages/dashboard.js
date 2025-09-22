import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import RecentOrders from '../components/RecentOrders';
import InventoryOverview from '../components/InventoryOverview';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalInventory: 0,
    totalValue: 0,
    pendingItems: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      // Fetch dashboard stats
      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session.user?.name || session.user?.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="📦"
            trend="+12%"
            trendUp={true}
          />
          <StatsCard
            title="Total Inventory"
            value={stats.totalInventory}
            icon="🏷️"
            trend="+8%"
            trendUp={true}
          />
          <StatsCard
            title="Total Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            icon="💰"
            trend="+15%"
            trendUp={true}
          />
          <StatsCard
            title="Pending Items"
            value={stats.pendingItems}
            icon="⏳"
            trend="-5%"
            trendUp={false}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <RecentOrders />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
            <InventoryOverview />
          </div>
        </div>

        {/* Email Processing Status */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Email Processing Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <p className="font-medium">CloudMailin Webhook</p>
                <p className="text-sm text-gray-600">Status: Active</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Vendor Parsers</p>
                <p className="text-sm text-gray-600">Safilo, Modern Optical, Luxottica</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                3 Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}