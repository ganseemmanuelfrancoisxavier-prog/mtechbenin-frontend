"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY = "mtechbenin_splash_shown";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY)) return;

    setVisible(true);

    const t1 = setTimeout(() => setExiting(true), 2400);
    const t2 = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setVisible(false);
    }, 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      setVisible(false);
      setExiting(false);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes mt-bg-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes mt-sub-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        @keyframes mt-title-reveal {
          from { clip-path: inset(0 0 100% 0); }
          to   { clip-path: inset(0 0   0% 0); }
        }

        @keyframes mt-line-in {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        @keyframes mt-splash-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        .mt-splash {
          position: fixed; inset: 0; z-index: 9999;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: mt-bg-in 0.30s ease forwards;
        }
        .mt-splash.exiting {
          animation: mt-splash-out 0.70s ease forwards;
        }

        .mt-splash__inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .mt-splash__sub {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: clamp(13px, 2vw, 16px);
          font-weight: 400;
          letter-spacing: 0.40em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.50);
          margin-bottom: 14px;
          opacity: 0;
          animation: mt-sub-in 0.50s cubic-bezier(0.22, 1, 0.36, 1) 0.30s forwards;
        }

        .mt-splash__title-wrap {
          overflow: hidden;
          padding-bottom: 6px;
        }

        .mt-splash__title {
          display: block;
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: clamp(52px, 11vw, 96px);
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #ffffff;
          line-height: 1;
          clip-path: inset(0 0 100% 0);
          animation: mt-title-reveal 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.70s forwards;
        }

        .mt-splash__line {
          height: 1px;
          width: 100%;
          background: rgba(255, 255, 255, 0.20);
          transform-origin: center;
          transform: scaleX(0);
          margin-top: 20px;
          animation: mt-line-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) 1.25s forwards;
        }
      `}</style>

      <div
        className={`mt-splash${exiting ? " exiting" : ""}`}
        role="presentation"
        aria-hidden="true"
      >
        <div className="mt-splash__inner">
          <span className="mt-splash__sub">Bienvenue sur</span>

          <div className="mt-splash__title-wrap">
            <span className="mt-splash__title">MTECHBENIN</span>
          </div>

          <div className="mt-splash__line" />
        </div>
      </div>
    </>
  );
}
