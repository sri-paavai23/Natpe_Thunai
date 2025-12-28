"use client";

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import AuthPage from './AuthPage';
import HomePage from './HomePage';
import MarketPage from './MarketPage';
import ProfilePage from './ProfilePage';
import ServicesPage from './ServicesPage';

const Auth = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </Layout>
  );
};

export default Auth;