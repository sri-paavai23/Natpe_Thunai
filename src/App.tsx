import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import ServicesPage from "./pages/ServicesPage";
import ActivityPage from "./pages/ActivityPage";
import ProfilePage from "./pages/ProfilePage";
import TournamentPage from "./pages/TournamentPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import BottomNavbar from "./components/layout/BottomNavbar";
import Header from "./components/layout/Header";
import React from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import VerificationBanner from "./components/VerificationBanner";
import { useOnlineStatus } from "./hooks/useOnlineStatus";

// Import new Activity sub-pages
import TrackingPage from "./pages/TrackingPage";
import CashExchangePage from "./pages/CashExchangePage";
import LostAndFoundPage from "./pages/LostAndFoundPage";

// Import new Profile sub-pages
import ProfileDetailsPage from "./pages/ProfileDetailsPage";
import WalletPage from "./pages/WalletPage";
import PoliciesPage from "./pages/PoliciesPage";

// Import new Services sub-pages
import FreelancePage from "./pages/FreelancePage";
import ErrandsPage from "./pages/ErrandsPage";
import ShortTermNeedsPage from "./pages/ShortTermNeedsPage";
import FoodWellnessPage from "./pages/FoodWellnessPage";
import TicketBookingPage from "./pages/TicketBookingPage";
import CollaboratorsPage from "./pages/CollaboratorsPage";
import PostJobPage from "./pages/PostJobPage";
import AmbassadorProgramPage from "./pages/AmbassadorProgramPage";

// Import new Market sub-pages
import ProductDetailsPage from "./pages/ProductDetailsPage";
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";

// Import new Auth-related pages
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Import new Developer Dashboard page
import DeveloperDashboardPage from "./pages/DeveloperDashboardPage";

// Import Offline Page
import OfflinePage from "./pages/OfflinePage";

// NEW: Import ImageToUrlHelpPage
import ImageToUrlHelpPage from "./pages/ImageToUrlHelpPage";

// NEW: Import ServicePaymentConfirmationPage and ChatPage
import ServicePaymentConfirmationPage from "./pages/ServicePaymentConfirmationPage";
import ChatPage from "./pages/ChatPage";


const queryClient = new QueryClient();

const AppLayout = () => {
  const { isAuthenticated, isVerified } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {!isVerified && <VerificationBanner />}
      <div className="flex-grow">
        <Outlet />
      </div>
      <BottomNavbar />
    </div>
  );
};

const DeveloperLayout = () => {
  const { isAuthenticated, userProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated || userProfile?.role !== "developer") {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow">
        <Outlet />
      </div>
      <BottomNavbar />
    </div>
  );
};

// New component to hold all the routes when online
const OnlineRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/help/image-to-url" element={<ImageToUrlHelpPage />} />
      
      {/* Protected Routes for all authenticated users */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/market/product/:productId" element={<ProductDetailsPage />} />
        <Route path="/market/confirm-payment/:transactionId" element={<PaymentConfirmationPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tournaments" element={<TournamentPage />} />

        {/* Activity Sub-pages */}
        <Route path="/activity/tracking" element={<TrackingPage />} />
        <Route path="/activity/cash-exchange" element={<CashExchangePage />} />
        <Route path="/activity/lost-found" element={<LostAndFoundPage />} />

        {/* Profile Sub-pages */}
        <Route path="/profile/details" element={<ProfileDetailsPage />} />
        <Route path="/profile/wallet" element={<WalletPage />} />
        <Route path="/profile/policies" element={<PoliciesPage />} />

        {/* Services Sub-pages */}
        <Route path="/services/freelance" element={<FreelancePage />} />
        <Route path="/services/errands" element={<ErrandsPage />} />
        <Route path="/services/short-term" element={<ShortTermNeedsPage />} />
        <Route path="/services/food-wellness" element={<FoodWellnessPage />} />
        <Route path="/services/ticket-booking" element={<TicketBookingPage />} />
        <Route path="/services/collaborators" element={<CollaboratorsPage />} />
        <Route path="/services/post-job" element={<PostJobPage />} />
        <Route path="/services/ambassador-program" element={<AmbassadorProgramPage />} />
        <Route path="/services/confirm-payment/:transactionId" element={<ServicePaymentConfirmationPage />} /> {/* NEW */}
        <Route path="/chat/:chatRoomId" element={<ChatPage />} /> {/* NEW */}
      </Route>

      {/* Protected Routes for Developers Only */}
      <Route element={<DeveloperLayout />}>
        <Route path="/developer-dashboard" element={<DeveloperDashboardPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const isOnline = useOnlineStatus(); // Call hook unconditionally at the top level of App

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {isOnline ? <OnlineRoutes /> : <OfflinePage />}
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;