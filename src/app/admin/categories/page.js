import AdminLayout from "@/components/layout/AdminLayout";
import AdminCategories from "@/components/admin/AdminCategories";

export const metadata = { title: "Catégories | Admin MTECHBENIN" };

export default function AdminCategoriesPage() {
  return (
    <AdminLayout>
      <AdminCategories />
    </AdminLayout>
  );
}
