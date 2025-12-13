"use client";

import React from 'react';
import { useParams } from 'react-router-dom';

const RegisterTournamentPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId?: string }>();
  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Register for Tournament</h1>
      <p className="text-muted-foreground">This is a placeholder for tournament registration for ID: {tournamentId}.</p>
    </div>
  );
};

export default RegisterTournamentPage;