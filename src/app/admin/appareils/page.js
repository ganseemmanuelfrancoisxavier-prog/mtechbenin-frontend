import AdminLayout from "@/components/layout/AdminLayout";
import AdminSmartphoneDevices from "@/components/admin/AdminSmartphoneDevices";

export const metadata = { title: "Smartphones | Admin MTECHBENIN" };

export default function AdminAppareilsPage() {
  return (
    <AdminLayout>
      <AdminSmartphoneDevices />
    </AdminLayout>
  );
}
