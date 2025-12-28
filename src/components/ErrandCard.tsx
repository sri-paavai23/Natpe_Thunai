import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, MapPin, Clock, User, Package } from 'lucide-react';
import { ErrandPost, ErrandStatus } from '@/hooks/useErrandListings';
import { Link } from 'react-router-dom';

interface ErrandCardProps {
  errand: ErrandPost;
  onAssignClick?: (errandId: string) => void;
  onCompleteClick?: (errandId: string) => void;
}

const ErrandCard: React.FC<ErrandCardProps> = ({ errand, onAssignClick, onCompleteClick }) => {
  const getStatusColor = (status: ErrandStatus) => {
    switch (status) {
      case "Open": return "bg-blue-500";
      case "Assigned": return "bg-yellow-500";
      case "Completed": return "bg-green-500";
      case "Cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="w-full max-w-sm flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {errand.title}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(errand.status)}`}>
            {errand.status}
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{errand.type} - {errand.collegeName}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-700 line-clamp-3 mb-2">{errand.description}</p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Reward: ₹{errand.reward.toFixed(2)}</p>
          {errand.location && <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Location: {errand.location}</p>}
          {errand.deadline && <p className="flex items-center gap-1"><Clock className="h-4 w-4" /> Deadline: {new Date(errand.deadline).toLocaleDateString()}</p>}
          <p className="flex items-center gap-1"><User className="h-4 w-4" /> Posted by: {errand.posterName}</p>
          {errand.assignedToName && <p className="flex items-center gap-1"><User className="h-4 w-4" /> Assigned to: {errand.assignedToName}</p>}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <Link to={`/errand/${errand.$id}`} className="flex-1">
          <Button variant="outline" className="w-full">View Details</Button>
        </Link>
        {errand.status === "Open" && onAssignClick && (
          <Button onClick={() => onAssignClick(errand.$id)} className="flex-1">
            Accept Errand
          </Button>
        )}
        {errand.status === "Assigned" && onCompleteClick && (
          <Button onClick={() => onCompleteClick(errand.$id)} className="flex-1">
            Mark as Completed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ErrandCard;