"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface JoinAmbassadorFormProps {
  onApply: (data: {
    name: string;
    email: string;
    mobile: string;
    whyJoin: string;
  }) => void;
  onCancel: () => void;
}

const JoinAmbassadorForm: React.FC<JoinAmbassadorFormProps> = ({ onApply, onCancel }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [whyJoin, setWhyJoin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile || !whyJoin) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onApply({ name, email, mobile, whyJoin });
    setName("");
    setEmail("");
    setMobile("");
    setWhyJoin("");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="name" className="text-left sm:text-right text-foreground">
          Your Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="John Doe"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="email" className="text-left sm:text-right text-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="your.email@example.com"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="mobile" className="text-left sm:text-right text-foreground">
          Mobile Number
        </Label>
        <Input
          id="mobile"
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="9876543210"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="whyJoin" className="text-left sm:text-right text-foreground">
          Why join us?
        </Label>
        <Textarea
          id="whyJoin"
          value={whyJoin}
          onChange={(e) => setWhyJoin(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="Tell us why you'd be a great ambassador..."
          required
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          Submit Application
        </Button>
      </DialogFooter>
    </form>
  );
};

export default JoinAmbassadorForm;