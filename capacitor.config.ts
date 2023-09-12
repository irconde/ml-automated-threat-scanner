import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'edu.ualr.mia',
  appName: 'Pilot GUI',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
