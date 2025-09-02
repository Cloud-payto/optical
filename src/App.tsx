import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <DemoProvider>
          <div className="min-h-screen">
            <Toaster position="top-center" />
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/calculator" element={<CalculatorPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/brands" element={<BrandsCostsPage />} />
                  <Route path="/vendor-comparison" element={<VendorComparisonPage />} />
                  <Route path="/time-saving" element={<TimeSavingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
            <DemoOverlay />
          </div>
        </DemoProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;