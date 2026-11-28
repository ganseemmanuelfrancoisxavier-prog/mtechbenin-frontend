"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, RefreshCw } from "lucide-react";
import { characteristicsApi } from "@/lib/api";

export default function AdminCaracteristiques() {
  const [characteristics, setCharacteristics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorProducts, setErrorProducts] = useState([]);
  const [notice, setNotice] = useState("");

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const [newValueDrafts, setNewValueDrafts] = useState({});
  const [addingValueId, setAddingValueId] = useState(null);
  const [editingValueId, setEditingValueId] = useState(null);
  const [editingValueDraft, setEditingValueDraft] = useState("");
  const [savingValueId, setSavingValueId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setErrorProducts([]);
    try {
      const data = await characteristicsApi.getAll();
      setCharacteristics(data.characteristics || []);
    } catch (err) {
      setError("Chargement impossible — " + (err.message || "réessayez"));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Efface les messages précédents avant une nouvelle action, pour ne pas
  // laisser un ancien message de succès à côté d'une nouvelle erreur.
  const clearMessages = () => {
    setError("");
    setErrorProducts([]);
    setNotice("");
  };

  // Sur un 409, le serveur renvoie `produits` : la liste des produits qui
  // bloquent l'action. On l'affiche à côté du message pour indiquer à
  // l'administrateur où intervenir plutôt que de subir un échec sec.
  const showError = (err, fallback) => {
    setError(err.message || fallback);
    setErrorProducts(err.data?.produits || []);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    clearMessages();
    try {
      await characteristicsApi.create({ name });
      setNewName("");
      await load();
    } catch (err) {
      showError(err, "Création impossible");
    }
    setCreating(false);
  };

  const startRename = (c) => {
    clearMessages();
    setRenamingId(c.id);
    setRenameValue(c.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRename = async (c) => {
    const name = renameValue.trim();
    if (!name || name === c.name) {
      cancelRename();
      return;
    }
    // Renommer propage le nouveau nom aux produits rattachés côté serveur,
    // mais les paniers déjà en cours sont stockés en local sur l'appareil du
    // client et garderont l'ancien nom : le calcul de prix refuse désormais
    // une caractéristique inconnue, ce qui rend ces paniers impayables sans
    // que le client comprenne pourquoi. `c._count.usedBy` est déjà chargé —
    // on prévient AVANT d'envoyer la requête, pas après coup.
    const produitsConcernes = c._count?.usedBy || 0;
    if (produitsConcernes > 0) {
      const confirmed = window.confirm(
        `Renommer « ${c.name} » en « ${name} » va mettre à jour ${produitsConcernes} produit${produitsConcernes > 1 ? "s" : ""}.\n\n` +
          `Les paniers déjà en cours chez des clients sur ces produits gardent l'ancien nom « ${c.name} » : ` +
          `le paiement sera refusé tant que ces clients n'auront pas rechargé la page produit et refait leur choix.\n\n` +
          `Continuer le renommage ?`,
      );
      if (!confirmed) return;
    }
    setRenaming(true);
    clearMessages();
    try {
      const data = await characteristicsApi.update(c.id, { name });
      // Renommer propage le nouveau nom aux produits déjà rattachés : c'est
      // une conséquence que l'administrateur doit voir, pas un détail interne.
      const n = data.produitsMisAJour || 0;
      setNotice(
        n > 0
          ? `« ${name} » renommée — ${n} produit${n > 1 ? "s" : ""} mis à jour.`
          : `« ${name} » renommée.`,
      );
      cancelRename();
      await load();
    } catch (err) {
      showError(err, "Modification impossible");
    }
    setRenaming(false);
  };

  const handleDeleteCharacteristic = async (c) => {
    if (!window.confirm(`Supprimer la caractéristique « ${c.name} » ?`)) return;
    clearMessages();
    try {
      await characteristicsApi.remove(c.id);
      await load();
    } catch (err) {
      showError(err, "Suppression impossible");
    }
  };

  const handleAddValue = async (charId) => {
    const value = (newValueDrafts[charId] || "").trim();
    if (!value) return;
    setAddingValueId(charId);
    clearMessages();
    try {
      await characteristicsApi.addValue(charId, { value });
      setNewValueDrafts((p) => ({ ...p, [charId]: "" }));
      await load();
    } catch (err) {
      showError(err, "Ajout impossible");
    }
    setAddingValueId(null);
  };

  const cancelEditValue = () => {
    setEditingValueId(null);
    setEditingValueDraft("");
  };

  const handleUpdateValue = async (v) => {
    const value = editingValueDraft.trim();
    if (!value) return;
    if (value === v.value) {
      cancelEditValue();
      return;
    }
    const uses = Number(v._count?.usedBy || 0);
    if (uses > 0 && !window.confirm(
      `« ${v.value} » est utilisée dans ${uses} option${uses > 1 ? "s" : ""} de produit. La modification mettra à jour les produits liés. Les clients ayant déjà cette option dans leur panier devront recharger la page et refaire leur choix. Continuer ?`,
    )) return;

    setSavingValueId(v.id);
    clearMessages();
    try {
      const result = await characteristicsApi.updateValue(v.id, { value });
      const products = Number(result.produitsMisAJour || 0);
      setNotice(products > 0
        ? `« ${v.value} » remplacée par « ${value} » — ${products} produit${products > 1 ? "s" : ""} mis à jour.`
        : `Valeur modifiée en « ${value} ».`);
      cancelEditValue();
      await load();
    } catch (err) {
      showError(err, "Modification impossible");
    } finally {
      setSavingValueId(null);
    }
  };

  const handleRemoveValue = async (v) => {
    if (!window.confirm(`Retirer la valeur « ${v.value} » ?`)) return;
    clearMessages();
    try {
      await characteristicsApi.removeValue(v.id);
      await load();
    } catch (err) {
      showError(err, "Suppression impossible");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Caractéristiques
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            Bibliothèque de caractéristiques réutilisables (Couleur, Stockage, Arôme…) et leurs valeurs.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-apple-mid hover:text-apple-black bg-apple-gray transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {notice && (
        <p className="text-green-700 text-[13px] bg-green-50 rounded-xl px-4 py-3">{notice}</p>
      )}

      {error && (
        <div className="text-red-600 text-[13px] bg-red-50 rounded-xl px-4 py-3 space-y-1.5">
          <p>{error}</p>
          {errorProducts.length > 0 && (
            <ul className="list-disc list-inside text-red-500 text-[12px]">
              {errorProducts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="glass-card rounded-3xl p-5">
        <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
          Nouvelle caractéristique
        </label>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Ex : Couleur, Stockage, Arôme…"
            className="flex-1 bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-apple-black text-white hover:bg-neutral-800 transition disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> {creating ? "Création..." : "Créer"}
          </button>
        </div>
      </div>

      {characteristics.length === 0 && !loading ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <p className="text-apple-mid text-sm">Aucune caractéristique pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characteristics.map((c) => (
            <div key={c.id} className="glass-card rounded-3xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {renamingId === c.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(c);
                          if (e.key === "Escape") cancelRename();
                        }}
                        className="flex-1 bg-black/[0.03] text-apple-black text-[14px] rounded-xl px-3 py-2 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                      />
                      <button
                        onClick={() => handleRename(c)}
                        disabled={renaming}
                        aria-label="Enregistrer"
                        className="p-1.5 rounded-lg hover:bg-black/[0.05] transition disabled:opacity-40"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={cancelRename}
                        aria-label="Annuler"
                        className="p-1.5 rounded-lg hover:bg-black/[0.05] transition"
                      >
                        <X className="w-4 h-4 text-apple-mid" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-display font-bold text-[15px] text-apple-black truncate">
                        {c.name}
                      </h3>
                      <p className="text-apple-mid text-[12px] mt-0.5">
                        {c._count?.usedBy > 0
                          ? `Utilisée par ${c._count.usedBy} produit${c._count.usedBy > 1 ? "s" : ""}`
                          : "Non utilisée"}
                      </p>
                    </>
                  )}
                </div>
                {renamingId !== c.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startRename(c)}
                      aria-label="Renommer"
                      className="p-1.5 rounded-lg hover:bg-black/[0.05] transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-apple-mid" />
                    </button>
                    <button
                      onClick={() => handleDeleteCharacteristic(c)}
                      aria-label="Supprimer"
                      className="p-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(c.values || []).length === 0 ? (
                  <p className="text-apple-mid/60 text-[12px]">Aucune valeur.</p>
                ) : (
                  c.values.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex min-w-0 items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] text-apple-black"
                    >
                      {editingValueId === v.id ? (
                        <>
                          <input
                            autoFocus
                            value={editingValueDraft}
                            onChange={(event) => setEditingValueDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleUpdateValue(v);
                              if (event.key === "Escape") cancelEditValue();
                            }}
                            aria-label={`Nouvelle valeur pour ${v.value}`}
                            className="w-28 min-w-0 bg-transparent outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateValue(v)}
                            disabled={savingValueId === v.id || !editingValueDraft.trim()}
                            aria-label={`Enregistrer ${v.value}`}
                            className="rounded-full p-0.5 transition hover:bg-green-100 disabled:opacity-40"
                          >
                            <Check className="h-3.5 w-3.5 text-green-700" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditValue}
                            aria-label="Annuler la modification"
                            className="rounded-full p-0.5 transition hover:bg-black/[0.08]"
                          >
                            <X className="h-3.5 w-3.5 text-apple-mid" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="min-w-0">{v.value}</span>
                          <button
                            type="button"
                            onClick={() => {
                              clearMessages();
                              setEditingValueId(v.id);
                              setEditingValueDraft(v.value);
                            }}
                            aria-label={`Modifier ${v.value}`}
                            className="rounded-full p-0.5 transition hover:bg-black/[0.08]"
                          >
                            <Pencil className="h-3 w-3 text-apple-mid" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(v)}
                            aria-label={`Retirer ${v.value}`}
                            className="rounded-full p-0.5 transition hover:bg-red-100"
                          >
                            <X className="h-3 w-3 text-apple-mid hover:text-red-500" />
                          </button>
                        </>
                      )}
                    </span>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  value={newValueDrafts[c.id] || ""}
                  onChange={(e) =>
                    setNewValueDrafts((p) => ({ ...p, [c.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddValue(c.id)}
                  placeholder="Nouvelle valeur"
                  className="flex-1 bg-black/[0.03] text-apple-black text-[13px] placeholder-apple-mid/50 rounded-xl px-3 py-2 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
                <button
                  onClick={() => handleAddValue(c.id)}
                  disabled={!(newValueDrafts[c.id] || "").trim() || addingValueId === c.id}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-semibold bg-apple-gray text-apple-black hover:bg-black/[0.08] transition disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
