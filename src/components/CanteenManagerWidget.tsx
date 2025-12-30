import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useCanteenData, CanteenData, CanteenMenuItem } from '@/hooks/useCanteenData';
import { Loader2, PlusCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AddCanteenForm from './forms/AddCanteenForm';
import EditCanteenMenuForm from './forms/EditCanteenMenuForm'; // Corrected import
import { toast } from 'sonner';

const CanteenManagerWidget: React.FC = () => {
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const { canteens, isLoading, error, addCanteen, updateCanteenStatus, updateCanteenMenu, deleteCanteen, refetch } = useCanteenData();

  const [isAddCanteenDialogOpen, setIsAddCanteenDialogOpen] = useState(false);
  const [isEditMenuDialogOpen, setIsEditMenuDialogOpen] = useState(false);
  const [selectedCanteen, setSelectedCanteen] = useState<CanteenData | null>(null);

  // Only developers and staff can manage canteens
  if (isAuthLoading || !userProfile || (userProfile.role !== 'developer' && userProfile.userType !== 'staff')) { // Corrected userType to role
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Canteen Management</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Canteen Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const handleAddCanteen = async (name: string, collegeId: string) => {
    await addCanteen(name, collegeId);
    setIsAddCanteenDialogOpen(false);
  };

  const handleEditMenu = (canteen: CanteenData) => {
    setSelectedCanteen(canteen);
    setIsEditMenuDialogOpen(true);
  };

  const handleUpdateMenu = async (menu: CanteenMenuItem[]) => {
    if (selectedCanteen) {
      await updateCanteenMenu(selectedCanteen.$id, menu);
      setIsEditMenuDialogOpen(false);
      setSelectedCanteen(null);
    }
  };

  const handleDeleteCanteen = async (canteenId: string) => {
    if (window.confirm("Are you sure you want to delete this canteen? This action cannot be undone.")) {
      await deleteCanteen(canteenId);
    }
  };

  return (
    <Card className="bg-card border-border-dark text-foreground">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Canteen Management</CardTitle>
        <Button size="sm" onClick={() => setIsAddCanteenDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add Canteen
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {canteens.length === 0 ? (
          <p className="text-muted-foreground">No canteens found for your college.</p>
        ) : (
          canteens.map((canteen) => (
            <div key={canteen.$id} className="flex items-center justify-between p-3 border border-border-dark rounded-md bg-background-dark">
              <div>
                <p className="text-sm font-medium">{canteen.name} ({canteen.collegeName})</p>
                <p className="text-xs text-muted-foreground">Status: {canteen.isOpen ? 'Open' : 'Closed'}</p>
                <p className="text-xs text-muted-foreground">Last Updated: {new Date(canteen.lastUpdated).toLocaleString()}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => updateCanteenStatus(canteen.$id, !canteen.isOpen)}>
                  {canteen.isOpen ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditMenu(canteen)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteCanteen(canteen.$id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border-dark">
          <DialogHeader>
            <DialogTitle>Add New Canteen</DialogTitle>
          </DialogHeader>
          <AddCanteenForm onSubmit={handleAddCanteen} onClose={() => setIsAddCanteenDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditMenuDialogOpen} onOpenChange={setIsEditMenuDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-foreground border-border-dark">
          <DialogHeader>
            <DialogTitle>Edit Menu for {selectedCanteen?.name}</DialogTitle>
          </DialogHeader>
          {selectedCanteen && (
            <EditCanteenMenuForm
              initialMenu={selectedCanteen.menu}
              onSubmit={handleUpdateMenu}
              onClose={() => setIsEditMenuDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CanteenManagerWidget;