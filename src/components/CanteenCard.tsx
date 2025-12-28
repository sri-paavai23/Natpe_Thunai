import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Phone, Utensils } from 'lucide-react';
import { CanteenData } from '@/hooks/useCanteenData';

interface CanteenCardProps {
  canteen: CanteenData;
}

const CanteenCard: React.FC<CanteenCardProps> = ({ canteen }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="h-5 w-5 text-primary" /> {canteen.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{canteen.collegeName}</p>
      </CardHeader>
      <CardContent>
        {canteen.imageUrl && (
          <img src={canteen.imageUrl} alt={canteen.name} className="w-full h-32 object-cover rounded-md mb-2" />
        )}
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {canteen.location}</p>
          <p className="flex items-center gap-1"><Clock className="h-4 w-4" /> {canteen.openingTime} - {canteen.closingTime}</p>
          <p className="flex items-center gap-1"><Phone className="h-4 w-4" /> {canteen.contactInfo}</p>
        </div>
        <p className={`mt-2 text-sm font-medium ${canteen.isOperational ? 'text-green-600' : 'text-red-600'}`}>
          {canteen.isOperational ? 'Open Now' : 'Closed'}
        </p>
      </CardContent>
      <div className="p-4 pt-0">
        <Button className="w-full" disabled={!canteen.isOperational}>View Menu</Button>
      </div>
    </Card>
  );
};

export default CanteenCard;