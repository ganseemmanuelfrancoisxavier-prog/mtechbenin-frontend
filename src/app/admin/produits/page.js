import AdminLayout from "@/components/layout/AdminLayout";
import AdminProduits from "@/components/admin/AdminProduits";

export const metadata = { title: "Produits | Admin MTECHBENIN" };

export default function AdminProduitsPage() {
  return (
    <AdminLayout>
      <AdminProduits />
    </AdminLayout>
  );
}
