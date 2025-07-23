import { SessionList } from "@/components/sessions/session-list";

// Server Component - no "use client" needed
// In a real app, we could fetch sessions data here:
// const sessions = await getSessionsFromSupabase();

export default function SessionsPage() {
  return (
    <div className="animate-in">
      <SessionList />
    </div>
  );
}