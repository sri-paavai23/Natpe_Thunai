"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the Index page after authentication
    navigate('/');
  }, [navigate]);

  return (
    <div>
      <h1>Auth Page</h1>
    </div>
  );
};

export default Auth;