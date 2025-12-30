import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { Models } from "appwrite";
import { Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

interface CashExchangeRequest extends Models.Document {
  posterId: string;
  posterName: string;
  collegeName: string;
  type: 'buy' | 'sell'; // 'buy' means user wants to buy digital cash, 'sell' means user wants to sell digital cash
  amount: number;
  description: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface CashExchangeListingsProps {
  requests: CashExchangeRequest[];
  isLoading: boolean;
  error: string | null;
  onContact: (request: CashExchangeRequest) => void;
  onMarkCompleted: (requestId: string) => void;
  onCancel: (requestId: string) => void;
  refetch: () => void;
}

const CashExchangeListings: React.FC<CashExchangeListingsProps> = ({
  requests,
  isLoading,
  error,
  onContact,
  onMarkCompleted,
  onCancel,
  refetch,
}) => {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-center p-4">
        <p>Error loading cash exchange requests: {error}</p>
        <Button onClick={refetch} className="mt-2">Retry</Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-center text-muted-foreground p-4">No cash exchange requests found.</p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <Card key={request.$id} className="bg-card border-border-dark text-foreground">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex justify-between items-center">
              {request.type === 'buy' ? 'Wants to Buy Digital Cash' : 'Wants to Sell Digital Cash'}
              <span className={`text-sm font-normal px-2 py-1 rounded-full ${
                request.status === 'active' ? 'bg-green-500/20 text-green-400' :
                request.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {request.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-secondary-neon">₹{request.amount}</p>
            <p className="text-sm text-muted-foreground">Posted by: {request.posterName}</p>
            <p className="text-sm text-muted-foreground">College: {request.collegeName}</p>
            <p className="text-sm text-muted-foreground">{request.description}</p>
            <div className="flex gap-2 mt-4">
              {user?.$id !== request.posterId && request.status === 'active' && (
                <Button size="sm" onClick={() => onContact(request)}>
                  <MessageSquareText className="h-4 w-4 mr-2" /> Contact
                </Button>
              )}
              {user?.$id === request.posterId && request.status === 'active' && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => onMarkCompleted(request.$id)}>
                    Mark Completed
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onCancel(request.$id)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CashExchangeListings;