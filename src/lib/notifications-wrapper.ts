import { Platform } from "react-native";
import Constants from "expo-constants";

const isExpoGo = !Constants?.expoConfig?.android?.package && !Constants?.expoConfig?.ios?.bundleIdentifier;

// Export a safe version that works in all environments
export const Notifications = isExpoGo ? null : require('expo-notifications');

export async function ensureNotificationPermission(): Promise<boolean> {
    if (isExpoGo || !Notifications) {
        console.log('Notifications not available in Expo Go');
        return false;
    }

    try {
        // ... notification code
        return true;
    } catch (error) {
        console.warn('Notification error:', error);
        return false;
    }
}