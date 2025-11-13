"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Plus, Minus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Player {
  id: number;
  name: string;
  inGameId: string;
}

interface DetailedTournamentRegistrationFormProps {
  tournamentName: string;
  gameName: string;
  minPlayers?: number;
  maxPlayers?: number;
  onRegister: (data: { teamName: string; contactEmail: string; players: Player[] }) => void;
  onCancel: () => void;
}

const DetailedTournamentRegistrationForm: React.FC<DetailedTournamentRegistrationFormProps> = ({
  tournamentName,
  gameName,
  minPlayers = 1,
  maxPlayers = 4,
  onRegister,
  onCancel,
}) => {
  const [teamName, setTeamName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: minPlayers }, (_, i) => ({ id: i, name: "", inGameId: "" }))
  );
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handlePlayerChange = (id: number, field: keyof Player, value: string) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === id ? { ...player, [field]: value } : player))
    );
  };

  const handleAddPlayer = () => {
    if (players.length < maxPlayers) {
      setPlayers((prev) => [
        ...prev,
        { id: Date.now(), name: "", inGameId: "" },
      ]);
    }
  };

  const handleRemovePlayer = (id: number) => {
    if (players.length > minPlayers) {
      setPlayers((prev) => prev.filter((player) => player.id !== id));
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = [teamName, contactEmail];
    const allPlayersValid = players.every(p => p.name.trim() && p.inGameId.trim());

    if (requiredFields.some(field => !field.trim()) || !allPlayersValid || !agreeToTerms) {
      toast.error("Please fill in all required fields for the team and all players, and agree to terms.");
      return;
    }

    onRegister({ teamName, contactEmail, players });
    // Reset form fields
    setTeamName("");
    setContactEmail("");
    setPlayers(Array.from({ length: minPlayers }, (_, i) => ({ id: i, name: "", inGameId: "" })));
    setAgreeToTerms(false);
  };

  return (
    <form onSubmit={handleRegistrationSubmit} className="grid gap-4 py-4">
      <div className="space-y-3">
        <Label htmlFor="teamName" className="text-foreground">Team Name</Label>
        <Input
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., Campus Conquerors"
          required
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="game" className="text-foreground">Game</Label>
        <Input
          id="game"
          value={gameName}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="contactEmail" className="text-foreground">Contact Email (Team Lead)</Label>
        <Input
          id="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="team@example.com"
          required
        />
      </div>

      <Card className="bg-background border-border mt-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-secondary-neon" /> Players ({players.length}/{maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-4">
          {players.map((player, index) => (
            <div key={player.id} className="border border-border p-3 rounded-md space-y-2">
              <h4 className="font-medium text-sm text-secondary-neon">Player {index + 1}</h4>
              <div className="space-y-2">
                <Label htmlFor={`player-name-${player.id}`} className="text-xs text-muted-foreground">Full Name</Label>
                <Input
                  id={`player-name-${player.id}`}
                  value={player.name}
                  onChange={(e) => handlePlayerChange(player.id, "name", e.target.value)}
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring h-8 text-sm"
                  placeholder={`Player ${index + 1} Name`}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`player-id-${player.id}`} className="text-xs text-muted-foreground">In-Game ID/Username</Label>
                <Input
                  id={`player-id-${player.id}`}
                  value={player.inGameId}
                  onChange={(e) => handlePlayerChange(player.id, "inGameId", e.target.value)}
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring h-8 text-sm"
                  placeholder={`In-Game ID`}
                  required
                />
              </div>
              {players.length > minPlayers && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemovePlayer(player.id)}
                  className="w-full mt-2"
                >
                  <Minus className="h-4 w-4 mr-1" /> Remove Player
                </Button>
              )}
            </div>
          ))}
          {players.length < maxPlayers && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPlayer}
              className="w-full border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Player
            </Button>
          )}
        </CardContent>
      </Card>

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

export default DetailedTournamentRegistrationForm;