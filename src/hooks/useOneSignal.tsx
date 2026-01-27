import { useEffect } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    median_onesignal_info?: (info: OneSignalInfo) => void;
  }
}

interface OneSignalInfo {
  pushToken: string;       // <--- THIS IS THE RAW FCM TOKEN WE NEED
  subscribed: boolean;
}

// Define a local interface for Preferences to include the missing property
// This assumes Preferences is part of the Appwrite Models or a custom type in AuthContext
interface AppwritePreferences {
  oneSignalPlayerId?: string; // Added the missing property for storing FCM token
  [key: string]: any; // Allow for other arbitrary properties in user.prefs
}

const useOneSignal = () => {
  const { user } = useAuth();

  useEffect(() => {
    // 1. Define the callback Median calls
    window.median_onesignal_info = async (info: OneSignalInfo) => {
      console.log("OneSignal Data:", info);

      // CRITICAL: Extract the raw FCM token
      const fcmToken = info.pushToken; 

      if (!fcmToken) {
        console.warn("OneSignal loaded, but no FCM Token found yet.");
        return;
      }

      if (user?.$id) {
        // Cast user.prefs to our extended type to access oneSignalPlayerId
        const userPrefs = user.prefs as AppwritePreferences;

        // We check if the FCM token is already saved to avoid wasted API calls
        // Assuming 'oneSignalPlayerId' in prefs is used to store the last registered FCM token
        if (userPrefs.oneSignalPlayerId !== fcmToken) { 
          try {
            // 2. Send the RAW FCM TOKEN to Appwrite
            // Replace 'YOUR_FCM_PROVIDER_ID' with the ID from Appwrite Console > Messaging > Providers > FCM
            await account.createPushTarget(
              ID.unique(),
              fcmToken, 
              'YOUR_FCM_PROVIDER_ID' 
            );
            console.log("✅ Appwrite Target Created!");
            
            // Update user preferences with the newly registered FCM token
            await account.updatePrefs({
              oneSignalPlayerId: fcmToken, // Store the FCM token in user preferences
              // You might want to merge with existing preferences if any:
              // ...userPrefs, 
              // oneSignalPlayerId: fcmToken,
            });
            console.log("✅ User preferences updated with new FCM token.");

          } catch (error: any) {
            console.log("Target registration or prefs update failed:", error.message);
          }
        } else {
          console.log("FCM token already registered and saved in preferences.");
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