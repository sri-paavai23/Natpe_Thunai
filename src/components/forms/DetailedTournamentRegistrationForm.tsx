import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";
// --- FIX 1: Import Appwrite SDK and Config ---
import { databases, APPWRITE_DATABASE_ID, APPWRITE_REGISTRATIONS_COLLECTION_ID } from "@/lib/appwrite";

// --- FIX 2: Define Collection ID (Replace with your actual ID from previous steps) ---
const APPWRITE_REGISTRATIONS_COLLECTION_ID = "65abcdef123456..."; // <--- PUT YOUR REAL REGISTRATION COLLECTION ID HERE

interface Player {
  name: string;
  inGameId: string;
}

interface DetailedTournamentRegistrationFormProps {
  // --- FIX 3: Add tournamentId to props ---
  tournamentId: string; 
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
  tournamentId, // Destructure the new prop
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
      const transactionNote = `Entry Fee for ${teamName} - ${tournamentName}`;
      const upiLink = `upi://pay?pa=${hostUpiId}&pn=${encodeURIComponent(hostName)}&tn=${encodeURIComponent(transactionNote)}&am=${fee}&cu=INR`;

      // 2. Redirect to UPI App
      window.location.href = upiLink;

      // 3. Pause for user action
      setTimeout(() => {
        // In a real P2P flow, we just ask them if they paid.
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

  const submitRegistration = async () => {
    try {
        // --- FIX 4: Use the imported variables correctly ---
        await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_REGISTRATIONS_COLLECTION_ID,
            ID.unique(),
            {
                tournamentId: tournamentId, // Use the prop passed from parent
                teamName: teamName,
                contactEmail: contactEmail,
                players: JSON.stringify(players) // Store as string
            }
        );
        onRegister({ teamName, contactEmail, players });
        toast.success("Team registered successfully!");
    } catch (error) {
        toast.error("Registration failed. Please try again.");
        console.error("Appwrite Registration Error:", error);
    } finally {
        setIsSubmitting(false);
    }
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