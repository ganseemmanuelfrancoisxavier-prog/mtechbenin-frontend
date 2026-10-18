import AdminLayout from "@/components/layout/AdminLayout";
import AdminCaracteristiques from "@/components/admin/AdminCaracteristiques";

export const metadata = { title: "Caractéristiques | Admin MTECHBENIN" };

export default function AdminCaracteristiquesPage() {
  return (
    <AdminLayout>
      <AdminCaracteristiques />
    </AdminLayout>
  );
}
