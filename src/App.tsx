"use client";

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import PostListingPage from './pages/PostListingPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import SettingsPage from './pages/SettingsPage';
import VerificationPage from './pages/VerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import FAQPage from './pages/FAQPage';
import SupportPage from './pages/SupportPage';
import ChatPage from './pages/ChatPage';
import ServicesPage from './pages/ServicesPage';
import ErrandsPage from './pages/ErrandsPage';
import ShortTermNeedsPage from './pages/ShortTermNeedsPage';
import FoodWellnessPage from './pages/FoodWellnessPage';
import TicketBookingPage from './pages/TicketBookingPage';
import CollaboratorsPage from './pages/CollaboratorsPage';
import AmbassadorProgramPage from './pages/AmbassadorProgramPage';
import FreelancePage from './pages/FreelancePage';
import PostServicePage from './pages/PostServicePage';
import ServiceDetailsPage from './pages/ServiceDetailsPage';
import ConfirmPaymentPage from './pages/ConfirmPaymentPage';
import TournamentPage from './pages/TournamentPage';
import PostTournamentPage from './pages/PostTournamentPage';
import TournamentDetailsPage from './pages/TournamentDetailsPage';
import RegisterTournamentPage from './pages/RegisterTournamentPage';
import TournamentStandingsPage from './pages/TournamentStandingsPage';
import BottomNavbar from './components/BottomNavbar'; // Import the new BottomNavbar
import { BargainProvider } from './context/BargainContext'; // Import BargainProvider

// A component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Main App component with routing
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Loading application...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScrollToTop />
      <Toaster richColors position="top-center" />
      
      {/* Main content area, adjusted for bottom navbar */}
      <main className="flex-grow pb-16 md:pb-0"> {/* Added pb-16 for mobile, pb-0 for larger screens */}
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile/policies" element={<PrivacyPolicyPage />} />
          <Route path="/profile/terms" element={<TermsAndConditionsPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* Authenticated Routes */}
          {isAuthenticated ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/market/post" element={<PostListingPage />} />
              <Route path="/market/product/:productId" element={<ProductDetailsPage />} />
              <Route path="/market/confirm-payment/:transactionId" element={<ConfirmPaymentPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/profile/settings" element={<SettingsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:chatId" element={<ChatPage />} /> {/* Route for specific chat */}
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/errands" element={<ErrandsPage />} />
              <Route path="/services/short-term" element={<ShortTermNeedsPage />} />
              <Route path="/services/food-wellness" element={<FoodWellnessPage />} />
              <Route path="/services/ticket-booking" element={<TicketBookingPage />} />
              <Route path="/services/collaborators" element={<CollaboratorsPage />} />
              <Route path="/services/ambassador-program" element={<AmbassadorProgramPage />} />
              <Route path="/services/freelance" element={<FreelancePage />} />
              <Route path="/services/post" element={<PostServicePage />} />
              <Route path="/services/details/:serviceId" element={<ServiceDetailsPage />} />
              <Route path="/tournaments" element={<TournamentPage />} />
              <Route path="/tournaments/post" element={<PostTournamentPage />} />
              <Route path="/tournaments/:tournamentId" element={<TournamentDetailsPage />} />
              <Route path="/tournaments/:tournamentId/register" element={<RegisterTournamentPage />} />
              <Route path="/tournaments/:tournamentId/standings" element={<TournamentStandingsPage />} />
            </>
          ) : (
            // Redirect unauthenticated users to auth page for protected routes
            <Route path="*" element={<AuthPage />} />
          )}

          {/* Catch-all for 404 - only if not authenticated, otherwise handled by protected routes */}
          {!isAuthenticated && <Route path="*" element={<NotFoundPage />} />}
        </Routes>
      </main>

      {/* Render BottomNavbar only on mobile and if authenticated */}
      {isAuthenticated && <BottomNavbar />}
    </div>
  );
}

// Wrap App with AuthProvider and BargainProvider
const AppWrapper = () => (
  <Router>
    <AuthProvider>
      <BargainProvider>
        <App />
      </BargainProvider>
    </AuthProvider>
  </Router>
);

export default AppWrapper;