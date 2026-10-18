import AdminLayout from "@/components/layout/AdminLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = { title: "Dashboard Admin | MTECHBENIN" };

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
