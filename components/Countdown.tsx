"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function Countdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const tick = () => setLeft(end - Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (left === null) return <span className="opacity-0">00j 00h 00m 00s</span>;
  if (left <= 0) return <span>Offre terminée</span>;

  const p = parts(left);
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (compact) {
    return (
      <span className="tabular-nums">
        {p.d > 0 ? `${p.d}j ` : ""}
        {pad(p.h)}:{pad(p.m)}:{pad(p.s)}
      </span>
    );
  }

  const cells: [number, string][] = [
    [p.d, "jours"],
    [p.h, "heures"],
    [p.m, "min"],
    [p.s, "sec"],
  ];
  return (
    <div className="flex gap-2">
      {cells.map(([v, l]) => (
        <div key={l} className="min-w-[56px] rounded-xl bg-white/15 px-2 py-2 text-center backdrop-blur">
          <div className="text-2xl font-extrabold tabular-nums">{pad(v)}</div>
          <div className="text-[10px] uppercase tracking-wide opacity-80">{l}</div>
        </div>
      ))}
    </div>
  );
}
