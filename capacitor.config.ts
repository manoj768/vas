import type { CapacitorConfig } from "@capacitor/cli";

/**
 * -------------------------------------------------------------------------------
 * MOBILE BACKEND URL CONFIGURATION (FOR ANDROID & IOS)
 * -------------------------------------------------------------------------------
 * Replace 'https://YOUR-BACKEND-URL-OR-TUNNEL.trycloudflare.com' below with:
 * 
 * 1. Cloudflare Public Tunnel (For field 4G/5G testing):
 *    url: "https://your-custom-subdomain.trycloudflare.com"
 * 
 * 2. Office Wi-Fi LAN IP (For local testing on same Wi-Fi):
 *    url: "http://192.168.1.100:3000"
 * 
 * 3. Android Emulator (Running on your local computer):
 *    url: "http://10.0.2.2:3000"
 * 
 * 4. Production Domain (When deployed on Cloud VPS):
 *    url: "https://api.drrconsultants.in"
 * -------------------------------------------------------------------------------
 */
const BACKEND_PLACEHOLDER_URL = "https://YOUR-BACKEND-URL-OR-TUNNEL.trycloudflare.com";

const config: CapacitorConfig = {
  appId: "in.drrconsultants.valuation",
  appName: "Valuation & Site Inspection Studio",
  webDir: "dist",
  server: {
    // ⬇️ DUMMY URL PLACEHOLDER FOR ANDROID & IOS
    // Simply change BACKEND_PLACEHOLDER_URL above and run `npx cap sync`
    url: BACKEND_PLACEHOLDER_URL,
    
    // Cleartext is allowed for local debugging tunnels/LAN testing (HTTP)
    cleartext: true,
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    // Allow mixed content during local tunnel development
    allowMixedContent: true,
  },
  ios: {
    // Allows background and local network access
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
