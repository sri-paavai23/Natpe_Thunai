"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { largeIndianColleges } from "@/lib/largeIndianColleges";
import CollegeCombobox from "@/components/CollegeCombobox";

interface EditProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    age: number;
    mobileNumber: string;
    upiId: string;
    gender: "male" | "female" | "prefer-not-to-say";
    userType: "student" | "staff";
    collegeName: string;
  };
  onSave: (data: {
    firstName: string;
    lastName: string;
    age: number;
    mobileNumber: string;
    upiId: string;
    gender: "male" | "female" | "prefer-not-to-say";
    userType: "student" | "staff";
    collegeName: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ initialData, onSave, onCancel }) => {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [age, setAge] = useState(String(initialData.age));
  const [mobileNumber, setMobileNumber] = useState(initialData.mobileNumber);
  const [upiId, setUpiId] = useState(initialData.upiId);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">(initialData.gender);
  const [userType, setUserType] = useState<"student" | "staff">(initialData.userType);
  const [collegeName, setCollegeName] = useState(initialData.collegeName);
  const [isSaving, setIsSaving] = useState(false);

  // Update form fields if initialData changes (e.g., after a successful save and re-fetch)
  useEffect(() => {
    setFirstName(initialData.firstName);
    setLastName(initialData.lastName);
    setAge(String(initialData.age));
    setMobileNumber(initialData.mobileNumber);
    setUpiId(initialData.upiId);
    setGender(initialData.gender);
    setUserType(initialData.userType);
    setCollegeName(initialData.collegeName);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !age || !mobileNumber || !upiId || !gender || !userType || !collegeName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        firstName,
        lastName,
        age: parseInt(age),
        mobileNumber,
        upiId,
        gender,
        userType,
        collegeName,
      });
      toast.success("Profile updated successfully!");
      onCancel(); // Close dialog on successful save
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="firstName" className="text-left sm:text-right text-foreground">First Name</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSaving}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="lastName" className="text-left sm:text-right text-foreground">Last Name</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSaving}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="age" className="text-left sm:text-right text-foreground">Age</Label>
        <Input
          id="age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          min="16"
          disabled={isSaving}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="mobileNumber" className="text-left sm:text-right text-foreground">Mobile Number</Label>
        <Input
          id="mobileNumber"
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSaving}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="upiId" className="text-left sm:text-right text-foreground">UPI ID</Label>
        <Input
          id="upiId"
          type="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSaving}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="collegeName" className="text-left sm:text-right text-foreground">College Name</Label>
        <div className="col-span-3">
          <CollegeCombobox
            collegeList={largeIndianColleges}
            value={collegeName}
            onValueChange={setCollegeName}
            placeholder="Select your college"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
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

      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EditProfileForm;