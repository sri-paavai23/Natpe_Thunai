import { useEffect } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    median_onesignal_info?: (data: OneSignalData) => void;
  }
}

interface OneSignalData {
  oneSignalUserId: string; // OneSignal Player ID (We DON'T want this for Appwrite FCM)
  pushToken: string;       // <--- THIS IS THE RAW FCM TOKEN WE NEED
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth();

  useEffect(() => {
    // 1. Define the callback Median calls
    window.median_onesignal_info = async (data: OneSignalData) => {
      console.log("OneSignal Data:", data);

      // CRITICAL: Extract the raw FCM token
      const fcmToken = data.pushToken; 

      if (!fcmToken) {
        console.warn("OneSignal loaded, but no FCM Token found yet.");
        return;
      }

      if (user?.$id) {
        try {
          // 2. Send the RAW FCM TOKEN to Appwrite
          // Replace 'YOUR_FCM_PROVIDER_ID' with the ID from Appwrite Console > Messaging > Providers > FCM
          await account.createPushTarget(
            ID.unique(),
            fcmToken, 
            'YOUR_FCM_PROVIDER_ID' 
          );
          console.log("✅ Appwrite Target Created!");
          // alert("Debug: Target Created!"); // Uncomment to debug on phone
        } catch (error: any) {
          console.log("Target registration:", error.message);
        }
      }
    };

    // 3. Trigger the request
    // We check if we are in the app wrapper
    if (navigator.userAgent.includes('wv') || window.location.href.indexOf('median') > -1) {
        // Give the native plugin a moment to initialize
        setTimeout(() => {
            window.location.href = 'median://onesignal/info';
        }, 3000);
    }

  }, [user]); 
};

export default useOneSignal;