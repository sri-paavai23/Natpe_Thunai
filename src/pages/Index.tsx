import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DiscoveryFeed from '@/components/DiscoveryFeed';
import MarketTabs from '@/components/MarketTabs';
import DailyQuestCard from '@/components/DailyQuestCard';
import LoginStreakCard from '@/components/LoginStreakCard';
import GraduationMeter from '@/components/GraduationMeter';
import ProfileWidget from '@/components/ProfileWidget';
import AnalyticsCard from '@/components/AnalyticsCard';
import DeveloperChatbox from '@/components/DeveloperChatbox';
import CanteenManagerWidget from '@/components/CanteenManagerWidget';
import BargainRequestsWidget from '@/components/BargainRequestsWidget';

const IndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth(); // Use isLoading
  const [localLoading, setLocalLoading] = useState(true); // Local loading for splash screen delay

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 1000); // Simulate splash screen for 1 second
    return () => clearTimeout(timer);
  }, []);

  if (localLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary to-secondary text-white">
        <img src="/logo.png" alt="CampusLink Logo" className="h-24 w-24 mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold">CampusLink</h1>
        <p className="text-lg mt-2">Connecting Campus Life</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Welcome to CampusLink!</h1>

      {!isAuthenticated && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">
              Join your college community to access marketplace, food, events, and more!
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/login')}>Login</Button>
              <Button variant="outline" onClick={() => navigate('/register')}>Register</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <ProfileWidget />
          <DailyQuestCard />
          <LoginStreakCard />
          <GraduationMeter />
          <AnalyticsCard />
          <BargainRequestsWidget />
          <CanteenManagerWidget />
          <DeveloperChatbox />
        </div>
      )}

      <div className="space-y-6">
        <DiscoveryFeed />
        <MarketTabs />
        {/* Add more sections as needed */}
      </div>
    </div>
  );
};

export default IndexPage;