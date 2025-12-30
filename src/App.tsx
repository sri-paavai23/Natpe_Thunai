"use client";

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import IndexPage from "./pages/Index";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ProfilePage from "./pages/Profile";
import ServicesPage from "./pages/ServicesPage";
import FreelanceSectionPage from "./pages/FreelanceSectionPage";
import ErrandsPage from "./pages/ErrandsPage";
import ShortTermPage from "./pages/ShortTermPage";
import FoodWellnessPage from "./pages/FoodWellnessPage";
// import TicketBookingPage from "./pages/TicketBookingPage"; // This route is now replaced by TheEditPage
import CollaboratorsPage from "./pages/CollaboratorsPage";
import AmbassadorProgramPage from "./pages/AmbassadorProgramPage";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import TheEditPage from "./pages/TheEditPage"; // NEW IMPORT

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/services/freelance" element={<PrivateRoute><FreelanceSectionPage /></PrivateRoute>} />
            <Route path="/services/errands" element={<PrivateRoute><ErrandsPage /></PrivateRoute>} />
            <Route path="/services/short-term" element={<PrivateRoute><ShortTermPage /></PrivateRoute>} />
            <Route path="/services/food-wellness" element={<PrivateRoute><FoodWellnessPage /></PrivateRoute>} />
            {/* The TicketBookingPage route has been replaced by TheEditPage */}
            {/* <Route path="/services/ticket-booking" element={<PrivateRoute><TicketBookingPage /></PrivateRoute>} /> */}
            <Route path="/services/collaborators" element={<PrivateRoute><CollaboratorsPage /></PrivateRoute>} />
            <Route path="/services/ambassador-program" element={<PrivateRoute><AmbassadorProgramPage /></PrivateRoute>} />
            <Route path="/services/the-edit" element={<PrivateRoute><TheEditPage /></PrivateRoute>} /> {/* NEW ROUTE */}
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;