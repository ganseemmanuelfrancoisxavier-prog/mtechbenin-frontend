import AdminLayout from "@/components/layout/AdminLayout";
import AdminClientMedia from "@/components/admin/AdminClientMedia";

export const metadata = { title: "Clients satisfaits | Admin MTECHBENIN" };

export default function AdminClientMediaPage() {
  return (
    <AdminLayout>
      <AdminClientMedia />
    </AdminLayout>
  );
}
