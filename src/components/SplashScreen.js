"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./SplashScreen.module.css";

const SPLASH_KEY = "mtechbenin_cinematic_intro_v2";
const SOURCE_WIDTH = 1024;
const SOURCE_HEIGHT = 1536;
const BLACK_HOLE_POSITION = { x: 0.5, y: 0.665 };

function saveIntroSeen() {
  try {
    window.sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {}
}

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [imageFrame, setImageFrame] = useState(null);
  const skipButtonRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SPLASH_KEY)) {
        setVisible(false);
        return undefined;
      }
    } catch {}

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    setReducedMotion(motionPreference.matches);

    const updateImageFrame = () => {
      const scale = Math.max(
        window.innerWidth / SOURCE_WIDTH,
        window.innerHeight / SOURCE_HEIGHT,
      );
      const width = SOURCE_WIDTH * scale;
      const height = SOURCE_HEIGHT * scale;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      const holeX = width * BLACK_HOLE_POSITION.x;
      const holeY = height * BLACK_HOLE_POSITION.y;

      setImageFrame({
        width,
        height,
        left,
        top,
        holeX,
        holeY,
        shiftX: window.innerWidth / 2 - left - holeX,
        shiftY: window.innerHeight / 2 - top - holeY,
        holeSize: Math.max(54, Math.min(width, height) * 0.075),
      });
    };

    updateImageFrame();
    window.addEventListener("resize", updateImageFrame, { passive: true });
    skipButtonRef.current?.focus({ preventScroll: true });

    const exitDelay = motionPreference.matches ? 1500 : 7000;
    const finishDelay = motionPreference.matches ? 2200 : 7800;
    timersRef.current = [
      window.setTimeout(() => setExiting(true), exitDelay),
      window.setTimeout(() => {
        saveIntroSeen();
        setVisible(false);
      }, finishDelay),
    ];

    return () => {
      window.removeEventListener("resize", updateImageFrame);
      timersRef.current.forEach(window.clearTimeout);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [visible]);

  const skipIntro = () => {
    timersRef.current.forEach(window.clearTimeout);
    saveIntroSeen();
    setVisible(false);
  };

  if (!visible) return null;

  const imageStyle = imageFrame
    ? {
        width: `${imageFrame.width}px`,
        height: `${imageFrame.height}px`,
        left: `${imageFrame.left}px`,
        top: `${imageFrame.top}px`,
        "--hole-x": `${imageFrame.holeX}px`,
        "--hole-y": `${imageFrame.holeY}px`,
        "--hole-size": `${imageFrame.holeSize}px`,
        "--hole-shift-x": `${imageFrame.shiftX}px`,
        "--hole-shift-y": `${imageFrame.shiftY}px`,
      }
    : undefined;

  return (
    <div
      className={`${styles.overlay} ${exiting ? styles.exiting : ""} ${reducedMotion ? styles.reducedMotion : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Introduction MTECHBENIN"
    >
      <div
        className={`${styles.scene} ${imageFailed ? styles.fallback : ""}`}
        aria-hidden="true"
      >
        {!imageFailed && (
          <Image
            src="/intro-mtechbenin.jpg"
            alt=""
            width={SOURCE_WIDTH}
            height={SOURCE_HEIGHT}
            priority
            sizes="100vw"
            className={styles.image}
            style={imageStyle}
            onError={() => setImageFailed(true)}
          />
        )}
        <div className={styles.stars} />
        <div className={styles.vignette} />
        <div className={styles.starStreaks} />
        <div className={styles.portalOpening} />
        <div className={styles.portalLight} />
      </div>

      <button
        ref={skipButtonRef}
        type="button"
        className={styles.skipButton}
        onClick={skipIntro}
      >
        Passer l’introduction
      </button>

      <div className={styles.brand}>
        <p className={styles.welcome}>BIENVENUE SUR</p>
        <h1 className={styles.title}>MTECHBENIN</h1>
      </div>
    </div>
  );
}
