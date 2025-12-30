import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AddCanteenFormProps {
  onSubmit: (canteenName: string, collegeId: string) => Promise<void>;
  onClose: () => void;
}

const AddCanteenForm: React.FC<AddCanteenFormProps> = ({ onSubmit, onClose }) => {
  const [canteenName, setCanteenName] = useState('');
  const { userProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.collegeId) { // Corrected property access
      toast.error("Your college information is missing. Cannot add canteen.");
      return;
    }
    await onSubmit(canteenName, userProfile.collegeId); // Corrected property access
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="canteenName">Canteen Name</Label>
        <Input
          id="canteenName"
          value={canteenName}
          onChange={(e) => setCanteenName(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Add Canteen</Button>
      </div>
    </form>
  );
};

export default AddCanteenForm;