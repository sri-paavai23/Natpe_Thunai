"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import IndexPage from './pages/Index';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/Home';
import MarketPage from './pages/MarketPage';
import ServicesPage from './pages/ServicesPage';
import FoodPage from './pages/FoodPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';
import CreateListingPage from './pages/CreateListingPage';
import WalletPage from './pages/WalletPage';
import TournamentsPage from './pages/TournamentsPage';
import TrackingPage from './pages/TrackingPage';
import CashExchangePage from './pages/CashExchangePage';
import DeveloperDashboardPage from './pages/DeveloperDashboardPage';
import VerificationBanner from './components/VerificationBanner';
import { Toaster } from 'sonner';
import ErrandPage from './pages/ErrandsPage';
import ShortTermNeedsPage from './pages/ShortTermNeedsPage';
import CollaboratorsPage from './pages/CollaboratorsPage';

// A wrapper for the main layout, including Header and Footer
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isVerified } = useAuth(); // Fixed: Use isAuthenticated and isVerified
  const location = useLocation();
  const noHeaderFooterPaths = ["/", "/auth"];

  const showHeaderFooter = !noHeaderFooterPaths.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {showHeaderFooter && <Header />}
      {isAuthenticated && !isVerified && showHeaderFooter && <VerificationBanner />}
      <main className="flex-grow">
        {children}
      </main>
      {showHeaderFooter && <Footer />}
    </div>
  );
};

// A protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Array<'user' | 'developer' | 'ambassador'> }) => {
  const { user, userProfile, isLoading, isAuthenticated } = useAuth(); // Fixed: Use isAuthenticated
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>; // Or a spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/home" replace />; // Redirect unauthorized roles
  }

  return children;
};

// Developer-specific layout/route
const DeveloperLayout = () => {
  const { isAuthenticated, userProfile, isLoading } = useAuth(); // Fixed: Use isAuthenticated
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading developer access...</div>;
  }

  if (!isAuthenticated || userProfile?.role !== 'developer') {
    return <Navigate to="/home" replace />;
  }

  return (
    <AppLayout>
      <DeveloperDashboardPage />
    </AppLayout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/home" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><HomePage /></ProtectedRoute>} />
            <Route path="/market" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><MarketPage /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><ServicesPage /></ProtectedRoute>} />
            <Route path="/food" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><FoodPage /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><ActivityPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><ProfilePage /></ProtectedRoute>} />
            <Route path="/market/create" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><CreateListingPage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><WalletPage /></ProtectedRoute>} />
            <Route path="/tournaments" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><TournamentsPage /></ProtectedRoute>} />
            <Route path="/activity/tracking" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><TrackingPage /></ProtectedRoute>} />
            <Route path="/activity/cash-exchange" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><CashExchangePage /></ProtectedRoute>} />
            <Route path="/errands" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><ErrandPage /></ProtectedRoute>} />
            <Route path="/short-term-needs" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><ShortTermNeedsPage /></ProtectedRoute>} />
            <Route path="/collaborators" element={<ProtectedRoute allowedRoles={['user', 'developer', 'ambassador']}><CollaboratorsPage /></ProtectedRoute>} />

            {/* Developer-specific route */}
            <Route path="/developer-dashboard" element={<DeveloperLayout />} />
            
            {/* Catch-all route for 404 - redirect to home or a dedicated 404 page */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </AppLayout>
        <Toaster richColors position="bottom-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;