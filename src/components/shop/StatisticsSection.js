"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 53712, suffix: "+", label: "Clients satisfaits" },
  { value: 126328, suffix: "+", label: "Commandes livrées" },
  { value: 4.8, suffix: "/5", label: "Note moyenne" },
  { value: 7, suffix: " ans", label: "D'expertise" },
];

function AnimatedCounter({ value, suffix }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 100;
    const duration = 5000;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else setCount(Math.floor(current * 10) / 10);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, value]);

  return (
    <span ref={ref}>
      {Number.isInteger(value) ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
}

export default function StatisticsSection() {
  return (
    <section
      aria-label="Chiffres clés MTECHBENIN"
      className="mx-auto max-w-7xl px-5 pt-8 pb-10"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-3xl p-6 text-center">
            <div className="mb-1.5 font-display text-3xl font-black tracking-tight text-apple-black md:text-4xl">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </div>
            <p className="text-[13px] text-apple-mid">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
