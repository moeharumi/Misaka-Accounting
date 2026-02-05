import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rainmoe.misaka_ledger',
  appName: '御坂记账',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
