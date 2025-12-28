import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import IndexPage from './pages/Index';
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import PostProductPage from './pages/PostProductPage';
import FoodWellnessPage from './pages/FoodWellnessPage';
import ErrandsPage from './pages/ErrandsPage';
import FreelancePage from './pages/FreelancePage';
import CollaboratorsPage from './pages/CollaboratorsPage';
import ProfileDetailsPage from './pages/ProfileDetailsPage';
import SettingsPage from './pages/SettingsPage';
import TrackingPage from './pages/TrackingPage';
import TournamentPage from './pages/TournamentPage';
import LostAndFoundPage from './pages/LostAndFoundPage';
import CashExchangePage from './pages/CashExchangePage';
import AmbassadorProgramPage from './pages/AmbassadorProgramPage';
import DeveloperDashboardPage from './pages/DeveloperDashboardPage';
import ServicePaymentConfirmationPage from './pages/ServicePaymentConfirmationPage';
import ChatPage from './pages/ChatPage';
import PostJobPage from './pages/PostJobPage';
import ShortTermNeedsPage from './pages/ShortTermNeedsPage'; // Assuming this is the new name for PostANeedPage

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading authentication...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const DeveloperLayout = () => {
  const { isAuthenticated, userProfile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading user profile...</div>;
  }

  return isAuthenticated && userProfile?.isDeveloper ? <Outlet /> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<IndexPage />} />

              {/* Protected Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/market" element={<MarketplacePage />} />
                <Route path="/market/:productId" element={<ProductDetailsPage />} />
                <Route path="/post-product" element={<PostProductPage />} />
                <Route path="/food-wellness" element={<FoodWellnessPage />} />
                <Route path="/errands" element={<ErrandsPage />} />
                <Route path="/freelance" element={<FreelancePage />} />
                <Route path="/collaborators" element={<CollaboratorsPage />} />
                <Route path="/profile" element={<ProfileDetailsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/tracking/:orderId" element={<TrackingPage />} />
                <Route path="/tournaments" element={<TournamentPage />} />
                <Route path="/lost-found" element={<LostAndFoundPage />} />
                <Route path="/cash-exchange" element={<CashExchangePage />} />
                <Route path="/ambassador" element={<AmbassadorProgramPage />} />
                <Route path="/payment-confirmation" element={<ServicePaymentConfirmationPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:roomId" element={<ChatPage />} />
                <Route path="/post-job" element={<PostJobPage />} />
                <Route path="/short-term-needs" element={<ShortTermNeedsPage />} />
              </Route>

              {/* Developer Protected Routes */}
              <Route element={<DeveloperLayout />}>
                <Route path="/developer" element={<DeveloperDashboardPage />} />
              </Route>

              {/* Catch-all for 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;