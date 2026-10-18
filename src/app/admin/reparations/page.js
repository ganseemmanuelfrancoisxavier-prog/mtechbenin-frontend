import AdminLayout from "@/components/layout/AdminLayout";
import AdminReparations from "@/components/admin/AdminReparations";

export const metadata = { title: "Réparations | Admin MTECHBENIN" };

export default function AdminReparationsPage() {
  return (
    <AdminLayout>
      <AdminReparations />
    </AdminLayout>
  );
}
