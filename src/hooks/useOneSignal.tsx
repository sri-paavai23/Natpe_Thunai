import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { Models } from 'appwrite';
import { toast } from 'sonner';

interface OneSignalData {
  oneSignalUserId: string; 
  pushToken?: string;
  subscribed: boolean;
}

interface UserPrefs extends Models.Preferences {
    oneSignalPlayerId?: string;
}

const useOneSignal = () => {
  const { user } = useAuth();
  const [playerId, setPlayerId] = useState<string | null>(null);

  // --- EFFECT 1: GET THE PLAYER ID (Runs once on mount) ---
  useEffect(() => {
    // 1. Define the global listener
    (window as any).median_onesignal_info = (data: OneSignalData) => {
      console.log("📲 OneSignal Info Received:", data);
      
      if (data?.oneSignalUserId) {
        setPlayerId(data.oneSignalUserId); // Save to state, don't upload yet
        // toast.success("Device ID Found"); // Uncomment for debugging
      }
    };

    // 2. Trigger Median to send the info
    // We try both the URL scheme and the JS Bridge to be safe
    const triggerMedian = () => {
        if (window.location.href.includes('median') || navigator.userAgent.includes('wv')) {
            window.location.href = 'median://onesignal/info';
            
            // Backup method for newer Median versions
            if ((window as any).median?.onesignal?.info) {
                (window as any).median.onesignal.info();
            }
        }
    };

    // Slight delay to ensure native bridge is ready
    const timer = setTimeout(triggerMedian, 1000);
    return () => clearTimeout(timer);
  }, []); 

  // --- EFFECT 2: SYNC TO APPWRITE (Runs when User OR PlayerId changes) ---
  useEffect(() => {
    const syncToAppwrite = async () => {
        // We need BOTH a logged-in user AND a Player ID to proceed
        if (!user?.$id || !playerId) return;

        try {
            const prefs = user.prefs as UserPrefs;

            // Only make the API call if the ID is actually new/different
            if (prefs.oneSignalPlayerId !== playerId) {
                console.log("🔄 Syncing Player ID to Appwrite...");
                
                await account.updatePrefs({
                    ...user.prefs, 
                    oneSignalPlayerId: playerId 
                });
                
                console.log("✅ Device Linked Successfully:", playerId);
                // toast.success("Notifications Active"); 
            }
        } catch (error) {
            console.error("❌ Failed to save Device ID:", error);
        }
    };

    syncToAppwrite();
  }, [user, playerId]); // Reruns automatically when User logs in OR when ID is found
};

export default useOneSignal;