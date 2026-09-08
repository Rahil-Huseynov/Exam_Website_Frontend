import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imtahanver.app',
  appName: 'ImtahanVer',

  server: {
    url: 'https://imtahanver.net',
    cleartext: false,
  },
};

export default config;