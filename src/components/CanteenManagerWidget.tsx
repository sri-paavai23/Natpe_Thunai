"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, UtensilsCrossed, Plus, Trash2, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Models } from "appwrite";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddCanteenForm from "./forms/AddCanteenForm";

interface CanteenItem {
  name: string;
  available: boolean;
}

interface CanteenData extends Models.Document {
  name: string; // New field to store canteen name
  isOpen: boolean;
  items: CanteenItem[];
}

const CanteenManagerWidget = () => {
  const [allCanteens, setAllCanteens] = useState<CanteenData[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingCanteen, setIsAddingCanteen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedCanteen = allCanteens.find(c => c.$id === selectedCanteenId);

  const fetchCanteenData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID
      );
      const fetchedCanteens = response.documents as unknown as CanteenData[];
      setAllCanteens(fetchedCanteens);

      // If no canteen is selected, select the first one, or null if list is empty
      if (!selectedCanteenId && fetchedCanteens.length > 0) {
        setSelectedCanteenId(fetchedCanteens[0].$id);
      } else if (selectedCanteenId && !fetchedCanteens.some(c => c.$id === selectedCanteenId)) {
        // If previously selected canteen was deleted, select the first one
        setSelectedCanteenId(fetchedCanteens.length > 0 ? fetchedCanteens[0].$id : null);
      }
    } catch (error: any) {
      console.error("Error fetching canteen data:", error);
      toast.error("Failed to load canteen status.");
    } finally {
      setLoading(false);
    }
  }, [selectedCanteenId]);

  const updateCanteenData = async (canteenId: string, updates: Partial<CanteenData>) => {
    setIsUpdating(true);
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId,
        updates
      ) as unknown as CanteenData;
      
      // Update local state with the new document
      setAllCanteens(prev => prev.map(c => c.$id === canteenId ? updatedDoc : c));
      return updatedDoc;
    } catch (error: any) {
      console.error("Error updating canteen data:", error);
      toast.error(error.message || "Failed to update canteen status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCanteen = async (canteenName: string) => {
    setIsAddingCanteen(true);
    const initialData = {
      name: canteenName,
      isOpen: true,
      items: [
        { name: "Coffee", available: true },
        { name: "Tea", available: true },
      ],
    };
    try {
      const newDoc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        ID.unique(),
        initialData
      ) as unknown as CanteenData;
      
      setAllCanteens(prev => [...prev, newDoc]);
      setSelectedCanteenId(newDoc.$id);
      toast.success(`Canteen "${canteenName}" added successfully!`);
      setIsAddingCanteen(false);
      setIsAddingCanteen(false); // Close dialog
    } catch (e: any) {
      console.error("Error adding canteen:", e);
      toast.error(e.message || "Failed to add new canteen.");
      setIsAddingCanteen(false);
    }
  };

  useEffect(() => {
    fetchCanteenData();
  }, [fetchCanteenData]);

  const handleRefresh = () => {
    toast.info("Refreshing canteen status...");
    fetchCanteenData();
  };

  const handleToggleCanteenStatus = (checked: boolean) => {
    if (!selectedCanteenId) return;
    updateCanteenData(selectedCanteenId, { isOpen: checked });
    toast.success(`${selectedCanteen?.name} is now ${checked ? "Open" : "Closed"}!`);
  };

  const handleToggleAvailability = (index: number) => {
    if (!selectedCanteen || !selectedCanteenId) return;
    const newItems = selectedCanteen.items.map((item, i) =>
      i === index ? { ...item, available: !item.available } : item
    );
    updateCanteenData(selectedCanteenId, { items: newItems });
    toast.success("Item availability updated!");
  };

  const handleAddItem = () => {
    if (!selectedCanteen || !selectedCanteenId) return;
    if (newItemName.trim() === "") {
      toast.error("Food item name cannot be empty.");
      return;
    }
    const newItems = [...selectedCanteen.items, { name: newItemName.trim(), available: true }];
    updateCanteenData(selectedCanteenId, { items: newItems });
    setNewItemName("");
    setIsAddingItem(false);
    toast.success(`"${newItemName.trim()}" added to the menu!`);
  };

  const handleRemoveItem = (index: number) => {
    if (!selectedCanteen || !selectedCanteenId) return;
    const removedItemName = selectedCanteen.items[index].name;
    const newItems = selectedCanteen.items.filter((_, i) => i !== index);
    updateCanteenData(selectedCanteenId, { items: newItems });
    toast.info(`"${removedItemName}" removed from the menu.`);
  };

  if (loading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading Canteen Status...</p>
      </Card>
    );
  }

  const isOpen = selectedCanteen?.isOpen ?? false;
  const items = selectedCanteen?.items ?? [];

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-secondary-neon" /> Canteen Manager
        </CardTitle>
        <div className="flex items-center gap-2">
          <Dialog open={isAddingCanteen} onOpenChange={setIsAddingCanteen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-secondary-neon" disabled={isUpdating}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add Canteen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Canteen</DialogTitle>
              </DialogHeader>
              <AddCanteenForm onSubmit={handleAddCanteen} onCancel={() => setIsAddingCanteen(false)} />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-muted-foreground hover:text-secondary-neon" disabled={isUpdating}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh Status</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {allCanteens.length > 0 ? (
          <>
            <div className="mb-4 space-y-3">
              <Label htmlFor="canteen-select" className="text-sm text-foreground font-medium">Select Canteen</Label>
              <Select value={selectedCanteenId || ""} onValueChange={setSelectedCanteenId} disabled={isUpdating}>
                <SelectTrigger id="canteen-select" className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                  <SelectValue placeholder="Choose a Canteen" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {allCanteens.map(canteen => (
                    <SelectItem key={canteen.$id} value={canteen.$id}>
                      {canteen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCanteen && (
              <>
                <div className="flex items-center justify-between mb-4 border-t border-border pt-4">
                  <Label htmlFor="canteen-status-toggle" className="text-sm text-foreground font-medium">
                    {selectedCanteen.name} is {isOpen ? "Open" : "Closed"}
                  </Label>
                  <Switch
                    id="canteen-status-toggle"
                    checked={isOpen}
                    onCheckedChange={handleToggleCanteenStatus}
                    className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
                    disabled={isUpdating}
                  />
                </div>
                
                <h4 className="text-md font-semibold text-foreground mb-2">Menu Items</h4>
                <ul className="space-y-2 text-sm border border-border rounded-md p-3 bg-background">
                  {items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                      <span className="text-foreground font-medium truncate max-w-[calc(100%-100px)]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => handleToggleAvailability(index)}
                          className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
                          disabled={isUpdating}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-destructive hover:bg-destructive/10" disabled={isUpdating}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove {item.name}</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No items on the menu. Add some!</p>
                  )}
                </ul>

                <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                  <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Food Item to {selectedCanteen.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="food-item-name" className="text-right text-foreground">
                          Name
                        </Label>
                        <Input
                          id="food-item-name"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                          placeholder="e.g., Pizza Slice"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingItem(false)} className="border-border text-primary-foreground hover:bg-muted">Cancel</Button>
                      <Button onClick={handleAddItem} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">Add Item</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <p className="text-muted-foreground">No canteens found. Be the first to add one!</p>
            <Button onClick={() => setIsAddingCanteen(true)} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
              <Plus className="mr-2 h-4 w-4" /> Add First Canteen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CanteenManagerWidget;