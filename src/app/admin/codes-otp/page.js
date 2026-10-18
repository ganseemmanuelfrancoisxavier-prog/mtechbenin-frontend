import AdminLayout from "@/components/layout/AdminLayout";
import AdminJournalCodes from "@/components/admin/AdminJournalCodes";

export const metadata = { title: "Journal des codes | Admin MTECHBENIN" };

export default function AdminJournalCodesPage() {
  return (
    <AdminLayout>
      <AdminJournalCodes />
    </AdminLayout>
  );
}
