"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Volume2,
  VolumeX,
  Wrench,
  Clock,
} from "lucide-react";
import { formatPrice, prixDepart } from "@/lib/format";
import useAbonnementStore from "@/store/abonnementStore";
import { services as staticServices } from "@/lib/abonnements";
import { useMobileAudioFocus } from "@/hooks/useMobileAudioFocus";
import { urlVideoJouable } from "@/lib/media";

const serviceBg = {
  netflix: "from-[#831010] via-[#E50914] to-[#1a0000]",
  spotify: "from-[#0d3d1a] via-[#1DB954] to-[#001a08]",
  "apple-music": "from-[#2d0a1a] via-[#FC3C44] to-[#0d0005]",
  "disney-plus": "from-[#0a1a4a] via-[#113CCF] to-[#00041a]",
  "youtube-premium": "from-[#3d0000] via-[#FF0000] to-[#1a0000]",
  crunchyroll: "from-[#2d1500] via-[#FF6600] to-[#1a0800]",
  canva: "from-[#001a2d] via-[#00C4CC] to-[#000d1a]",
  chatgpt: "from-[#001a14] via-[#10A37F] to-[#00080a]",
};
const defaultBg = "from-[#1a1a2e] via-[#16213E] to-[#0f0f0f]";

const steps = [
  {
    step: "01",
    title: "Choisissez",
    desc: "Sélectionnez votre service, votre formule et votre durée d'abonnement.",
  },
  {
    step: "02",
    title: "Payez",
    desc: "Paiement sécurisé via MTN MoMo, Moov Money, Wave ou Carte bancaire.",
  },
  {
    step: "03",
    title: "Accédez",
    desc: "Identifiants envoyés automatiquement par WhatsApp & Email en moins de 5 minutes.",
  },
];

function ServiceCard({ service, onToggleMute, cardRef }) {
  const videoRef = useRef(null);
  const isVideo = service.mediaType === "video" && service.mediaUrl;
  const { prix: minPrice, suffixe: suffixePrix } = prixDepart(service.formules);

  const isMaintenance = service.serviceStatus === "maintenance";
  const isComingSoon = service.serviceStatus === "coming_soon";
  const isUnavailable = isMaintenance || isComingSoon;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = service.mediaMuted !== false;
    if (video.paused) video.play().catch(() => {});
  }, [service.mediaMuted]);

  return (
    <Link
      ref={cardRef}
      href={isUnavailable ? "#" : `/abonnements/${service.slug}`}
      onClick={isUnavailable ? (e) => e.preventDefault() : undefined}
      className={`group glass-card rounded-3xl overflow-hidden transition-all duration-300 relative ${
        isUnavailable ? "cursor-not-allowed opacity-80" : "hover:-translate-y-1"
      }`}
    >
      <div className="relative h-40 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${serviceBg[service.slug] || service.color || defaultBg}`}
        />
        {service.mediaType === "image" && service.mediaUrl && (
          <Image
            src={service.mediaUrl}
            alt={service.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}
        {isVideo && (
          <video
            ref={videoRef}
            src={urlVideoJouable(service.mediaUrl)}
            autoPlay
            loop
            playsInline
            muted={service.mediaMuted !== false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {isMaintenance && (
          <div className="absolute top-3 left-3 right-10 z-20">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-orange-600 bg-orange-50/90 backdrop-blur-sm truncate">
              <Wrench className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {service.maintenanceMessage || "En maintenance"}
              </span>
            </div>
          </div>
        )}
        {isComingSoon && (
          <div className="absolute top-3 left-3 right-10 z-20">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-blue-600 bg-blue-50/90 backdrop-blur-sm truncate">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {service.comingSoonMessage || "Bientôt disponible"}
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-5 right-10 z-10">
          <h3 className="font-display font-black text-white text-xl tracking-tight">
            {service.name}
          </h3>
          <p className="text-white/55 text-[12px] mt-0.5 line-clamp-1">
            {service.tagline}
          </p>
        </div>

        {isVideo && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleMute(service.slug);
            }}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: "rgba(0,0,0,0.40)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {service.mediaMuted !== false ? (
              <VolumeX className="w-3.5 h-3.5 text-white/80" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="mb-4">
          {isMaintenance ? (
            <div className="flex items-center gap-2 py-1">
              <Wrench className="w-4 h-4 text-orange-400" />
              <p className="text-orange-500 text-[13px] font-semibold">
                Temporairement indisponible
              </p>
            </div>
          ) : isComingSoon ? (
            <div className="flex items-center gap-2 py-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-blue-500 text-[13px] font-semibold">
                Disponible prochainement
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-apple-mid mb-1 font-medium">
                À partir de
              </p>
              <p className="font-display font-black text-[19px] text-apple-black tracking-tight">
                {minPrice !== null ? formatPrice(minPrice) : "—"}
                <span className="text-apple-mid font-normal text-[13px]">
                  {suffixePrix}
                </span>
              </p>
            </>
          )}
        </div>

        <ul className="space-y-1.5 mb-5">
          {service.features?.slice(0, 3).map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-[12px] text-apple-mid"
            >
              <Check
                className={`w-3.5 h-3.5 ${service.textColor || "text-apple-mid"} flex-shrink-0 mt-0.5`}
                strokeWidth={2.5}
              />
              {f}
            </li>
          ))}
        </ul>

        <div
          className={`flex items-center justify-between text-[12px] font-semibold transition-colors ${
            isUnavailable
              ? "text-apple-mid/40"
              : "text-apple-mid group-hover:text-apple-black"
          }`}
        >
          {isUnavailable ? "Bientôt disponible" : "Voir les formules"}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function AbonnementsHub() {
  const [mounted, setMounted] = useState(false);
  const cardRefs = useRef({});

  const { getActiveServices, fetchServices } = useAbonnementStore();

  useEffect(() => {
    setMounted(true);
    fetchServices();
  }, []);

  const services = mounted ? getActiveServices().map((ss) => ({
        ...ss,
        serviceStatus: ss.serviceStatus || "active",
        maintenanceMessage:
          ss.maintenanceMessage || "Ce service est en maintenance.",
        comingSoonMessage:
          ss.comingSoonMessage || "Ce service sera bientôt disponible.",
      }))
    : staticServices
        .filter((s) => s.available)
        .map((s) => ({ ...s, serviceStatus: "active" }));

  const { handleToggleMute } = useMobileAudioFocus({ services, cardRefs, mounted });

  const activeCount = services.filter(
    (s) => s.serviceStatus === "active",
  ).length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-[#0A0A0A] py-24 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-white/[0.015] rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="w-1.5 h-1.5 bg-cta rounded-full animate-pulse" />
            <span className="text-white/50 text-[11px] font-semibold tracking-widest uppercase">
              Service Digital
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white mb-5 tracking-tight">
            Abonnements
            <br />
            <span className="text-white/40">Digitaux</span>
          </h1>
          <p className="text-white/40 text-[15px] md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Netflix, Spotify, Apple Music et plus encore — au meilleur prix en
            Afrique.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              "Activation immédiate",
              "Paiement Mobile Money",
              "Support 7j/7",
              "Prix imbattables",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Check
                  className="w-3.5 h-3.5 text-green-400"
                  strokeWidth={2.5}
                />
                <span className="text-white/60 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grille services */}
      <div className="max-w-7xl mx-auto px-5 py-20">
        <div className="mb-12">
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
            Nos services
          </p>
          <div className="flex items-end justify-between">
            <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
              Choisissez votre service
            </h2>
            <p className="text-apple-mid text-[13px] hidden md:block">
              {activeCount} service{activeCount > 1 ? "s" : ""} disponible
              {activeCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-apple-mid text-lg">Chargement des services...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.slug}
                cardRef={(el) => { cardRefs.current[service.slug] = el; }}
                service={service}
                onToggleMute={handleToggleMute}
              />
            ))}
          </div>
        )}

        {/* Comment ça marche */}
        <div className="mt-20 glass-card rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
              Processus
            </p>
            <h2 className="font-display font-black text-3xl text-apple-black tracking-tight">
              Comment ça marche ?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((item, i) => (
              <div key={item.step} className="flex gap-5">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-9 h-9 rounded-2xl bg-apple-black flex items-center justify-center">
                    <span className="font-display font-black text-white text-[13px]">
                      {item.step}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 w-px bg-black/[0.06] hidden md:block" />
                  )}
                </div>
                <div className="pb-4">
                  <h3 className="font-display font-bold text-[17px] text-apple-black mb-2 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-apple-mid text-[13px] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Garanties */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              emoji: "⚡",
              title: "Activation rapide",
              desc: "Moins de 5 minutes après paiement",
            },
            {
              emoji: "🔒",
              title: "Paiement sécurisé",
              desc: "MTN MoMo, Moov Money, Wave",
            },
            {
              emoji: "💬",
              title: "Support 7j/7",
              desc: "Disponible via WhatsApp",
            },
          ].map((g) => (
            <div
              key={g.title}
              className="flex items-start gap-4 p-5 rounded-3xl"
              style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <span className="text-2xl flex-shrink-0">{g.emoji}</span>
              <div>
                <p className="font-semibold text-apple-black text-[13px] mb-0.5">
                  {g.title}
                </p>
                <p className="text-apple-mid text-[12px]">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
