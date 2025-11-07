import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import DemoProviderComponent from './components/demo/DemoProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DemoTour from './components/DemoTour';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import DashboardPage from './pages/Dashboard';
import AboutPage from './pages/About.tsx';
import BrandsCostsPage from './pages/BrandsCostsPage';
import TimeSavingPage from './pages/TimeSavingPage';
import VendorComparisonPage from './pages/VendorComparisonPage';
import VendorDetailsPage from './pages/VendorDetailsPage';
import Inventory from './pages/Inventory';
import OrdersPage from './features/orders/OrdersPage';
import InventoryPage from './features/inventory/InventoryPage';
import ReturnsPage from './features/reports/ReturnsPage';
import Debug from './pages/Debug';
import Onboarding from './pages/Onboarding';

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry once on failure
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <DemoProvider>
              <DemoProviderComponent>
                <div className="min-h-screen">
                <Toaster position="top-center" />
                <Routes>
                  {/* Debug route - accessible without authentication */}
                  <Route path="/debug" element={<Debug />} />

                  {/* Onboarding route - accessible after signup */}
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } />

                  {/* Protected routes */}
                  <Route path="/*" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/calculator" element={<CalculatorPage />} />
                          <Route path="/dashboard" element={<DashboardPage />} />
                          <Route path="/brands" element={<BrandsCostsPage />} />
                          <Route path="/vendor-comparison" element={<VendorComparisonPage />} />
                          <Route path="/vendor/:vendorId" element={<VendorDetailsPage />} />
                          <Route path="/time-saving" element={<TimeSavingPage />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/orders" element={<OrdersPage />} />
                          <Route path="/frames/inventory" element={<InventoryPage />} />
                          <Route path="/frames/orders" element={<OrdersPage />} />
                          <Route path="/reports/pending" element={<div className="p-6">Pending Reports - Coming Soon</div>} />
                          <Route path="/reports/current-inventory" element={<div className="p-6">Current Inventory Reports - Coming Soon</div>} />
                          <Route path="/reports/sold" element={<div className="p-6">Sold Reports - Coming Soon</div>} />
                          <Route path="/reports/archived" element={<div className="p-6">Archived Reports - Coming Soon</div>} />
                          <Route path="/reports/returns" element={<ReturnsPage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                </Routes>
                <DemoTour />
                </div>
              </DemoProviderComponent>
            </DemoProvider>
          </Router>
        </AuthProvider>
        {/* React Query DevTools - only visible in development */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;