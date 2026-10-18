import AdminLayout from "@/components/layout/AdminLayout";
import AdminFaq from "@/components/admin/AdminFaq";

export const metadata = { title: "FAQ | Admin MTECHBENIN" };

export default function AdminFaqPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            FAQ
          </h1>
          <p className="text-apple-mid text-sm mt-1">
            Gérez les questions fréquentes. Glissez pour réorganiser.
          </p>
        </div>
        <AdminFaq />
      </div>
    </AdminLayout>
  );
}
