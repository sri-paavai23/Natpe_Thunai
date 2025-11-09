"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "react-router-dom"; // Import Link

interface TournamentRegistrationFormProps {
  tournamentName: string;
  gameName: string;
  onRegister: (data: { teamName: string; contactEmail: string; numPlayers: string }) => void;
  onCancel: () => void;
}

const TournamentRegistrationForm: React.FC<TournamentRegistrationFormProps> = ({
  tournamentName,
  gameName,
  onRegister,
  onCancel,
}) => {
  const [teamName, setTeamName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [numPlayers, setNumPlayers] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !contactEmail || !numPlayers || !agreeToTerms) {
      toast.error("Please fill in all required fields and agree to terms.");
      return;
    }
    onRegister({ teamName, contactEmail, numPlayers });
    setTeamName("");
    setContactEmail("");
    setNumPlayers("");
    setAgreeToTerms(false);
  };

  return (
    <form onSubmit={handleRegistrationSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="teamName" className="text-left sm:text-right text-foreground">
          Team Name
        </Label>
        <Input
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., Campus Conquerors"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="game" className="text-left sm:text-right text-foreground">
          Game
        </Label>
        <Input
          id="game"
          value={gameName}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="contactEmail" className="text-left sm:text-right text-foreground">
          Contact Email
        </Label>
        <Input
          id="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="team@example.com"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="numPlayers" className="text-left sm:text-right text-foreground">
          No. of Players
        </Label>
        <Input
          id="numPlayers"
          type="number"
          value={numPlayers}
          onChange={(e) => setNumPlayers(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., 4"
          min="1"
          required
        />
      </div>
      <div className="flex items-center space-x-2 col-span-4 justify-end pr-1">
        <Checkbox
          id="agreeTerms"
          checked={agreeToTerms}
          onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
          className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground"
        />
        <Label htmlFor="agreeTerms" className="text-sm text-muted-foreground">
          I agree to the <Link to="/profile/policies" className="text-secondary-neon hover:underline">tournament rules</Link>
        </Label>
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border text-primary-foreground hover:bg-muted">Cancel</Button>
        <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">Register Now</Button>
      </DialogFooter>
    </form>
  );
};

export default TournamentRegistrationForm;