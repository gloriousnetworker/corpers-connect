import { redirect } from 'next/navigation';

// All navigation is now SPA-based. This route redirects to the dashboard.
export default function FeedPage() {
  redirect('/');
}
