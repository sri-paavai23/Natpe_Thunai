import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServicePost } from '@/hooks/useServiceListings';
import { Link } from 'react-router-dom';
import { MessageSquareText, DollarSign, Ban, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBargainRequests } from '@/hooks/useBargainRequests';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ServicePaymentDialog from './forms/ServicePaymentDialog';
import BargainServiceDialog from './forms/BargainServiceDialog';
import { toast } from 'sonner';

interface ServiceListingCardProps {
  service: ServicePost;
  onContact: (service: ServicePost) => void;
  onDeveloperDelete?: (serviceId: string) => Promise<void>;
}

const ServiceListingCard: React.FC<ServiceListingCardProps> = ({ service, onContact, onDeveloperDelete }) => {
  const { user, userProfile } = useAuth();
  const { sendBargainRequest, getBargainStatusForProduct } = useBargainRequests();
  const { status: currentBargainStatus, requestId: currentBargainRequestId } = getBargainStatusForProduct(service.$id); // Corrected property access

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isBargainDialogOpen, setIsBargainDialogOpen] = useState(false);

  const isMyService = user?.$id === service.posterId;
  const isDeveloper = userProfile?.role === 'developer';

  const handleBargainClick = () => {
    if (!user) {
      toast.error("You need to be logged in to send a bargain request.");
      return;
    }
    if (isMyService) {
      toast.info("You cannot send a bargain request for your own service.");
      return;
    }
    if (currentBargainStatus === 'pending') {
      toast.info("You already have a pending bargain request for this service.");
      return;
    }
    if (currentBargainStatus === 'rejected') { // Changed 'denied' to 'rejected'
      toast.info("Your previous bargain request was rejected.");
      return;
    }
    setIsBargainDialogOpen(true);
  };

  const handleSendBargain = async (requestedAmount: number) => {
    // The `sendBargainRequest` expects a `Product` type, but we're using it for services.
    // This might need a more generic `Listing` type or a separate `sendBargainRequestForService`.
    // For now, we'll cast `service` to `Product` and ensure it has the necessary fields.
    const productLikeService: Product = {
      ...service,
      userId: service.posterId,
      sellerId: service.posterId,
      sellerName: service.posterName,
      sellerUpiId: service.contact, // Assuming contact is UPI ID
      sellerRating: 0, // Placeholder
      location: userProfile?.collegeName || '', // Placeholder
      type: 'sell', // Assuming services are 'sell' type for bargain purposes
      servedCollegeIds: [service.collegeName], // Assuming service is for one college
    };
    await sendBargainRequest(productLikeService, requestedAmount);
    setIsBargainDialogOpen(false);
  };

  const canBargain = service.price > 0 && !isMyService && service.status === 'active' &&
    currentBargainStatus !== 'pending' &&
    currentBargainStatus !== 'rejected'; // Changed 'denied' to 'rejected'

  const canPurchase = service.status === 'active' && !isMyService;

  return (
    <Card className="bg-card border-border-dark text-foreground flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{service.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{service.collegeName} - {service.category}</p>
      </CardHeader>
      <CardContent className="flex-1">
        {service.imageUrl && (
          <img src={service.imageUrl} alt={service.title} className="w-full h-40 object-cover rounded-md mb-3" />
        )}
        <p className="text-xl font-bold text-secondary-neon">₹{service.price}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
        <p className="text-xs text-muted-foreground mt-2">Posted by: {service.posterName}</p>
        <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{service.status}</span></p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <div className="flex gap-2">
          {canPurchase && (
            <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" /> Purchase
            </Button>
          )}
          {canBargain && (
            <Button size="sm" variant="outline" onClick={handleBargainClick}>
              <DollarSign className="h-4 w-4 mr-2" /> Bargain
            </Button>
          )}
          {currentBargainStatus === 'pending' && (
            <Button size="sm" variant="outline" disabled>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Pending...
            </Button>
          )}
          {currentBargainStatus === 'rejected' && ( // Changed 'denied' to 'rejected'
            <Button size="sm" variant="outline" disabled>
              <Ban className="mr-2 h-3 w-3" /> Bargain Rejected
            </Button>
          )}
          {!isMyService && (
            <Button size="sm" variant="secondary" onClick={() => onContact(service)}>
              <MessageSquareText className="h-4 w-4 mr-2" /> Contact
            </Button>
          )}
        </div>
        {isDeveloper && onDeveloperDelete && (
          <Button variant="destructive" size="sm" onClick={() => onDeveloperDelete(service.$id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border-dark">
          <DialogHeader>
            <DialogTitle>Purchase Service: {service.title}</DialogTitle>
          </DialogHeader>
          <ServicePaymentDialog service={service} onClose={() => setIsPaymentDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isBargainDialogOpen} onOpenChange={setIsBargainDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border-dark">
          <DialogHeader>
            <DialogTitle>Bargain for Service: {service.title}</DialogTitle>
          </DialogHeader>
          <BargainServiceDialog service={service} onSubmit={handleSendBargain} onClose={() => setIsBargainDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ServiceListingCard;