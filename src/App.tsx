"use client";

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';
import IndexPage from '@/pages/Index';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<IndexPage />} />
        {/* Add other routes here as your application grows */}
      </Routes>
      <Toaster />
    </>
  );
}

export default App;