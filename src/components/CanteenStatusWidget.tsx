"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, UtensilsCrossed, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CanteenItem {
  name: string;
  available: boolean;
}

const CanteenStatusWidget = () => {
  const [isOpen, setIsOpen] = useState(true); // Canteen status as a toggle
  const [items, setItems] = useState<CanteenItem[]>([
    { name: "Samosa", available: true },
    { name: "Coffee", available: true },
    { name: "Sandwich", available: false },
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleRefresh = () => {
    toast.info("Refreshing canteen status...");
    // Simulate API call for status refresh
    setTimeout(() => {
      // For items, we'll keep user-made changes, so refresh won't randomly toggle availability
      toast.success("Canteen status updated!");
    }, 1000);
  };

  const handleToggleCanteenStatus = (checked: boolean) => {
    setIsOpen(checked);
    toast.success(`Canteen is now ${checked ? "Open" : "Closed"}!`);
  };

  const handleToggleAvailability = (index: number) => {
    setItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, available: !item.available } : item
      )
    );
    toast.success("Item availability updated!");
  };

  const handleAddItem = () => {
    if (newItemName.trim() === "") {
      toast.error("Food item name cannot be empty.");
      return;
    }
    setItems(prevItems => [...prevItems, { name: newItemName.trim(), available: true }]);
    setNewItemName("");
    setIsAddingItem(false);
    toast.success(`"${newItemName.trim()}" added to the menu!`);
  };

  const handleRemoveItem = (index: number) => {
    const removedItemName = items[index].name;
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
    toast.info(`"${removedItemName}" removed from the menu.`);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-secondary-neon" /> Canteen Status
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsAddingItem(true)} className="text-muted-foreground hover:text-secondary-neon">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Item</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-muted-foreground hover:text-secondary-neon">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh Status</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between mb-4">
          <Label htmlFor="canteen-status-toggle" className="text-sm text-foreground font-medium">Canteen is {isOpen ? "Open" : "Closed"}</Label>
          <Switch
            id="canteen-status-toggle"
            checked={isOpen}
            onCheckedChange={handleToggleCanteenStatus}
            className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
          />
        </div>
        <ul className="space-y-2 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
              <span className="text-foreground font-medium truncate max-w-[calc(100%-100px)]">{item.name}</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
                  onCheckedChange={() => handleToggleAvailability(index)}
                  className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-destructive hover:bg-destructive/10">
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
      </CardContent>

      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Food Item</DialogTitle>
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
    </Card>
  );
};

export default CanteenStatusWidget;