import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, MapPin, User, Star, MessageSquareText, Clock } from 'lucide-react'; // Import Clock
import { ServicePost, ServiceStatus } from '@/hooks/useServiceListings';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useServiceReviews } from '@/hooks/useServiceReviews';

interface ServiceCardProps {
  service: ServicePost;
  onOpenBargainDialog?: (service: ServicePost) => void;
  onOpenReviewDialog?: (serviceId: string, providerId: string, serviceTitle: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onOpenBargainDialog, onOpenReviewDialog }) => {
  const { user } = useAuth();
  const { reviews: serviceReviews, isLoading: isReviewsLoading } = useServiceReviews(service.$id);

  const averageRating = serviceReviews.length > 0
    ? (serviceReviews.reduce((sum, review) => sum + review.rating, 0) / serviceReviews.length)
    : 0;

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case "Available": return "bg-green-500";
      case "Booked": return "bg-yellow-500";
      case "Completed": return "bg-blue-500";
      case "Cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleContactProvider = () => {
    if (!user) {
      toast.error("You must be logged in to contact the provider.");
      return;
    }
    if (user.$id === service.providerId) {
      toast.message("You are the provider of this service.");
      return;
    }
    // In a real app, this would open a chat or contact form
    toast.success(`Contacting ${service.providerName} at ${service.contactInfo}`);
  };

  return (
    <Card className="w-full max-w-sm flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">{service.title}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(service.status)}`}>
            {service.status}
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{service.category} - {service.collegeName}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        {service.imageUrl && (
          <img src={service.imageUrl} alt={service.title} className="w-full h-32 object-cover rounded-md mb-2" />
        )}
        <p className="text-sm text-gray-700 line-clamp-3 mb-2">{service.description}</p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Price: ₹{service.price.toFixed(2)} / {service.priceUnit}</p>
          {service.location && <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Location: {service.location}</p>}
          <p className="flex items-center gap-1"><User className="h-4 w-4" /> Provided by: {service.providerName}</p>
          <p className="flex items-center gap-1"><Clock className="h-4 w-4" /> Posted: {new Date(service.$createdAt).toLocaleDateString()}</p>
          {service.isCustomOrder && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              Custom Request
            </Badge>
          )}
          {!isReviewsLoading && serviceReviews.length > 0 && (
            <p className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4" fill="currentColor" /> {averageRating.toFixed(1)} ({serviceReviews.length} reviews)
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <Link to={`/service/${service.$id}`} className="flex-1">
          <Button variant="outline" className="w-full">View Details</Button>
        </Link>
        {service.status === "Available" && user?.$id !== service.providerId && (
          <Button onClick={handleContactProvider} className="flex-1">
            <MessageSquareText className="h-4 w-4 mr-1" /> Contact Provider
          </Button>
        )}
        {service.status === "Available" && user?.$id !== service.providerId && onOpenBargainDialog && (
          <Button
            variant="secondary"
            onClick={() => onOpenBargainDialog(service)}
            disabled={user?.$id === service.providerId}
          >
            Make an Offer
          </Button>
        )}
        {service.status === "Completed" && user?.$id !== service.providerId && onOpenReviewDialog && (
          <Button
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
            onClick={() => onOpenReviewDialog(service.$id, service.providerId, service.title)}
            disabled={user?.$id === service.providerId}
          >
            Leave Review
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;