'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import QueryProvider from './QueryProvider';
import AuthProvider from './AuthProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="cc_theme"
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                maxWidth: '360px',
              },
              classNames: {
                toast: 'rounded-xl shadow-card',
                success: 'bg-[#E8F5EE] text-[#008751] border-[#008751]/20',
                error: 'bg-red-50 text-red-700 border-red-200',
              },
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
