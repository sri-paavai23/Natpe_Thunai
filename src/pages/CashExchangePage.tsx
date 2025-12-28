import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { DollarSign, ArrowRightLeft, Users } from 'lucide-react';
import PostCashExchangeForm from '@/components/forms/PostCashExchangeForm'; // Assuming this component exists
import { toast } from 'sonner';

const CashExchangePage = () => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"requests" | "offers" | "group-contributions">("requests");
  const [isPostExchangeDialogOpen, setIsPostExchangeDialogOpen] = useState(false);

  const handlePostExchangeSuccess = () => {
    setIsPostExchangeDialogOpen(false);
    toast.success("Cash exchange listing posted successfully!");
    // Optionally refetch listings here
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Cash Exchange</h1>

      <div className="flex justify-end mb-4">
        <Dialog open={isPostExchangeDialogOpen} onOpenChange={setIsPostExchangeDialogOpen}>
          <DialogTrigger asChild>
            <Button>Post New Exchange</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Post a Cash Exchange Request/Offer</DialogTitle>
              <DialogDescription>
                Specify the amount and type of exchange you're looking for.
              </DialogDescription>
            </DialogHeader>
            <PostCashExchangeForm onSuccess={handlePostExchangeSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "requests" | "offers" | "group-contributions")} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">
            <ArrowRightLeft className="h-4 w-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="offers">
            <DollarSign className="h-4 w-4 mr-2" /> Offers
          </TabsTrigger>
          <TabsTrigger value="group-contributions">
            <Users className="h-4 w-4 mr-2" /> Group Contributions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Exchange Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Display list of cash exchange requests here.</p>
              {/* Placeholder for requests list */}
              <div className="space-y-4 mt-4">
                {/* Example Request Card */}
                <Card className="p-4">
                  <h3 className="font-semibold">Request: ₹500 for UPI</h3>
                  <p className="text-sm text-muted-foreground">Posted by John Doe from {userProfile?.collegeName}</p>
                  <Button size="sm" className="mt-2">View Details</Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Exchange Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Display list of cash exchange offers here.</p>
              {/* Placeholder for offers list */}
              <div className="space-y-4 mt-4">
                {/* Example Offer Card */}
                <Card className="p-4">
                  <h3 className="font-semibold">Offer: ₹1000 via Cash</h3>
                  <p className="text-sm text-muted-foreground">Posted by Jane Smith from {userProfile?.collegeName}</p>
                  <Button size="sm" className="mt-2">View Details</Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="group-contributions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Display list of group contributions here.</p>
              {/* Placeholder for group contributions list */}
              <div className="space-y-4 mt-4">
                {/* Example Group Contribution Card */}
                <Card className="p-4">
                  <h3 className="font-semibold">Project Alpha Fund</h3>
                  <p className="text-sm text-muted-foreground">Goal: ₹5000, Collected: ₹3000</p>
                  <Button size="sm" className="mt-2">Contribute</Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashExchangePage;