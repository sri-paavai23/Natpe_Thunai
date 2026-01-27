import { useEffect, useRef } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';

// Interface for the data Median returns
interface OneSignalData {
  oneSignalUserId: string; // The OneSignal Player ID
  pushToken?: string;      // The Raw FCM Token (might be missing initially)
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth();
  const retryCount = useRef(0);
  const maxRetries = 5; // Try 5 times (approx 15 seconds)

  useEffect(() => {
    // 1. Define the callback function globally
    // We cast window to 'any' to avoid TypeScript errors with the custom Median function
    (window as any).median_onesignal_info = async (data: OneSignalData) => {
      console.log("OneSignal Info Received:", data);

      // Try to find the token in likely fields
      const fcmToken = data?.pushToken;

      // 2. RETRY LOGIC: If no token, wait and try again
      if (!fcmToken) {
        if (retryCount.current < maxRetries) {
          console.log(`No FCM token yet. Retrying (${retryCount.current + 1}/${maxRetries})...`);
          retryCount.current += 1;
          setTimeout(() => {
            window.location.href = 'median://onesignal/info';
          }, 3000); // Wait 3 seconds
        } else {
          console.warn("OneSignal initialized, but FCM Token never arrived.");
        }
        return;
      }

      // 3. SUCCESS: We have the token!
      if (user?.$id) {
        try {
          // Check if we already registered this specific token to avoid console spam
          // (Optimization: Appwrite throws 409 if it exists, which is fine)
          await account.createPushTarget(
            ID.unique(),
            fcmToken, 
            '69788b1f002fcdf4fae1' // Your Appwrite FCM Provider ID
          );
          console.log("✅ Appwrite Push Target Registered Successfully");
        } catch (error: any) {
          // If it already exists (409), that's perfect.
          if (error.code !== 409) {
            console.error("Target Registration Error:", error.message);
          }
        }
      }
    };

    // 4. Initial Trigger
    // We wait a moment for the native plugin to warm up
    if (navigator.userAgent.includes('wv') || window.location.href.includes('median')) {
      const timer = setTimeout(() => {
        window.location.href = 'median://onesignal/info';
      }, 2000);
      return () => clearTimeout(timer);
    }

  }, [user]); 
};

export default useOneSignal;