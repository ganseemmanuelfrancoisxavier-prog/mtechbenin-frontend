"use client";

import { useEffect, useState } from "react";
import useSettingsStore from "@/store/settingsStore";

export default function MaintenancePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { shopName, shopWhatsapp, maintenanceMessage } = useSettingsStore();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-60 left-1/4 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute -bottom-60 right-1/4 w-[400px] h-[400px] bg-white/[0.015] rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        <span className="font-display font-black text-3xl text-white tracking-tight">
          {mounted ? shopName : "MTECHBENIN"}
        </span>

        <div className="mt-10 mb-6">
          <div className="text-6xl mb-6">🔧</div>
          <h1 className="font-display font-black text-2xl text-white mb-4 tracking-tight">
            Site en maintenance
          </h1>
          <p className="text-white/50 text-[15px] leading-relaxed">
            {mounted
              ? maintenanceMessage
              : "Site en maintenance. Nous revenons très bientôt !"}
          </p>
        </div>

        {mounted && shopWhatsapp && (
          <a
            href={`https://wa.me/${shopWhatsapp.replace(/\s/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-[14px] transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            💬 Nous contacter sur WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
