"use client";

import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const AdminReportsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Admin Reports</h1>
      <p className="text-muted-foreground">This is the Admin Reports Page. Content coming soon!</p>
      <MadeWithDyad />
    </div>
  );
};

export default AdminReportsPage;