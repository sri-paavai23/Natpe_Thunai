"use client";

import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* Header content goes here */}
      <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
    </header>
  );
};

export default Header;