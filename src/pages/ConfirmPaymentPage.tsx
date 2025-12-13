"use client";

import React from 'react';
import { useParams } from 'react-router-dom';

const ConfirmPaymentPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId?: string }>();
  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Confirm Payment</h1>
      <p className="text-muted-foreground">This is a placeholder for the payment confirmation page for transaction ID: {transactionId}.</p>
    </div>
  );
};

export default ConfirmPaymentPage;