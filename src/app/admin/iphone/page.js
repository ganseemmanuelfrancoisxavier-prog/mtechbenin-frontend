import AdminLayout from "@/components/layout/AdminLayout";
import AdminIPhoneCatalog from "@/components/admin/AdminIPhoneCatalog";

export const metadata = { title: "Catalogue iPhone | Admin MTECHBENIN" };

export default function AdminIPhonePage() {
  return (
    <AdminLayout>
      <AdminIPhoneCatalog />
    </AdminLayout>
  );
}
