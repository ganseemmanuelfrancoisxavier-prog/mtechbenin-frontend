import AdminLayout from "@/components/layout/AdminLayout";
import AdminContacts from "@/components/admin/AdminContacts";

export const metadata = { title: "Contacts | Admin MTECHBENIN" };

export default function AdminContactsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Messages de contact
          </h1>
          <p className="text-apple-mid text-sm mt-1">
            Tous les messages envoyés via le formulaire de contact.
          </p>
        </div>
        <AdminContacts />
      </div>
    </AdminLayout>
  );
}
