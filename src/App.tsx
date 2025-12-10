"use client";

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import MarketPage from "./pages/MarketPage";
import ServicesPage from "./pages/ServicesPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import ErrandDetailsPage from "./pages/ErrandDetailsPage";
import ShortTermDetailsPage from "./pages/ShortTermDetailsPage";
import FoodWellnessDetailsPage from "./pages/FoodWellnessDetailsPage";
import AmbassadorProgramPage from "./pages/AmbassadorProgramPage";
import FreelancePage from "./pages/FreelancePage";
import ShortTermNeedsPage from "./pages/ShortTermNeedsPage";
import FoodWellnessPage from "./pages/FoodWellnessPage";
import ErrandsPage from "./pages/ErrandsPage";
import TournamentsPage from "./pages/TournamentsPage"; // NEW: Import TournamentsPage
import NotFoundPage from "./pages/NotFoundPage";
import BottomNavbar from "./components/BottomNavbar";
import TopNavbar from "./components/TopNavbar";
import { Toaster } from "@/components/ui/sonner";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";
import PoliciesPage from "./pages/PoliciesPage";
import ChatPage from "./pages/ChatPage";
import ChatRoomPage from "./pages/ChatRoomPage";
import BargainRequestsPage from "./pages/BargainRequestsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminTransactionsPage from "./pages/AdminTransactionsPage";
import AdminErrandsPage from "./pages/AdminErrandsPage";
import AdminServicesPage from "./pages/AdminServicesPage";
import AdminFoodWellnessPage from "./pages/AdminFoodWellnessPage";
import AdminTournamentsPage from "./pages/AdminTournamentsPage"; // NEW: Import AdminTournamentsPage

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { isAuthenticated, isLoading, userProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      {isAuthenticated && <TopNavbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile/policies" element={<PoliciesPage />} />

          {isAuthenticated ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/market/:productId" element={<ProductDetailsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/freelance" element={<FreelancePage />} />
              <Route path="/services/freelance/:serviceId" element={<ServiceDetailsPage />} />
              <Route path="/services/short-term" element={<ShortTermNeedsPage />} />
              <Route path="/services/short-term/:serviceId" element={<ShortTermDetailsPage />} />
              <Route path="/services/food-wellness" element={<FoodWellnessPage />} />
              <Route path="/services/food-wellness/:offeringId" element={<FoodWellnessDetailsPage />} />
              <Route path="/services/errands" element={<ErrandsPage />} />
              <Route path="/services/errands/:errandId" element={<ErrandDetailsPage />} />
              <Route path="/services/ambassador-program" element={<AmbassadorProgramPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} /> {/* NEW: Tournaments Page */}
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/market/confirm-payment/:transactionId" element={<PaymentConfirmationPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:chatRoomId" element={<ChatRoomPage />} />
              <Route path="/bargain-requests" element={<BargainRequestsPage />} />

              {/* Admin Routes */}
              {userProfile?.role === "developer" && (
                <>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/listings" element={<AdminListingsPage />} />
                  <Route path="/admin/reports" element={<AdminReportsPage />} />
                  <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                  <Route path="/admin/errands" element={<AdminErrandsPage />} />
                  <Route path="/admin/services" element={<AdminServicesPage />} />
                  <Route path="/admin/food-wellness" element={<AdminFoodWellnessPage />} />
                  <Route path="/admin/tournaments" element={<AdminTournamentsPage />} /> {/* NEW: Admin Tournaments Page */}
                </>
              )}
            </>
          ) : (
            <Route path="*" element={<AuthPage />} />
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {isAuthenticated && <BottomNavbar />}
      <Toaster richColors />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;