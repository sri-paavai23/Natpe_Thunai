import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import React from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { ThemeProvider } from "@/components/theme-provider";
import useOneSignal from "@/hooks/useOneSignal"; // Ensure this path matches your file structure

// --- Page Imports ---
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import ServicesPage from "./pages/ServicesPage";
import ActivityPage from "./pages/ActivityPage";
import ProfilePage from "./pages/ProfilePage";
import TournamentPage from "./pages/TournamentPage";
import BottomNavbar from "./components/layout/BottomNavbar";
import Header from "./components/layout/Header";
import VerificationBanner from "./components/VerificationBanner";

// Sub-pages imports
import TrackingPage from "./pages/TrackingPage";
import CashExchangePage from "./pages/CashExchangePage";
import LostAndFoundPage from "./pages/LostAndFoundPage";
import ProfileDetailsPage from "./pages/ProfileDetailsPage";
import WalletPage from "./pages/WalletPage";
import PoliciesPage from "./pages/PoliciesPage";
import FreelancePage from "./pages/FreelancePage";
import ErrandsPage from "./pages/ErrandsPage";
import ShortTermNeedsPage from "./pages/ShortTermNeedsPage";
import FoodWellnessPage from "./pages/FoodWellnessPage";
import TheEditPage from "./pages/TheEditPage";
import CollaboratorsPage from "./pages/CollaboratorsPage";
import PostJobPage from "./pages/PostJobPage";
import AmbassadorProgramPage from "./pages/AmbassadorProgramPage";
import ProductDetailsPage from "./pages/ProductDetailsPage"; 
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DeveloperDashboardPage from "./pages/DeveloperDashboardPage";
import ImageToUrlHelpPage from "./pages/ImageToUrlHelpPage";
import ServicePaymentConfirmationPage from "./pages/ServicePaymentConfirmationPage";
import ChatPage from "./pages/ChatPage";
import EscrowPayment from "./pages/EscrowPayment";

// Import the Offline Game Page
import OfflinePage from "./pages/OfflinePage";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { isAuthenticated, isVerified } = useAuth();

  // --- ACTIVATE PUSH NOTIFICATIONS HERE ---
  // This hooks into the OneSignal plugin to get the Token for Appwrite
  // Placing it here ensures it only runs when a user session exists.
  useOneSignal(); 

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

const OnlineRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/help/image-to-url" element={<ImageToUrlHelpPage />} />
      
      {/* Standalone Payment Route (No Bottom Nav) */}
      <Route path="/escrow-payment" element={<EscrowPayment />} />
      
      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomePage />} />
        
        {/* MARKET & PRODUCTS */}
        <Route path="/market" element={<MarketPage />} />
        <Route path="/market/:productId" element={<ProductDetailsPage />} />
        <Route path="/market/confirm-payment/:transactionId" element={<PaymentConfirmationPage />} />
        
        {/* SERVICES */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/freelance" element={<FreelancePage />} />
        <Route path="/services/errands" element={<ErrandsPage />} />
        <Route path="/services/short-term" element={<ShortTermNeedsPage />} />
        <Route path="/services/food-wellness" element={<FoodWellnessPage />} />
        <Route path="/services/the-edit" element={<TheEditPage />} />
        <Route path="/services/collaborators" element={<CollaboratorsPage />} />
        <Route path="/services/post-job" element={<PostJobPage />} />
        <Route path="/services/ambassador-program" element={<AmbassadorProgramPage />} />
        <Route path="/services/confirm-payment/:transactionId" element={<ServicePaymentConfirmationPage />} />
        
        {/* ACTIVITY & CHAT */}
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/activity/tracking" element={<TrackingPage />} />
        <Route path="/activity/cash-exchange" element={<CashExchangePage />} />
        <Route path="/activity/lost-found" element={<LostAndFoundPage />} />
        <Route path="/chat/:chatRoomId" element={<ChatPage />} />
        
        {/* PROFILE */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/details" element={<ProfileDetailsPage />} />
        <Route path="/profile/wallet" element={<WalletPage />} />
        <Route path="/profile/policies" element={<PoliciesPage />} />
        
        {/* TOURNAMENTS */}
        <Route path="/tournaments" element={<TournamentPage />} />

        {/* Global Access to Tracking */}
        <Route path="/tracking" element={<TrackingPage />} />
        
      </Route>

      <Route element={<DeveloperLayout />}>
        <Route path="/developer-dashboard" element={<DeveloperDashboardPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const isOnline = useOnlineStatus();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              {/* If online: Show App Routes. If offline: Show Cosmic Dash Game. */}
              {isOnline ? <OnlineRoutes /> : <OfflinePage />}
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;