"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header"; // Assuming a Header component might exist or be created later

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        {/* <Header /> */} {/* Uncomment if you have a Header component */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;