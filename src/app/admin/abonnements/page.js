import AdminLayout from "@/components/layout/AdminLayout";
import AdminAbonnements from "@/components/admin/AdminAbonnements";

export const metadata = { title: "Abonnements | Admin MTECHBENIN" };

export default function AdminAbonnementsPage() {
  return (
    <AdminLayout>
      <AdminAbonnements />
    </AdminLayout>
  );
}
