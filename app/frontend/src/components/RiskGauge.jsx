import React, { useEffect, useState } from "react";
import { riskColor } from "@/lib/risk";

// Animated circular gauge (0-100) with gradient stroke, animated fill.
export default function RiskGauge({ score = 0, level = "LOW", size = 240 }) {
    const [display, setDisplay] = useState(0);
    const c = riskColor(level);
    const r = (size - 24) / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, display));
    const offset = circumference - (pct / 100) * circumference;

    useEffect(() => {
        let raf;
        const start = performance.now();
        const from = 0;
        const to = score;
        const duration = 1200;
        const step = (t) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [score]);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }} data-testid="risk-gauge">
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id="rg-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#00F2FE" />
                        <stop offset="50%" stopColor={c.hex} />
                        <stop offset="100%" stopColor="#FF0844" />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="14" stroke="hsl(var(--border))" fill="none" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} strokeWidth="14"
                    stroke="url(#rg-grad)" fill="none" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.4s ease-out", filter: `drop-shadow(0 0 12px ${c.hex}88)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`font-display text-6xl font-bold ${c.text}`}>{display}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Risk Score</div>
                <div className={`mt-2 text-sm font-semibold ${c.text}`}>{c.label.toUpperCase()}</div>
            </div>
        </div>
    );
}
