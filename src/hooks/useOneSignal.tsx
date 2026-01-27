import { useEffect, useRef } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';

interface OneSignalData {
  oneSignalUserId: string;
  pushToken?: string;      // The Raw FCM Token we need
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth();
  const retryCount = useRef(0);
  const maxRetries = 10; // Try for 30 seconds

  useEffect(() => {
    // 1. Define the Listener
    (window as any).median_onesignal_info = async (data: OneSignalData) => {
      console.log("signal received:", data);

      const fcmToken = data?.pushToken;

      // 2. RETRY LOGIC: If OneSignal hasn't fetched the token yet...
      if (!fcmToken) {
        if (retryCount.current < maxRetries) {
          console.log(`Waiting for FCM Token... (${retryCount.current + 1}/${maxRetries})`);
          retryCount.current += 1;
          setTimeout(() => {
            window.location.href = 'median://onesignal/info';
          }, 3000); // Wait 3 seconds and ask again
        } else {
          console.warn("Gave up waiting for FCM Token.");
        }
        return;
      }

      // 3. SUCCESS: We have the token! Send to Appwrite.
      if (user?.$id) {
        try {
          // Replace 'YOUR_FCM_PROVIDER_ID' with the ID from Appwrite > Messaging > Providers
          await account.createPushTarget(
            ID.unique(),
            fcmToken, 
            '69788b1f002fcdf4fae1' 
          );
          console.log("✅ Appwrite Target Registered!");
        } catch (error: any) {
          // Ignore "Target already exists" (409) errors
          if (error.code !== 409) console.error("Registration Error:", error.message);
        }
      }
    };

    // 4. Start the Process (Only on Mobile)
    if (navigator.userAgent.includes('wv') || window.location.href.includes('median')) {
      const timer = setTimeout(() => {
        window.location.href = 'median://onesignal/info';
      }, 2000);
      return () => clearTimeout(timer);
    }

  }, [user]); 
};

export default useOneSignal;