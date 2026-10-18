import AdminLayout from "@/components/layout/AdminLayout";
import AdminHeroMedia from "@/components/admin/AdminHeroMedia";

export const metadata = { title: "Hero Médias | Admin MTECHBENIN" };

export default function AdminHeroPage() {
  return (
    <AdminLayout>
      <AdminHeroMedia />
    </AdminLayout>
  );
}
