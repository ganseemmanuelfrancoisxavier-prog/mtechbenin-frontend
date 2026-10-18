import AdminLayout from "@/components/layout/AdminLayout";
import AdminPublicites from "@/components/admin/AdminPublicites";

export const metadata = { title: "Publicités | Admin MTECHBENIN" };

export default function AdminPublicitesPage() {
  return (
    <AdminLayout>
      <AdminPublicites />
    </AdminLayout>
  );
}
