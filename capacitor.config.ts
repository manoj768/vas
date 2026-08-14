import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.drrconsultants.valuation",
  appName: "Valuation & Site Inspection Studio",
  webDir: "dist",
  server: {
    // Cleartext is allowed for local debugging tunnels/LAN testing
    cleartext: true,
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
