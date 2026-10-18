import AdminLayout from "@/components/layout/AdminLayout";
import AdminAvis from "@/components/admin/AdminAvis";

export const metadata = { title: "Avis clients | Admin MTECHBENIN" };

export default function AdminAvisPage() {
  return (
    <AdminLayout>
      <AdminAvis />
    </AdminLayout>
  );
}
