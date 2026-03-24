import Dashboard from '@/components/dashboard/Dashboard';

/**
 * Server component — root page for authenticated users.
 * All client-side section-switching lives in the Dashboard client component.
 * This must remain a server component to avoid the Vercel
 * page_client-reference-manifest.js build error.
 */
export default function DashboardRootPage() {
  return <Dashboard />;
}
