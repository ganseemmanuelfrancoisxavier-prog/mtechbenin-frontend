"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Clock,
  Wrench,
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

function ServiceCard({ service, onToggleMute, cardRef }) {
  const videoRef = useRef(null);
  const isVideo = service.mediaType === "video" && service.mediaUrl;

  const formules = service.formules || service.plans || [];
  const { prix: prixMin, suffixe: suffixePrix } = prixDepart(formules);
  const minPrice = prixMin ?? 0;
  const features = service.features || [];

  const isMaintenance = service.serviceStatus === "maintenance";
  const isComingSoon = service.serviceStatus === "coming_soon";
  const isUnavailable = isMaintenance || isComingSoon;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = service.mediaMuted !== false;
    // Si l'autoplay a été bloqué, tenter de relancer la lecture (muette)
    if (video.paused) video.play().catch(() => {});
  }, [service.mediaMuted]);

  /*
   * Le contenu est stocké dans une variable JSX (pas un composant inline).
   * Ceci évite que React démonte/remonte le <video> à chaque re-render,
   * ce qui bloquerait l'autoplay lors d'un changement de mediaMuted.
   */
  const cardStyle = { width: "clamp(220px, 36vw, 300px)", aspectRatio: "3/4" };

  const inner = (
    <>
      <div
        className={`absolute inset-0 ${isVideo ? "bg-black" : `bg-gradient-to-br ${serviceBg[service.slug] || defaultBg}`}`}
      />

      {service.mediaType === "image" && service.mediaUrl && (
        <Image
          src={service.mediaUrl}
          alt={service.name}
          fill
          className="object-cover"
          sizes="300px"
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
          style={{ transform: "scale(1.005)", transformOrigin: "center" }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {isUnavailable && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10" />
      )}

      {isVideo && !isUnavailable && (
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

      <div className="absolute top-5 left-5 right-10 z-10">
        <p className="font-display font-black text-white text-xl tracking-tight">
          {service.name}
        </p>
        <p className="text-white/45 text-[12px] mt-0.5 line-clamp-1">
          {service.tagline}
        </p>
      </div>

      <div className="absolute bottom-5 left-5 right-5 z-20">
        {isUnavailable ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isMaintenance ? (
                <Wrench className="w-4 h-4 text-orange-400 flex-shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
              <span
                className={`text-[11px] font-bold uppercase tracking-widest ${isMaintenance ? "text-orange-400" : "text-blue-400"}`}
              >
                {isMaintenance ? "Maintenance" : "Bientôt disponible"}
              </span>
            </div>
            <p className="text-white/60 text-[11px] leading-relaxed line-clamp-3">
              {isMaintenance
                ? service.maintenanceMessage
                : service.comingSoonMessage}
            </p>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {isMaintenance
                ? "Temporairement indisponible"
                : "Disponible prochainement"}
            </div>
          </div>
        ) : (
          <>
            {features.length > 0 && (
              <div className="mb-4 space-y-1">
                {features.slice(0, 2).map((f) => (
                  <p key={f} className="text-white/40 text-[11px] line-clamp-1">
                    {f}
                  </p>
                ))}
              </div>
            )}
            <p className="text-white/55 text-[12px] mb-3">
              Dès{" "}
              <span className="text-white font-bold">
                {minPrice > 0 ? formatPrice(minPrice) : "—"}
              </span>
              {suffixePrix}
            </p>
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 group-hover:bg-white/95"
              style={{
                background: "rgba(255,255,255,0.88)",
                color: "#1D1D1F",
                backdropFilter: "blur(12px)",
              }}
            >
              S&apos;abonner
            </div>
          </>
        )}
      </div>
    </>
  );

  if (isUnavailable) {
    return (
      <div
        ref={cardRef}
        className="flex-shrink-0 relative rounded-3xl overflow-hidden"
        style={{ ...cardStyle, cursor: "default", transform: "translateZ(0)" }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      ref={cardRef}
      href={`/abonnements/${service.slug}`}
      className="group flex-shrink-0 relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{ ...cardStyle, transform: "translateZ(0)" }}
    >
      {inner}
    </Link>
  );
}

export default function SubscriptionsSection() {
  const [mounted, setMounted] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const scrollRef = useRef(null);
  const cardRefs = useRef({});

  const { getActiveServices, fetchServices } = useAbonnementStore();

  useEffect(() => {
    setMounted(true);
    fetchServices();
  }, []);

  const services = mounted
    ? getActiveServices()
    : staticServices.filter((s) => s.available);

  const { handleToggleMute } = useMobileAudioFocus({ services, cardRefs, mounted });

  if (services.length === 0) return null;

  const updateNav = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "right" ? el.clientWidth * 0.75 : -el.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  return (
    <section className="pt-16 pb-[69px] bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-white/[0.015] rounded-full blur-3xl" />
      </div>

      <div className="relative">
        <div className="max-w-7xl mx-auto px-5 flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
              Digital
            </p>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
              Abonnements
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canLeft}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canRight}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <Link
              href="/abonnements"
              className="text-white/40 hover:text-white/80 text-[13px] font-medium transition-colors ml-2"
            >
              Voir tout →
            </Link>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={updateNav}
          className="flex gap-3 overflow-x-auto pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingLeft: "max(1.25rem, calc((100vw - 80rem) / 2 + 1.25rem))",
            paddingRight: "max(1.25rem, calc((100vw - 80rem) / 2 + 1.25rem))",
          }}
        >
          {services.map((service) => (
            <ServiceCard
              key={service.slug}
              cardRef={(el) => { cardRefs.current[service.slug] = el; }}
              service={service}
              onToggleMute={handleToggleMute}
            />
          ))}

          <Link
            href="/abonnements"
            className="flex-shrink-0 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:bg-white/[0.06]"
            style={{
              width: "clamp(140px, 22vw, 180px)",
              aspectRatio: "3/4",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
            <p className="text-white/50 text-[13px] font-medium text-center px-4">
              Voir tout
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
