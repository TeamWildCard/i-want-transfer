import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { TDSMobileProvider } from '@toss/tds-mobile';
import type { ReactNode } from 'react';

const browserUserAgent = {
  fontA11y: undefined,
  fontScale: undefined,
  isAndroid: /Android/i.test(navigator.userAgent),
  isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
  colorPreference: window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light',
  safeAreaBottomTransparency: 'opaque',
} as const;

export function RootProvider({ children }: { children: ReactNode }) {
  const hasAppsInTossRuntime = typeof window !== 'undefined' && '__appsInToss' in window;

  if (hasAppsInTossRuntime) {
    return <TDSMobileAITProvider>{children}</TDSMobileAITProvider>;
  }

  return (
    <TDSMobileProvider userAgent={browserUserAgent}>
      {children}
    </TDSMobileProvider>
  );
}
