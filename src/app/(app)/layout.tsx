import AppShell from '@/components/layout/AppShell';

/**
 * App layout — wraps all authenticated screens with:
 * - Top bar
 * - Scrollable content area
 * - Bottom navigation
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
