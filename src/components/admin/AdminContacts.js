"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Eye,
  Archive,
  RotateCcw,
} from "lucide-react";
import { contactsApi } from "@/lib/api";
import useSondagePeriodique from "@/hooks/useSondagePeriodique";

const STATUS_LABELS = {
  new: { label: "Nouveau", color: "bg-blue-100 text-blue-700" },
  read: { label: "Lu", color: "bg-gray-100 text-gray-600" },
  archived: { label: "Archivé", color: "bg-amber-50 text-amber-600" },
};

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total: 0, newCount: 0 });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contactsApi.getAll();
      setContacts(data.contacts || []);
      setStats({ total: data.total || 0, newCount: data.newCount || 0 });
    } catch (err) {
      console.error("Erreur chargement contacts", err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Suspendu quand l'onglet n'est pas visible.
  useSondagePeriodique(load, 60_000);

  const handleStatus = async (id, status) => {
    const wasNew = contacts.find((c) => c.id === id)?.status === "new";
    try {
      await contactsApi.updateStatus(id, status);
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      // newCount ne compte que les messages encore au statut "new" — on ne le
      // décrémente que si ce message en sortait vraiment (pas, par exemple,
      // en désarchivant un message déjà "archived", donc déjà exclu du compte).
      if (status !== "new" && wasNew) {
        setStats((prev) => ({
          ...prev,
          newCount: Math.max(0, prev.newCount - 1),
        }));
      }
    } catch (err) {
      console.error("Erreur updateStatus", err.message);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await contactsApi.delete(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setStats((prev) => {
        const deleted = contacts.find((c) => c.id === id);
        return {
          total: Math.max(0, prev.total - 1),
          newCount:
            deleted?.status === "new"
              ? Math.max(0, prev.newCount - 1)
              : prev.newCount,
        };
      });
    } catch (err) {
      console.error("Erreur deleteContact", err.message);
    }
    setDeleting(null);
    setDeleteConfirm(null);
  };

  const displayed = contacts.filter((c) => {
    if (filter === "new") return c.status === "new";
    if (filter === "read") return c.status === "read";
    if (filter === "archived") return c.status === "archived";
    return true;
  });

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total messages",
            value: stats.total,
            color: "text-apple-black",
          },
          {
            label: "Non lus",
            value: stats.newCount,
            color: stats.newCount > 0 ? "text-blue-600" : "text-apple-black",
          },
          {
            label: "Archivés",
            value: contacts.filter((c) => c.status === "archived").length,
            color: "text-amber-600",
          },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <p className="text-apple-mid text-xs font-medium mb-1">{s.label}</p>
            <p className={`font-display font-black text-2xl ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filtres + refresh */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "Tous" },
            {
              key: "new",
              label: `Nouveaux${stats.newCount > 0 ? ` (${stats.newCount})` : ""}`,
            },
            { key: "read", label: "Lus" },
            { key: "archived", label: "Archivés" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                filter === f.key
                  ? "bg-apple-black text-white"
                  : "bg-apple-gray text-apple-mid hover:text-apple-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-apple-mid hover:text-apple-black bg-apple-gray transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Liste */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-10 h-10 text-apple-mid/30 mx-auto mb-3" />
          <p className="text-apple-mid text-sm">Aucun message</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((contact) => {
            const isOpen = expanded === contact.id;
            const st = STATUS_LABELS[contact.status] || STATUS_LABELS.read;

            return (
              <div
                key={contact.id}
                className={`glass-card rounded-2xl overflow-hidden transition-all ${
                  contact.status === "new" ? "ring-1 ring-blue-200" : ""
                }`}
              >
                {/* En-tête cliquable */}
                <button
                  className="w-full flex items-start gap-4 p-5 text-left"
                  onClick={() => {
                    setExpanded(isOpen ? null : contact.id);
                    if (!isOpen && contact.status === "new") {
                      handleStatus(contact.id, "read");
                    }
                  }}
                >
                  <div className="w-9 h-9 rounded-2xl bg-apple-black/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4 text-apple-mid" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-apple-black text-sm">
                        {contact.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-apple-black text-[13px] font-medium truncate">
                      {contact.subject}
                    </p>
                    <p className="text-apple-mid text-xs mt-0.5 truncate">
                      {contact.message}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-apple-mid text-[11px]">
                      {formatDate(contact.createdAt)}
                    </p>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-apple-mid/50" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-apple-mid/50" />
                    )}
                  </div>
                </button>

                {/* Détail développé */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-black/[0.05]">
                    <div className="flex flex-wrap gap-3 mt-4 mb-4 text-[12px]">
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 font-medium hover:bg-green-100 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {contact.whatsapp}
                      </a>
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </a>
                      )}
                    </div>

                    <div className="bg-apple-gray rounded-2xl p-4 mb-4">
                      <p className="text-apple-black text-sm leading-relaxed whitespace-pre-wrap">
                        {contact.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {contact.status !== "read" && (
                        <button
                          onClick={() => handleStatus(contact.id, "read")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-apple-gray text-apple-mid hover:text-apple-black transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Marquer lu
                        </button>
                      )}
                      {contact.status !== "archived" ? (
                        <button
                          onClick={() => handleStatus(contact.id, "archived")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                        >
                          <Archive className="w-3.5 h-3.5" /> Archiver
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatus(contact.id, "read")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-apple-gray text-apple-mid hover:text-apple-black transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Désarchiver
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${contact.name}, concernant votre message "${contact.subject}" — `)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-green-50 text-green-700 hover:bg-green-100 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Répondre sur WhatsApp
                      </a>
                      <button
                        onClick={() => setDeleteConfirm(contact.id)}
                        disabled={deleting === contact.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting === contact.id ? "..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Supprimer ce message ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl glass-card text-apple-black font-semibold text-sm hover:bg-apple-gray transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
