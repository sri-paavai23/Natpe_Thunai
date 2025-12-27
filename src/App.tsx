"use client";

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ProfileDetailsPage from './pages/ProfileDetailsPage';
import WalletPage from './pages/WalletPage';
import MarketPage from './pages/MarketPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import ServicesPage from './pages/ServicesPage';
import FreelancePage from './pages/FreelancePage';
import ErrandsPage from './pages/ErrandsPage';
import ShortTermNeedsPage from './pages/ShortTermNeedsPage';
import FoodWellnessPage from './pages/FoodWellnessPage';
import TicketBookingPage from './pages/TicketBookingPage';
import CollaboratorsPage from './pages/CollaboratorsPage';
import AmbassadorProgramPage from './pages/AmbassadorProgramPage';
import ActivityPage from './pages/ActivityPage';
import LostAndFoundPage from './pages/LostAndFoundPage';
import TrackingPage from './pages/TrackingPage';
import TournamentPage from './pages/TournamentPage';
import ImageToUrlHelpPage from './pages/ImageToUrlHelpPage';
import PoliciesPage from './pages/PoliciesPage';
import DeveloperDashboardPage from './pages/DeveloperDashboardPage';
import PostJobPage from './pages/PostJobPage';
import ServicePaymentConfirmationPage from './pages/ServicePaymentConfirmationPage';
import ChatPage from './pages/ChatPage';
import ComingSoonPage from './pages/ComingSoonPage';
import OfflinePage from './pages/OfflinePage';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <OfflinePage />;
  }

  return (
    <AuthProvider> {/* Wrap the entire application with AuthProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/details" element={<ProfileDetailsPage />} />
          <Route path="/profile/wallet" element={<WalletPage />} />
          <Route path="/profile/policies" element={<PoliciesPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/market/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/market/confirm-payment/:transactionId" element={<PaymentConfirmationPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/freelance" element={<FreelancePage />} />
          <Route path="/services/errands" element={<ErrandsPage />} />
          <Route path="/services/short-term" element={<ShortTermNeedsPage />} />
          <Route path="/services/food-wellness" element={<FoodWellnessPage />} />
          <Route path="/services/ticket-booking" element={<TicketBookingPage />} />
          <Route path="/services/collaborators" element={<CollaboratorsPage />} />
          <Route path="/services/ambassador-program" element={<AmbassadorProgramPage />} />
          <Route path="/services/post-job" element={<PostJobPage />} />
          <Route path="/services/confirm-payment/:transactionId" element={<ServicePaymentConfirmationPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/activity/lost-found" element={<LostAndFoundPage />} />
          <Route path="/activity/tracking" element={<TrackingPage />} />
          <Route path="/activity/cash-exchange" element={<ComingSoonPage />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/image-to-url-help" element={<ImageToUrlHelpPage />} />
          <Route path="/developer-dashboard" element={<DeveloperDashboardPage />} />
          <Route path="/chat/:chatRoomId" element={<ChatPage />} />
          <Route path="/coming-soon/:featureName" element={<ComingSoonPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;