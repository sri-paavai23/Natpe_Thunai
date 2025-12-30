import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth
import { databases, APPWRITE_DATABASE_ID, APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID } from "@/lib/appwrite"; // NEW: Import Appwrite services
import { ID } from 'appwrite'; // NEW: Import ID
import { toast } from "sonner";

interface JoinAmbassadorFormProps {
  onClose: () => void;
  onApplicationSuccess: () => void;
}

const JoinAmbassadorForm: React.FC<JoinAmbassadorFormProps> = ({ onClose, onApplicationSuccess }) => {
  const { user, userProfile } = useAuth(); // Get user and userProfile from AuthContext
  const [whyJoin, setWhyJoin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to apply for the ambassador program.");
      return;
    }
    if (!userProfile.collegeName) { // Corrected property access
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }

    setIsLoading(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          userName: user.name,
          userEmail: user.email,
          whyJoin: whyJoin,
          collegeName: userProfile.collegeName, // NEW: Add collegeName
          status: "Pending", // Initial status
          applicationDate: new Date().toISOString(),
        }
      );
      toast.success("Ambassador application submitted successfully!");
      onApplicationSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting ambassador application:", error);
      toast.error(error.message || "Failed to submit application.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="userName">Your Name</Label>
        <Input id="userName" value={user?.name || ''} disabled />
      </div>
      <div>
        <Label htmlFor="userEmail">Your Email</Label>
        <Input id="userEmail" value={user?.email || ''} disabled />
      </div>
      <div>
        <Label htmlFor="collegeName">Your College</Label>
        <Input id="collegeName" value={userProfile?.collegeName || ''} disabled />
      </div>
      <div>
        <Label htmlFor="whyJoin">Why do you want to join the Ambassador Program?</Label>
        <Textarea
          id="whyJoin"
          value={whyJoin}
          onChange={(e) => setWhyJoin(e.target.value)}
          required
          rows={4}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
};

export default JoinAmbassadorForm;