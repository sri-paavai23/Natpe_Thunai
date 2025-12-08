"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTournamentData } from "@/hooks/useTournamentData";

interface PostTournamentFormProps {
  onTournamentPosted: () => void;
  onCancel: () => void;
}

const PostTournamentForm: React.FC<PostTournamentFormProps> = ({ onTournamentPosted, onCancel }) => {
  const { user, userProfile } = useAuth();
  const { createTournament } = useTournamentData();
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [date, setDate] = useState("");
  const [fee, setFee] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [minPlayers, setMinPlayers] = useState("1");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a tournament.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    if (!name || !game || !date || !fee || !prizePool || !minPlayers || !maxPlayers) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const parsedFee = parseFloat(fee);
    const parsedMinPlayers = parseInt(minPlayers);
    const parsedMaxPlayers = parseInt(maxPlayers);

    if (isNaN(parsedFee) || parsedFee < 0) {
      toast.error("Fee must be a valid non-negative number.");
      return;
    }
    if (isNaN(parsedMinPlayers) || parsedMinPlayers < 1) {
      toast.error("Minimum players must be at least 1.");
      return;
    }
    if (isNaN(parsedMaxPlayers) || parsedMaxPlayers < parsedMinPlayers) {
      toast.error("Maximum players must be greater than or equal to minimum players.");
      return;
    }

    setIsPosting(true);
    try {
      await createTournament({
        name: name.trim(),
        game: game.trim(),
        date: date,
        fee: parsedFee,
        prizePool: prizePool.trim(),
        status: "Open", // Default status for new tournaments
        standings: [],
        winners: [],
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        minPlayers: parsedMinPlayers,
        maxPlayers: parsedMaxPlayers,
      });
      onTournamentPosted();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="name" className="text-left sm:text-right text-foreground">
          Tournament Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., Valorant Campus Cup"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="game" className="text-left sm:text-right text-foreground">
          Game
        </Label>
        <Input
          id="game"
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., Valorant, Free Fire"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="date" className="text-left sm:text-right text-foreground">
          Date
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="fee" className="text-left sm:text-right text-foreground">
          Entry Fee (₹)
        </Label>
        <Input
          id="fee"
          type="number"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., 50 (0 for free)"
          min="0"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="prizePool" className="text-left sm:text-right text-foreground">
          Prize Pool
        </Label>
        <Input
          id="prizePool"
          value={prizePool}
          onChange={(e) => setPrizePool(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., ₹5000, Trophies"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="minPlayers" className="text-left sm:text-right text-foreground">
          Min Players
        </Label>
        <Input
          id="minPlayers"
          type="number"
          value={minPlayers}
          onChange={(e) => setMinPlayers(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          min="1"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="maxPlayers" className="text-left sm:text-right text-foreground">
          Max Players
        </Label>
        <Input
          id="maxPlayers"
          type="number"
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          min={minPlayers}
          required
          disabled={isPosting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPosting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isPosting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Post Tournament</>}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PostTournamentForm;