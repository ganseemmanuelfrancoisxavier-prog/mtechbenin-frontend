"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, AlertCircle, Info } from "lucide-react";
import { setAdminSession } from "@/lib/auth";
import { authApi, settingsApi } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [shopName, setShopName] = useState("MTECHBENIN");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // "invalid" | "not_hashed" | "network"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    settingsApi
      .getPublic()
      .then((data) => {
        if (data.settings?.shopName) setShopName(data.settings.shopName);
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    setErrorType("");

    try {
      await authApi.login(password);
      // Le backend a validé le mot de passe (bcrypt) → on crée la session locale
      setAdminSession(password);
      router.push(from);
    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("hash") || msg.toLowerCase().includes("bcrypt")) {
        setErrorType("not_hashed");
        setError("Le mot de passe en base n'est pas haché. Voir les instructions ci-dessous.");
      } else if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("unauthorized")) {
        setErrorType("invalid");
        setError("Mot de passe incorrect");
      } else {
        setErrorType("network");
        setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[400px] h-[400px] bg-white/[0.015] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-display font-black text-3xl text-white tracking-tight">
            {shopName}
          </span>
          <p className="text-white/25 text-[13px] mt-2 font-medium tracking-widest uppercase">
            Administration
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
          }}
        >
          <h1 className="font-display font-black text-xl text-white mb-1 tracking-tight">
            Connexion
          </h1>
          <p className="text-white/30 text-[13px] mb-7">
            Accès réservé à l&apos;administrateur
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2 block">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                    setErrorType("");
                  }}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full text-white text-[14px] placeholder-white/15 rounded-2xl px-4 py-3.5 pr-12 focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-2xl"
                style={{
                  background: errorType === "not_hashed"
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(227,6,19,0.10)",
                  border: errorType === "not_hashed"
                    ? "1px solid rgba(245,158,11,0.22)"
                    : "1px solid rgba(227,6,19,0.18)",
                }}
              >
                {errorType === "not_hashed" ? (
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-cta flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-[13px] ${errorType === "not_hashed" ? "text-amber-400" : "text-cta"}`}>
                    {error}
                  </p>
                  {errorType === "not_hashed" && (
                    <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                      Exécutez sur le serveur :<br />
                      <code className="font-mono text-white/40">node hash-password.js</code><br />
                      ou utilisez l&apos;endpoint de migration depuis le panel.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!password.trim() || loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[14px] transition-all duration-200 mt-2 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#1D1D1F",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Accéder au panel
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <a
            href="/"
            className="text-white/20 hover:text-white/45 text-[13px] transition-colors"
          >
            ← Retour au site
          </a>
        </p>
      </div>
    </div>
  );
}
