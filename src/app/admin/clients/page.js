import AdminLayout from "@/components/layout/AdminLayout";
import AdminClients from "@/components/admin/AdminClients";

export const metadata = { title: "Clients | Admin MTECHBENIN" };

export default function AdminClientsPage() {
  return (
    <AdminLayout>
      <AdminClients />
    </AdminLayout>
  );
}
