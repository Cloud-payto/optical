import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import OrdersPage from './pages/OrdersPage';
import Debug from './pages/Debug';

function App() {
  return (
    <ErrorBoundary>
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
                        {/* Frames routes */}
                        <Route path="/frames/orders" element={<OrdersPage />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/frames/archive" element={<Inventory />} /> {/* Placeholder - will be Archive page */}
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
    </ErrorBoundary>
  );
}

export default App;