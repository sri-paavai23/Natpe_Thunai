import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, UserPreferences } from '@/context/AuthContext'; // Import UserPreferences
import { toast } from 'sonner';
import { CanteenData } from '@/hooks/useCanteenData';

interface AddCanteenFormProps {
  onSubmit: (canteenData: Omit<CanteenData, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "collegeName">) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const AddCanteenForm: React.FC<AddCanteenFormProps> = ({ onSubmit, onCancel, loading }) => {
  const { userProfile } = useAuth(); // Use userProfile
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("20:00");
  const [isOperational, setIsOperational] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.collegeName) {
      toast.error("User profile or college name not found.");
      return;
    }
    if (!name || !location || !contactInfo || !openingTime || !closingTime) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        location: location.trim(),
        contactInfo: contactInfo.trim(),
        imageUrl: imageUrl.trim() || undefined,
        openingTime,
        closingTime,
        isOperational,
      });
      // Form reset handled by parent on success
    } catch (error) {
      console.error("Error submitting canteen form:", error);
      toast.error("Failed to add canteen.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Canteen Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Main Canteen" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Near Admin Block" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactInfo">Contact Info</Label>
        <Input id="contactInfo" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="e.g., +91 9876543210" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (Optional)</Label>
        <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/canteen.jpg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="openingTime">Opening Time</Label>
          <Input id="openingTime" type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closingTime">Closing Time</Label>
          <Input id="closingTime" type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} required />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isOperational"
          checked={isOperational}
          onChange={(e) => setIsOperational(e.target.checked)}
          className="h-4 w-4 text-primary rounded"
        />
        <Label htmlFor="isOperational">Currently Operational</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Canteen"}
        </Button>
      </div>
    </form>
  );
};

export default AddCanteenForm;