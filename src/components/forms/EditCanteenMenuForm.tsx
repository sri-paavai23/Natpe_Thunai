import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CanteenMenuItem } from '@/hooks/useCanteenData';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditCanteenMenuFormProps {
  initialMenu: CanteenMenuItem[];
  onSubmit: (menu: CanteenMenuItem[]) => Promise<void>;
  onClose: () => void;
}

const EditCanteenMenuForm: React.FC<EditCanteenMenuFormProps> = ({ initialMenu, onSubmit, onClose }) => {
  const [menuItems, setMenuItems] = useState<CanteenMenuItem[]>(initialMenu);

  const handleMenuItemChange = (index: number, field: keyof CanteenMenuItem, value: any) => {
    const newMenuItems = [...menuItems];
    (newMenuItems[index] as any)[field] = value;
    setMenuItems(newMenuItems);
  };

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { id: Date.now().toString(), name: '', price: 0, category: '', isAvailable: true }]);
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (menuItems.some(item => !item.name || item.price <= 0 || !item.category)) {
      toast.error("Please fill in all menu item details correctly (name, price > 0, category).");
      return;
    }
    await onSubmit(menuItems);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="max-h-60 overflow-y-auto pr-2">
        {menuItems.length === 0 ? (
          <p className="text-muted-foreground text-center">No menu items yet. Add one!</p>
        ) : (
          menuItems.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-2 mb-3 p-2 border rounded-md bg-background-dark">
              <Input
                placeholder="Item Name"
                value={item.name}
                onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                className="flex-1"
                required
              />
              <Input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) => handleMenuItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                className="w-24"
                required
              />
              <Input
                placeholder="Category"
                value={item.category}
                onChange={(e) => handleMenuItemChange(index, 'category', e.target.value)}
                className="w-32"
                required
              />
              <Button variant="destructive" size="icon" type="button" onClick={() => handleRemoveMenuItem(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
      <Button type="button" variant="outline" onClick={handleAddMenuItem} className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" /> Add Menu Item
      </Button>
      <div className="flex justify-end space-x-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Menu</Button>
      </div>
    </form>
  );
};

export default EditCanteenMenuForm;