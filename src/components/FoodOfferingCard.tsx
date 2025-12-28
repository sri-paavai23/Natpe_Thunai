import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Utensils, HeartPulse } from 'lucide-react';
import { FoodOffering, FoodCategory } from '@/hooks/useCanteenData'; // Import FoodCategory
import PlaceFoodOrderForm from '@/components/forms/PlaceFoodOrderForm'; // Assuming this exists

interface FoodOfferingCardProps {
  offering: FoodOffering;
  onOrderClick: (offering: FoodOffering) => void;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering, onOrderClick }) => {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const Icon = offering.category === "Meals" ? Utensils : HeartPulse; // Use correct FoodCategory

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" /> {offering.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{offering.canteenName} - {offering.category}</p>
      </CardHeader>
      <CardContent>
        {offering.imageUrl && (
          <img src={offering.imageUrl} alt={offering.name} className="w-full h-32 object-cover rounded-md mb-2" />
        )}
        <p className="text-sm text-gray-700 line-clamp-3 mb-2">{offering.description}</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-lg font-semibold text-primary">
            <DollarSign className="h-4 w-4 mr-1" /> {offering.price.toFixed(2)}
          </span>
          <span className={`text-sm font-medium ${offering.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {offering.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onOrderClick(offering)}
          disabled={!offering.isAvailable}
          className="w-full"
        >
          Order Now
        </Button>
      </CardFooter>

      {isOrderDialogOpen && (
        <PlaceFoodOrderForm
          offering={offering}
          onOrderPlaced={() => setIsOrderDialogOpen(false)}
          onCancel={() => setIsOrderDialogOpen(false)}
        />
      )}
    </Card>
  );
};

export default FoodOfferingCard;