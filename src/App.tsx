"use client";

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import ProfilePage from './pages/ProfilePage';
import { ThemeProvider } from './components/ThemeProvider'; // Import ThemeProvider

function App() {
  return (
    <ThemeProvider> {/* Wrap the entire application with ThemeProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;