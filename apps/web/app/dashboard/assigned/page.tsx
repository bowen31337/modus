import { redirect } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function AssignedPage() {
  // Redirect to main dashboard since assigned is a client-side filter
  redirect('/dashboard');
}
