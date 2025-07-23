import { ClientsList } from "@/components/clients/clients-list";

// This is a Server Component - no "use client" needed
// In a real app, we could fetch clients data here:
// const clients = await getClientsFromSupabase();

export default function ClientsPage() {
  return (
    <div className="animate-in">
      <ClientsList />
    </div>
  );
}