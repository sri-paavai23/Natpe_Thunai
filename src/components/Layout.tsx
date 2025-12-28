"use client";

import React from 'react';

const Layout = ({ children }: any) => {
  return (
    <div>
      <nav>
        <ul>
          <li>Home</li>
          <li>Market</li>
          <li>Profile</li>
          <li>Services</li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  );
};

export default Layout;