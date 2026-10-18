import { Suspense } from "react";
import AdminLogin from "@/components/admin/AdminLogin";

export const metadata = { title: "Connexion Admin | MTECHBENIN" };

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLogin />
    </Suspense>
  );
}
