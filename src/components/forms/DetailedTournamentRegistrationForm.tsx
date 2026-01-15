import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, DollarSign, ExternalLink } from "lucide-react";

interface Player {
  name: string;
  inGameId: string;
}

interface DetailedTournamentRegistrationFormProps {
  tournamentName: string;
  gameName: string;
  fee: number;
  minPlayers: number;
  maxPlayers: number;
  hostUpiId: string;
  hostName: string;
  onRegister: (data: any) => void;
  onCancel: () => void;
}

const DetailedTournamentRegistrationForm = ({
  tournamentName,
  gameName,
  fee,
  minPlayers,
  maxPlayers,
  hostUpiId,
  hostName,
  onRegister,
  onCancel,
}: DetailedTournamentRegistrationFormProps) => {
  const [teamName, setTeamName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [players, setPlayers] = useState<Player[]>(
    Array(minPlayers).fill({ name: "", inGameId: "" })
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Logic
  const handlePaymentAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!teamName || !contactEmail) return toast.error("Please fill all details");
    if (players.some(p => !p.name || !p.inGameId)) return toast.error("Fill all player details");

    setIsSubmitting(true);

    if (fee > 0 && hostUpiId) {
      // 1. Construct UPI Link
      // tr = transaction reference (optional), tn = transaction note
      const transactionNote = `Entry Fee for ${teamName} - ${tournamentName}`;
      const upiLink = `upi://pay?pa=${hostUpiId}&pn=${encodeURIComponent(hostName)}&tn=${encodeURIComponent(transactionNote)}&am=${fee}&cu=INR`;

      // 2. Redirect to UPI App
      // This works on mobile. On desktop, it might do nothing or try to open an associated app.
      window.location.href = upiLink;

      // 3. User Experience Pause
      // We pause for a few seconds to let the app open, then assume success or ask for confirmation
      // In a real app, you'd show a "Enter Transaction ID" input after they return.
      setTimeout(() => {
        const confirmed = window.confirm("Did you complete the payment in your UPI app?");
        if (confirmed) {
            submitRegistration();
        } else {
            setIsSubmitting(false);
            toast.error("Payment not confirmed. Registration cancelled.");
        }
      }, 1000);
    } else {
      // Free tournament
      submitRegistration();
    }
  };

  const submitRegistration = () => {
    // Call the parent handler to save to Appwrite
    onRegister({
        teamName,
        contactEmail,
        players
    });
    setIsSubmitting(false);
  };

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (players.length < maxPlayers) {
      setPlayers([...players, { name: "", inGameId: "" }]);
    }
  };

  return (
    <form onSubmit={handlePaymentAndRegister} className="space-y-4">
      <div className="space-y-2">
        <Label>Team Name</Label>
        <Input 
            placeholder="e.g. Team Liquid" 
            value={teamName} 
            onChange={(e) => setTeamName(e.target.value)} 
            required
        />
      </div>

      <div className="space-y-2">
        <Label>Contact Email</Label>
        <Input 
            type="email" 
            placeholder="captain@example.com" 
            value={contactEmail} 
            onChange={(e) => setContactEmail(e.target.value)} 
            required
        />
      </div>

      <div className="space-y-2">
        <Label className="flex justify-between">
            <span>Players ({players.length}/{maxPlayers})</span>
            {players.length < maxPlayers && (
                <span onClick={addPlayer} className="text-xs text-secondary-neon cursor-pointer hover:underline">+ Add Sub</span>
            )}
        </Label>
        {players.map((player, idx) => (
          <div key={idx} className="flex gap-2">
            <Input 
                placeholder={`Player ${idx + 1} Name`} 
                value={player.name}
                onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                required
            />
             <Input 
                placeholder="In-Game ID" 
                value={player.inGameId}
                onChange={(e) => updatePlayer(idx, 'inGameId', e.target.value)}
                required
            />
          </div>
        ))}
      </div>

      <div className="bg-muted p-3 rounded-md mt-4">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Registration Fee:</span>
            <span className="text-lg font-bold text-secondary-neon">
                {fee === 0 ? "FREE" : `₹${fee}`}
            </span>
        </div>
        {fee > 0 && (
            <p className="text-xs text-muted-foreground">
                Clicking Register will open your UPI app to pay <strong>{hostName}</strong> directly.
            </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button 
            type="submit" 
            className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 w-full sm:w-auto" 
            disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (
            <>
                {fee > 0 ? <><DollarSign className="h-4 w-4 mr-1"/> Pay & Register</> : "Register Team"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default DetailedTournamentRegistrationForm;