import AdminLayout from "@/components/layout/AdminLayout";
import AdminCommandes from "@/components/admin/AdminCommandes";

export const metadata = { title: "Commandes | Admin MTECHBENIN" };

export default function AdminCommandesPage() {
  return (
    <AdminLayout>
      <AdminCommandes />
    </AdminLayout>
  );
}
