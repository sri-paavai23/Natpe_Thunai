import { useEffect } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';

// We define the interface locally to ensure we handle the data correctly
// regardless of what other type files say.
interface OneSignalData {
  oneSignalUserId: string; 
  pushToken: string;       
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth();

  useEffect(() => {
    // FIX: Cast window to 'any' to bypass the "Subsequent property declarations" TypeScript error.
    // This effectively overrides any conflicting global type definitions for this specific function.
    (window as any).median_onesignal_info = async (data: OneSignalData) => {
      console.log("OneSignal Data:", data);

      // CRITICAL: Extract the raw FCM token
      // We use optional chaining (?.) just in case the data structure differs slightly
      const fcmToken = data?.pushToken; 

      if (!fcmToken) {
        console.warn("OneSignal loaded, but no FCM Token found yet.");
        return;
      }

      if (user?.$id) {
        try {
          // 2. Send the RAW FCM TOKEN to Appwrite
          // Replace 'YOUR_FCM_PROVIDER_ID' with the exact ID from Appwrite Console > Messaging > Providers > FCM
          await account.createPushTarget(
            ID.unique(),
            fcmToken, 
            'YOUR_FCM_PROVIDER_ID' 
          );
          console.log("✅ Appwrite Target Created!");
        } catch (error: any) {
          // Ignore "Target already exists" errors as they are expected
          console.log("Target registration:", error.message);
        }
      }
    };

    // 3. Trigger the request
    // We check if we are in the app wrapper (WebView)
    if (navigator.userAgent.includes('wv') || window.location.href.indexOf('median') > -1) {
        // Give the native plugin a moment to initialize before asking for info
        const timer = setTimeout(() => {
            window.location.href = 'median://onesignal/info';
        }, 3000);

        return () => clearTimeout(timer);
    }

  }, [user]); 
};

export default useOneSignal;