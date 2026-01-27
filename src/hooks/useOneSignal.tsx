import { useEffect, useRef } from 'react';
import { account } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";

interface OneSignalData {
  oneSignalUserId: string; // We focus ONLY on this now
  pushToken?: string;
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth();
  const retryCount = useRef(0);

  useEffect(() => {
    (window as any).median_onesignal_info = async (data: OneSignalData) => {
      console.log("signal data:", data);

      // 1. GET THE PLAYER ID (The "User ID" in OneSignal's system)
      const playerId = data?.oneSignalUserId;

      if (!playerId) {
        if (retryCount.current < 5) {
          retryCount.current++;
          setTimeout(() => {
             window.location.href = 'median://onesignal/info';
          }, 2000);
        }
        return;
      }

      // 2. SAVE TO PREFERENCES (Instead of "Targets")
      if (user?.$id) {
        try {
          // We check if it's already saved to avoid wasted API calls
          if (user.prefs?.oneSignalPlayerId !== playerId) {
            await account.updatePrefs({
              ...user.prefs, // Keep existing prefs
              oneSignalPlayerId: playerId // Save the new ID
            });
            console.log("✅ Player ID Linked:", playerId);
            // toast.success("Device Connected"); 
          }
        } catch (error) {
          console.error("Failed to save Player ID", error);
        }
      }
    };

    // 3. TRIGGER (Standard Median Init)
    if (navigator.userAgent.includes('wv') || window.location.href.includes('median')) {
      const timer = setTimeout(() => {
        window.location.href = 'median://onesignal/info';
      }, 2000);
      return () => clearTimeout(timer);
    }

  }, [user]); 
};

export default useOneSignal;