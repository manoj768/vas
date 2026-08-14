import { Capacitor } from "@capacitor/core";

export interface DeviceInfo {
  isNative: boolean;
  platform: "android" | "ios" | "web";
  isAndroid: boolean;
  isIos: boolean;
  isWeb: boolean;
}

export const getDeviceInfo = (): DeviceInfo => {
  const platform = Capacitor.getPlatform() as "android" | "ios" | "web";
  const isNative = Capacitor.isNativePlatform();

  return {
    isNative,
    platform,
    isAndroid: platform === "android",
    isIos: platform === "ios",
    isWeb: platform === "web",
  };
};

/**
 * Returns the active Backend API base URL.
 * When running in native Android/iOS WebView with local bundles, it routes to this URL.
 */
export const getApiBaseUrl = (): string => {
  // Check if client-side VITE_API_URL is configured
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  if (metaEnv && metaEnv.VITE_API_URL) {
    return metaEnv.VITE_API_URL;
  }
  
  // Default to relative /api when hosted as a web app
  return "";
};

/**
 * High-accuracy GPS geolocation provider with graceful fallback
 * Works seamlessly in both Native Android (Capacitor) and Mobile/Desktop Browsers
 */
export const getCurrentGpsLocation = async (): Promise<{
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device/browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude || undefined,
          heading: pos.coords.heading || undefined,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
};
