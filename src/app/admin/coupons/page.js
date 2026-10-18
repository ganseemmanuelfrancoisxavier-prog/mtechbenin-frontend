import AdminLayout from "@/components/layout/AdminLayout";
import AdminCoupons from "@/components/admin/AdminCoupons";

export const metadata = { title: "Coupons | Admin MTECHBENIN" };

export default function AdminCouponsPage() {
  return (
    <AdminLayout>
      <AdminCoupons />
    </AdminLayout>
  );
}
