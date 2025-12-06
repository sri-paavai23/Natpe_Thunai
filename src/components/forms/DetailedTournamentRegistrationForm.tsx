"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Plus, Minus, Users, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DEVELOPER_UPI_ID } from "@/lib/config"; // Import DEVELOPER_UPI_ID
import { ID } from 'appwrite';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";

interface Player {
  id: number;
  name: string;
  inGameId: string;
}

interface DetailedTournamentRegistrationFormProps {
  tournamentName: string;
  gameName: string;
  fee: number; // Added fee prop
  minPlayers?: number;
  maxPlayers?: number;
  onRegister: (data: { teamName: string; contactEmail: string; players: Player[] }) => void;
  onCancel: () => void;
}

const DetailedTournamentRegistrationForm: React.FC<DetailedTournamentRegistrationFormProps> = ({
  tournamentName,
  gameName,
  fee,
  minPlayers = 1,
  maxPlayers = 4,
  onRegister,
  onCancel,
}) => {
  const { user } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: minPlayers }, (_, i) => ({ id: i, name: "", inGameId: "" }))
  );
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    
    if (fee > 0) {
        setIsConfirming(true);
    } else {
        // If fee is 0, proceed directly to registration
        onRegister({ teamName, contactEmail, players });
    }
  };
  
  const handlePaymentInitiation = async () => {
    if (!user) {
        toast.error("User session expired. Please log in again.");
        return;
    }
    
    setIsConfirming(false);
    setIsProcessing(true);
    
    const transactionAmount = fee;
    const transactionNote = `Tournament Registration: ${tournamentName} - Team ${teamName}`;

    try {
        // 1. Create a mock transaction document (or use a dedicated registration collection)
        // For simplicity and tracking, we use the transactions collection here, marking it as 'service' type.
        const newTransaction = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_TRANSACTIONS_COLLECTION_ID,
            ID.unique(),
            {
                productId: tournamentName, // Using name as ID placeholder
                productTitle: tournamentName,
                buyerId: user.$id,
                buyerName: user.name,
                sellerId: DEVELOPER_UPI_ID, // Developer is the recipient
                sellerName: "Natpe Thunai Developers",
                sellerUpiId: DEVELOPER_UPI_ID,
                amount: transactionAmount,
                status: "initiated",
                type: "service", // Use 'service' type for non-market transactions
                isBargain: false,
            }
        );
        
        const transactionId = newTransaction.$id;

        // 2. Generate UPI Deep Link
        const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiDevelopers&am=${transactionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (TX ID: ${transactionId})`)}`;

        // 3. Redirect to UPI App
        window.open(upiDeepLink, "_blank");
        
        toast.info(`Redirecting to UPI app to pay ₹${transactionAmount.toFixed(2)} registration fee. Please complete the payment and note the UTR ID.`);

        // 4. Complete registration (simulated success after payment initiation)
        onRegister({ teamName, contactEmail, players });

    } catch (error: any) {
        console.error("Error initiating tournament payment:", error);
        toast.error(error.message || "Failed to initiate payment.");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <>
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
            disabled={isProcessing}
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
            disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
                  />
                </div>
                {players.length > minPlayers && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePlayer(player.id)}
                    className="w-full mt-2"
                    disabled={isProcessing}
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
                disabled={isProcessing}
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
            disabled={isProcessing}
          />
          <Label htmlFor="agreeTerms" className="text-sm text-muted-foreground">
            I agree to the <Link to="/profile/policies" className="text-secondary-neon hover:underline">tournament rules</Link>
          </Label>
        </div>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="border-border text-primary-foreground hover:bg-muted" disabled={isProcessing}>Cancel</Button>
          <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (fee > 0 ? `Pay ₹${fee.toFixed(2)} & Register` : 'Register Now')}
          </Button>
        </DialogFooter>
      </form>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary-neon" /> Confirm Registration Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You are about to pay the registration fee to the developer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-foreground">Tournament: <span className="font-semibold">{tournamentName}</span></p>
            <p className="text-xl font-bold text-secondary-neon">Fee: ₹{fee.toFixed(2)}</p>
            <p className="text-xs text-destructive-foreground">
                Recipient: Natpe Thunai Developers (UPI ID: {DEVELOPER_UPI_ID})
            </p>
            <p className="text-xs text-muted-foreground">
                You will be redirected to your UPI app. If redirection fails, please use the developer UPI ID/QR code found in the 'Chat with Developers' section of your profile.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirming(false)} className="border-border text-primary-foreground hover:bg-muted">
              Go Back
            </Button>
            <Button onClick={handlePaymentInitiation} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pay Now & Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DetailedTournamentRegistrationForm;