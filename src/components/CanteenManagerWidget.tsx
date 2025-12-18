"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Utensils, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddCanteenForm from "./forms/AddCanteenForm"; // Assuming this component exists
import { useCanteenData, CanteenItem, CanteenOrder } from "@/hooks/useCanteenData";
import { useAuth } from "@/context/AuthContext";

const CanteenManagerWidget = () => {
  const { userProfile } = useAuth();
  const { menuItems, orders, isLoading, error, refetchCanteenData, addMenuItem, updateMenuItem, deleteMenuItem } = useCanteenData();
  const [isAddMenuItemDialogOpen, setIsAddMenuItemDialogOpen] = useState(false);
  const [isEditMenuItemDialogOpen, setIsEditMenuItemDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<CanteenItem | null>(null);

  const isStaffOrDeveloper = userProfile?.role === "staff" || userProfile?.role === "developer";

  const handleAddMenuItem = async (data: Omit<CanteenItem, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId">) => {
    await addMenuItem(data);
    setIsAddMenuItemDialogOpen(false);
  };

  const handleEditMenuItem = async (data: Partial<CanteenItem>) => {
    if (selectedMenuItem) {
      await updateMenuItem(selectedMenuItem.$id, data);
      setIsEditMenuItemDialogOpen(false);
      setSelectedMenuItem(null);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      await deleteMenuItem(itemId);
    }
  };

  if (!isStaffOrDeveloper) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-2 text-muted-foreground">Loading canteen data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 text-center text-destructive">
          Error loading canteen data: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Utensils className="h-5 w-5 text-secondary-neon" /> Canteen Management
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <Dialog open={isAddMenuItemDialogOpen} onOpenChange={setIsAddMenuItemDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Menu Item</DialogTitle>
            </DialogHeader>
            <AddCanteenForm onSubmit={handleAddMenuItem} onCancel={() => setIsAddMenuItemDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <h3 className="text-lg font-semibold text-foreground mt-4">Current Menu Items</h3>
        {menuItems.length === 0 ? (
          <p className="text-muted-foreground">No menu items added yet.</p>
        ) : (
          <div className="space-y-2">
            {menuItems.map((item) => (
              <div key={item.$id} className="flex items-center justify-between p-2 border rounded-md bg-background">
                <div>
                  <p className="font-medium text-foreground">{item.name} - ₹{item.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => { setSelectedMenuItem(item); setIsEditMenuItemDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteMenuItem(item.$id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isEditMenuItemDialogOpen} onOpenChange={setIsEditMenuItemDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Menu Item</DialogTitle>
            </DialogHeader>
            {selectedMenuItem && (
              <AddCanteenForm
                initialData={selectedMenuItem}
                onSubmit={handleEditMenuItem}
                onCancel={() => setIsEditMenuItemDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        <h3 className="text-lg font-semibold text-foreground mt-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No recent orders.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.$id} className="p-2 border rounded-md bg-background">
                <p className="font-medium text-foreground">Order by {order.userName} - Total: ₹{order.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Status: {order.status}</p>
                {/* Add more order details and actions here */}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CanteenManagerWidget;