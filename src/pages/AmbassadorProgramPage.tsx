import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Users, Award, DollarSign, Lightbulb, CheckCircle2 } from 'lucide-react';
import JoinAmbassadorForm from '@/components/forms/JoinAmbassadorForm';
import { toast } from 'sonner';

const AmbassadorProgramPage = () => {
  const { user, userProfile } = useAuth();
  const [isAmbassadorFormOpen, setIsAmbassadorFormOpen] = useState(false);

  const handleAmbassadorApply = (data: any) => {
    // In a real application, you would send this data to your backend
    // For now, we'll just log it and show a success toast
    console.log("Ambassador Application Submitted:", data);
    toast.success("Your application has been submitted successfully! We'll review it shortly.");
    setIsAmbassadorFormOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Ambassador Program</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">Become a Campus Ambassador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Join our exclusive Campus Ambassador program and be the face of our platform at your college!
            Earn rewards, gain valuable experience, and help your peers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Connect with your campus community</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Earn exciting rewards and incentives</p>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Develop leadership and marketing skills</p>
            </div>
          </div>

          {userProfile?.isAmbassador ? (
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              <span>You are already an Ambassador!</span>
            </div>
          ) : (
            <Dialog open={isAmbassadorFormOpen} onOpenChange={setIsAmbassadorFormOpen}>
              <DialogTrigger asChild>
                <Button>Apply Now</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Ambassador Application</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to apply for the Campus Ambassador program.
                  </DialogDescription>
                </DialogHeader>
                <JoinAmbassadorForm onApply={handleAmbassadorApply} onCancel={() => setIsAmbassadorFormOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {userProfile?.isAmbassador && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Your Ambassador Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Welcome, Ambassador {userProfile.name}! Here's a summary of your activities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Total Deliveries: {userProfile.ambassadorDeliveriesCount}</p>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Earnings: Coming Soon</p>
              </div>
            </div>
            <Button className="mt-6">View Detailed Reports</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AmbassadorProgramPage;