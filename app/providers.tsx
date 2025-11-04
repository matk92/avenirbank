'use client';

import type { ReactNode } from 'react';
import { ClientDataProvider } from '@/contexts/ClientDataContext';
import { I18nProvider } from '@/contexts/I18nContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ClientDataProvider>{children}</ClientDataProvider>
    </I18nProvider>
  );
}
