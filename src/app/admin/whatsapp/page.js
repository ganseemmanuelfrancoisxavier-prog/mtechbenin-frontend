import AdminLayout from "@/components/layout/AdminLayout";
import AdminWhatsapp from "@/components/admin/AdminWhatsapp";

export const metadata = { title: "WhatsApp | Admin MTECHBENIN" };

export default function AdminWhatsappPage() {
  return (
    <AdminLayout>
      <AdminWhatsapp />
    </AdminLayout>
  );
}
