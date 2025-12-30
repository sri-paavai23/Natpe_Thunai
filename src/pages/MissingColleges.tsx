"use client";

import React from 'react';

const MissingColleges: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Missing Colleges</h1>
      <p className="text-muted-foreground">Report colleges that are not in our list.</p>
    </div>
  );
};

export default MissingColleges;