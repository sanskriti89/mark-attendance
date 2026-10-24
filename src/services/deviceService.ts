import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const DEVICE_ID_KEY = '@attendiq_persistent_device_id';

/**
 * Returns a persistent unique device identifier across sessions.
 * 1. On Android Native: Uses hardware Android ID
 * 2. On iOS Native: Uses ID for Vendor
 * 3. On Web / Fallback: Generates a persistent random UUID stored in AsyncStorage
 */
export const getUniqueDeviceId = async (): Promise<string> => {
  try {
    if (Platform.OS === 'android') {
      const androidId = Application.getAndroidId();
      if (androidId && androidId.trim().length > 0) {
        return `android_${androidId}`;
      }
    } else if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId && iosId.trim().length > 0) {
        return `ios_${iosId}`;
      }
    }

    // Web or native fallback: persistent ID stored in AsyncStorage
    let storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!storedId) {
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timestampPart = Date.now().toString(36);
      storedId = `ggu_dev_${timestampPart}_${randomPart}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, storedId);
    }
    return storedId;
  } catch (err) {
    console.warn('Error reading device ID:', err);
    return `fallback_${Date.now()}`;
  }
};
