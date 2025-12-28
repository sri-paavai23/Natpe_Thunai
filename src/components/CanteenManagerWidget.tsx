import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useCanteenData, CanteenData } from '@/hooks/useCanteenData';
import AddCanteenForm from '@/components/forms/AddCanteenForm';
import { toast } from 'sonner';
import { Utensils, Edit, Trash2, PlusCircle } from 'lucide-react';

const CanteenManagerWidget = () => {
  const { userProfile } = useAuth();
  const { allCanteens, isLoading, error, refetch, updateCanteen, addCanteen } = useCanteenData();
  const [isAddCanteenDialogOpen, setIsAddCanteenDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCanteen, setCurrentCanteen] = useState<CanteenData | null>(null);
  const [editCanteenName, setEditCanteenName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editContactInfo, setEditContactInfo] = useState("");
  const [editOpeningTime, setEditOpeningTime] = useState("");
  const [editClosingTime, setEditClosingTime] = useState("");
  const [editIsOperational, setEditIsOperational] = useState(false);

  const handleAddCanteenSubmit = async (canteenData: Omit<CanteenData, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "$sequence">) => {
    try {
      await addCanteen(canteenData);
      setIsAddCanteenDialogOpen(false);
      refetch();
    } catch (err) {
      console.error("Failed to add canteen:", err);
      toast.error("Failed to add canteen.");
    }
  };

  const handleEditCanteen = (canteen: CanteenData) => {
    setCurrentCanteen(canteen);
    setEditCanteenName(canteen.name);
    setEditLocation(canteen.location);
    setEditContactInfo(canteen.contactInfo);
    setEditOpeningTime(canteen.openingTime);
    setEditClosingTime(canteen.closingTime);
    setEditIsOperational(canteen.isOperational);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCanteenSubmit = async () => {
    if (!currentCanteen) return;
    try {
      await updateCanteen(currentCanteen.$id, {
        name: editCanteenName.trim(),
        location: editLocation.trim(),
        contactInfo: editContactInfo.trim(),
        openingTime: editOpeningTime,
        closingTime: editClosingTime,
        isOperational: editIsOperational,
      });
      setIsEditDialogOpen(false);
      refetch();
    } catch (err) {
      console.error("Failed to update canteen:", err);
      toast.error("Failed to update canteen.");
    }
  };

  if (!userProfile?.isDeveloper) {
    return null; // Only developers can manage canteens
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Canteen Manager</CardTitle>
        <Utensils className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">Manage canteens and their details.</p>
        <Button onClick={() => setIsAddCanteenDialogOpen(true)} className="w-full mb-4">
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Canteen
        </Button>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading canteens...</div>
        ) : error ? (
          <div className="text-center text-red-500">Error: {error}</div>
        ) : allCanteens.length === 0 ? (
          <p className="text-center text-muted-foreground">No canteens added yet.</p>
        ) : (
          <div className="space-y-2">
            {allCanteens.map(canteen => (
              <div key={canteen.$id} className="flex items-center justify-between p-2 border rounded-md">
                <span className="text-sm font-medium">{canteen.name}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditCanteen(canteen)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* <Button variant="destructive" size="sm" onClick={() => handleDeleteCanteen(canteen.$id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Canteen</DialogTitle>
            <DialogDescription>Fill in the details for the new canteen.</DialogDescription>
          </DialogHeader>
          <AddCanteenForm onSubmit={handleAddCanteenSubmit} onCancel={() => setIsAddCanteenDialogOpen(false)} loading={isLoading} />
        </DialogContent>
      </Dialog>

      {currentCanteen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Canteen: {currentCanteen.name}</DialogTitle>
              <DialogDescription>Update the details for this canteen.</DialogDescription>
            </DialogDescription>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateCanteenSubmit(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Canteen Name</Label>
                <Input id="editName" value={editCanteenName} onChange={(e) => setEditCanteenName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLocation">Location</Label>
                <Input id="editLocation" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContactInfo">Contact Info</Label>
                <Input id="editContactInfo" value={editContactInfo} onChange={(e) => setEditContactInfo(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editOpeningTime">Opening Time</Label>
                  <Input id="editOpeningTime" type="time" value={editOpeningTime} onChange={(e) => setEditOpeningTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editClosingTime">Closing Time</Label>
                  <Input id="editClosingTime" type="time" value={editClosingTime} onChange={(e) => setEditClosingTime(e.target.value)} required /> {/* Corrected here */}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsOperational"
                  checked={editIsOperational}
                  onChange={(e) => setEditIsOperational(e.target.checked)}
                  className="h-4 w-4 text-primary rounded"
                />
                <Label htmlFor="editIsOperational">Currently Operational</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default CanteenManagerWidget;