import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'pay-2',
  brand: {
    displayName: '송금하고 싶어',
    primaryColor: '#3182F6',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'npm run web:dev',
      build: 'npm run web:build',
    },
  },
  webViewProps: {
    type: 'game',
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
    allowsBackForwardNavigationGestures: false,
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
  },
  permissions: [],
  outdir: 'dist',
});
