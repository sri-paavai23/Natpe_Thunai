import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const ServicePaymentConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (location.state && location.state.paymentDetails) {
      setPaymentDetails(location.state.paymentDetails);
      // Simulate API call to confirm payment
      setTimeout(() => {
        // In a real app, you'd verify payment with backend
        const success = Math.random() > 0.2; // 80% chance of success
        setPaymentStatus(success ? 'success' : 'failed');
        if (success) {
          toast.success("Service payment confirmed!");
          // Further actions like updating service status to 'booked' would go here
        } else {
          toast.error("Service payment failed.");
        }
      }, 2000);
    } else {
      toast.error("No payment details found. Redirecting to services.");
      navigate('/freelance');
    }
  }, [location.state, navigate]);

  if (!paymentDetails) {
    return <div className="text-center py-8">Loading payment details...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl text-center">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">
            {paymentStatus === 'processing' && "Processing Payment..."}
            {paymentStatus === 'success' && "Payment Successful!"}
            {paymentStatus === 'failed' && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentStatus === 'processing' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
          )}
          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg text-muted-foreground">Your payment for "{paymentDetails.serviceTitle}" has been successfully processed.</p>
              <p className="text-2xl font-bold text-primary">₹{paymentDetails.amount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Transaction ID: {paymentDetails.transactionId || 'N/A'}</p>
            </div>
          )}
          {paymentStatus === 'failed' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-lg text-muted-foreground">Unfortunately, your payment could not be processed.</p>
              <p className="text-sm text-muted-foreground">Please try again or contact support if the issue persists.</p>
            </div>
          )}

          <Button onClick={() => navigate('/freelance')} className="mt-8">
            Back to Services
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicePaymentConfirmationPage;