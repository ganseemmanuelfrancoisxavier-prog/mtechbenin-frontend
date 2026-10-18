import AdminLayout from "@/components/layout/AdminLayout";
import AdminParametres from "@/components/admin/AdminParametres";

export const metadata = { title: "Paramètres | Admin MTECHBENIN" };

export default function AdminParametresPage() {
  return (
    <AdminLayout>
      <AdminParametres />
    </AdminLayout>
  );
}
