import { redirect } from 'next/navigation';

// Root page — middleware handles the redirect logic
// This is a fallback in case middleware is bypassed
export default function RootPage() {
  redirect('/feed');
}
