"use client";

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import MarketPage from "@/pages/MarketPage";
import ServicesPage from "@/pages/ServicesPage";
import ActivityPage from "@/pages/ActivityPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProductDetailsPage from "@/pages/ProductDetailsPage";
import PaymentConfirmationPage from "@/pages/PaymentConfirmationPage";
import TrackingPage from "@/pages/TrackingPage";
import DeveloperDashboardPage from "@/pages/DeveloperDashboardPage";
import ProfileDetailsPage from "@/pages/ProfileDetailsPage";
import WalletPage from "@/pages/WalletPage";
import PoliciesPage from "@/pages/PoliciesPage";
import ImageToUrlHelpPage from "@/pages/ImageToUrlHelpPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import LostAndFoundPage from "@/pages/LostAndFoundPage";
import TournamentPage from "@/pages/TournamentPage";
import FreelancePage from "@/pages/FreelancePage";
import ErrandsPage from "@/pages/ErrandsPage";
import FoodWellnessPage from "@/pages/FoodWellnessPage";
import TicketBookingPage from "@/pages/TicketBookingPage";
import CollaboratorsPage from "@/pages/CollaboratorsPage";
import AmbassadorProgramPage from "@/pages/AmbassadorProgramPage";
import ShortTermNeedsPage from "@/pages/ShortTermNeedsPage";
import ServicePaymentConfirmationPage from "@/pages/ServicePaymentConfirmationPage";
import ChatPage from "@/pages/ChatPage";
import OfflinePage from "@/pages/OfflinePage"; // Import the OfflinePage
import VerificationBanner from "@/components/VerificationBanner"; // Import VerificationBanner

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { isAuthenticated, isLoading, user, userProfile } = useAuth(); // Added 'user' from useAuth
  const isDeveloper = userProfile?.role === "developer";

  // Determine if VerificationBanner should be shown
  const showVerificationBanner = isAuthenticated && !isLoading && !user?.emailVerification; // Fixed: Use user?.emailVerification

  return (
    <>
      {showVerificationBanner && <VerificationBanner />}
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/market/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/market/confirm-payment/:transactionId" element={<PaymentConfirmationPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/freelance" element={<FreelancePage />} />
          <Route path="/services/errands" element={<ErrandsPage />} />
          <Route path="/services/food-wellness" element={<FoodWellnessPage />} />
          <Route path="/services/ticket-booking" element={<TicketBookingPage />} />
          <Route path="/services/collaborators" element={<CollaboratorsPage />} />
          <Route path="/services/ambassador-program" element={<AmbassadorProgramPage />} />
          <Route path="/services/short-term" element={<ShortTermNeedsPage />} />
          <Route path="/services/confirm-payment/:transactionId" element={<ServicePaymentConfirmationPage />} />
          <Route path="/chat/:chatRoomId" element={<ChatPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/activity/lost-found" element={<LostAndFoundPage />} />
          <Route path="/activity/tracking" element={<TrackingPage />} />
          <Route path="/activity/cash-exchange" element={<ComingSoonPage />} /> {/* Placeholder for Cash Exchange */}
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/details" element={<ProfileDetailsPage />} />
          <Route path="/profile/wallet" element={<WalletPage />} />
          <Route path="/profile/policies" element={<PoliciesPage />} />
          <Route path="/profile/image-to-url-help" element={<ImageToUrlHelpPage />} />
          <Route path="/services/post-job" element={<ComingSoonPage />} /> {/* Placeholder for Post a Job */}
          {isDeveloper && (
            <Route path="/developer-dashboard" element={<DeveloperDashboardPage />} />
          )}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return <OfflinePage />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}