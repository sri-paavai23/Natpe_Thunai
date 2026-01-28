import { useEffect, useRef } from 'react';
import { account } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';

interface OneSignalData {
  oneSignalUserId: string; // The Player ID
  pushToken?: string;
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth();
  const retryCount = useRef(0);

  useEffect(() => {
    // Listener for Median/OneSignal
    (window as any).median_onesignal_info = async (data: OneSignalData) => {
      const playerId = data?.oneSignalUserId;

      // Retry logic if OneSignal is slow to init
      if (!playerId) {
        if (retryCount.current < 5) {
          retryCount.current++;
          setTimeout(() => {
             window.location.href = 'median://onesignal/info';
          }, 2000);
        }
        return;
      }

      // CRITICAL: Save the Player ID to Appwrite Preferences
      if (user?.$id) {
        try {
          // Only update if it's different to save bandwidth
          if (user.prefs?.oneSignalPlayerId !== playerId) {
            await account.updatePrefs({
              ...user.prefs, 
              oneSignalPlayerId: playerId 
            });
            console.log("✅ Device Linked to User:", playerId);
          }
        } catch (error) {
          console.error("Failed to save Device ID", error);
        }
      }
    };

    // Trigger the Native Call
    if (navigator.userAgent.includes('wv') || window.location.href.includes('median')) {
      const timer = setTimeout(() => {
        window.location.href = 'median://onesignal/info';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]); 
};

export default useOneSignal;