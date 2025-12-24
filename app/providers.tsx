'use client';

import type { ReactNode } from 'react';
import { ClientDataProvider } from '@/contexts/ClientDataContext';
import { DirectorDataProvider } from '@/contexts/DirectorDataContext';
import { AdvisorDataProvider } from '@/contexts/AdvisorDataContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { I18nProvider } from '@/contexts/I18nContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ClientDataProvider>
        <DirectorDataProvider>
          <AdvisorDataProvider>
            <MessagingProvider>
              {children}
            </MessagingProvider>
          </AdvisorDataProvider>
        </DirectorDataProvider>
      </ClientDataProvider>
    </I18nProvider>
  );
}