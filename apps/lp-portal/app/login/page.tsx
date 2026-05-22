import { redirect } from 'next/navigation'

// Auth is handled centrally at auth.neweraventures.com.
// Authenticated users who land here (e.g. from an old bookmark) go to /dashboard.
// Unauthenticated users are intercepted upstream by middleware before reaching this page.
export default function LoginPage() {
  redirect('/dashboard')
}
