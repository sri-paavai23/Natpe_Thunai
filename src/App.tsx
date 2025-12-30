"use client";

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import IndexPage from "./pages/Index";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ProfilePage from "./pages/Profile";
import ServicesPage from "./pages/ServicesPage";
import FreelanceSectionPage from "./pages/FreelanceSectionPage";
import ErrandsPage from "./pages/ErrandsPage";
import ShortTermPage from "./pages/ShortTermPage";
import FoodWellnessPage from "./pages/FoodWellnessPage";
import { AuthProvider } from "./context/AuthContext"; // Assuming AuthContext exists
import PrivateRoute from "./components/PrivateRoute";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import TheEditPage from "./pages/TheEditPage"; // NEW IMPORT

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/edit" element={<TheEditPage />} /> {/* Example route for TheEditPage */}
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/freelance" element={<FreelanceSectionPage />} />
              <Route path="/errands" element={<ErrandsPage />} />
              <Route path="/short-term" element={<ShortTermPage />} />
              <Route path="/food-wellness" element={<FoodWellnessPage />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;