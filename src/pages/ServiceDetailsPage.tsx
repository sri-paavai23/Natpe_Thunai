"use client";

import React from 'react';
import { useParams } from 'react-router-dom';

const ServiceDetailsPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId?: string }>();
  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Service Details</h1>
      <p className="text-muted-foreground">This is a placeholder for service details with ID: {serviceId}.</p>
    </div>
  );
};

export default ServiceDetailsPage;