import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DemoOverlay from './components/demo/DemoOverlay';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import DashboardPage from './pages/Dashboard';
import AboutPage from './pages/About.tsx';
import BrandsCostsPage from './pages/BrandsCostsPage';
import TimeSavingPage from './pages/TimeSavingPage';
import VendorComparisonPage from './pages/VendorComparisonPage';
import Inventory from './pages/Inventory';
import OrdersPage from './features/orders/OrdersPage';
import Debug from './pages/Debug';

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
              <div className="min-h-screen">
                <Toaster position="top-center" />
                <Routes>
                  {/* Debug route - accessible without authentication */}
                  <Route path="/debug" element={<Debug />} />

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
                          <Route path="/time-saving" element={<TimeSavingPage />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/orders" element={<OrdersPage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                </Routes>
                <DemoOverlay />
              </div>
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