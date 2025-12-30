"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IndexPage = () => {
  const { user, userProfile, isVerified, loading, logout, addXp, updateUserProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark text-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleAddXp = async () => {
    await addXp(10); // Example: Add 10 XP
  };

  const handleUpdateProfile = async () => {
    await updateUserProfile({ firstName: "Updated", lastName: "User" }); // Corrected call
  };

  const handleIncrementDeliveries = async () => {
    await incrementAmbassadorDeliveriesCount();
  };

  return (
    <div className="min-h-screen bg-background-dark text-foreground p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Natpe🤝Thunai</h1>
      <div className="max-w-2xl mx-auto bg-card p-6 rounded-lg shadow-lg border border-border-dark space-y-4">
        <p className="text-lg">Hello, {userProfile?.firstName || user.name}!</p>
        <p>Your email: {user.email}</p>
        <p>College ID Verified: {isVerified ? 'Yes' : 'No'}</p>
        <p>XP: {userProfile?.xp || 0}</p>
        <p>Level: {userProfile?.level || 1}</p>
        {userProfile?.userType === 'ambassador' && (
          <p>Ambassador Deliveries: {userProfile?.ambassadorDeliveriesCount || 0}</p>
        )}

        <div className="flex flex-wrap gap-4 mt-6">
          <Button onClick={handleAddXp}>Add 10 XP</Button>
          <Button onClick={handleUpdateProfile}>Update Profile Name</Button>
          {userProfile?.userType === 'ambassador' && (
            <Button onClick={handleIncrementDeliveries}>Increment Deliveries</Button>
          )}
          <Button variant="destructive" onClick={logout}>Logout</Button>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;