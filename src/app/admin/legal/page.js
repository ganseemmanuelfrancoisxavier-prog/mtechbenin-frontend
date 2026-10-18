import AdminLayout from "@/components/layout/AdminLayout";
import AdminLegal from "@/components/admin/AdminLegal";

export const metadata = { title: "Pages Légales | Admin MTECHBENIN" };

export default function AdminLegalPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Pages Légales
          </h1>
          <p className="text-apple-mid text-sm mt-1">
            Rédigez et publiez vos pages légales avec l&apos;éditeur riche.
          </p>
        </div>
        <AdminLegal />
      </div>
    </AdminLayout>
  );
}
