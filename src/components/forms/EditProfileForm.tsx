"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { useAuth } from "@/context/AuthContext";

interface EditProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    age: number;
    mobileNumber: string;
    upiId: string;
    gender: "male" | "female" | "prefer-not-to-say"; // Added gender
    userType: "student" | "staff"; // Added userType
  };
  onSave: (data: {
    firstName: string;
    lastName: string;
    age: number;
    mobileNumber: string;
    upiId: string;
    gender: "male" | "female" | "prefer-not-to-say"; // Added gender
    userType: "student" | "staff"; // Added userType
  }) => Promise<void>;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [age, setAge] = useState(String(initialData.age));
  const [mobileNumber, setMobileNumber] = useState(initialData.mobileNumber);
  const [upiId, setUpiId] = useState(initialData.upiId);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">(initialData.gender); // New state
  const [userType, setUserType] = useState<"student" | "staff">(initialData.userType); // New state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFirstName(initialData.firstName);
    setLastName(initialData.lastName);
    setAge(String(initialData.age));
    setMobileNumber(initialData.mobileNumber);
    setUpiId(initialData.upiId);
    setGender(initialData.gender);
    setUserType(initialData.userType);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!firstName || !lastName || !age || !mobileNumber || !upiId || !gender || !userType) {
      toast.error("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 16) {
      toast.error("Please enter a valid age (minimum 16).");
      setLoading(false);
      return;
    }

    try {
      await onSave({
        firstName,
        lastName,
        age: parsedAge,
        mobileNumber,
        upiId,
        gender, // Pass gender
        userType, // Pass userType
      });
      toast.success("Profile updated successfully!");
      onCancel(); // Close dialog on success
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="firstName" className="text-left sm:text-right text-foreground">
          First Name
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="lastName" className="text-left sm:text-right text-foreground">
          Last Name
        </Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="age" className="text-left sm:text-right text-foreground">
          Age
        </Label>
        <Input
          id="age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          min="16"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="mobileNumber" className="text-left sm:text-right text-foreground">
          Mobile Number
        </Label>
        <Input
          id="mobileNumber"
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="upiId" className="text-left sm:text-right text-foreground">
          UPI ID
        </Label>
        <Input
          id="upiId"
          type="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
        />
      </div>

      {/* Gender Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:gap-4 items-center">
        <Label className="text-left sm:text-right text-foreground">Gender</Label>
        <RadioGroup value={gender} onValueChange={(value: "male" | "female" | "prefer-not-to-say") => setGender(value)} className="col-span-3 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="edit-gender-male" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
            <Label htmlFor="edit-gender-male" className="text-foreground">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="edit-gender-female" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
            <Label htmlFor="edit-gender-female" className="text-foreground">Female</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="prefer-not-to-say" id="edit-gender-prefer-not-to-say" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
            <Label htmlFor="edit-gender-prefer-not-to-say" className="text-foreground">Prefer not to say</Label>
          </div>
        </RadioGroup>
      </div>

      {/* User Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-4 sm:gap-4 items-center">
        <Label className="text-left sm:text-right text-foreground">User Type</Label>
        <RadioGroup value={userType} onValueChange={(value: "student" | "staff") => setUserType(value)} className="col-span-3 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="student" id="edit-user-type-student" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
            <Label htmlFor="edit-user-type-student" className="text-foreground">Student</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="staff" id="edit-user-type-staff" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
            <Label htmlFor="edit-user-type-staff" className="text-foreground">Staff</Label>
          </div>
        </RadioGroup>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EditProfileForm;