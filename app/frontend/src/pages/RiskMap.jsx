import React, { useState } from "react";
import { Map as MapIcon, MapPin } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const DEMO_POINTS = [
    { x: 22, y: 32, level: "CRITICAL", name: "Industrial Park A", type: "Industrial" },
    { x: 44, y: 48, level: "HIGH", name: "Downtown Warehouse", type: "Warehouse" },
    { x: 62, y: 28, level: "MODERATE", name: "Agri-Field North", type: "Agricultural" },
    { x: 78, y: 62, level: "LOW", name: "Community Center", type: "Household" },
    { x: 30, y: 68, level: "HIGH", name: "Chemical Depot B", type: "Industrial" },
    { x: 55, y: 78, level: "MODERATE", name: "University Lab", type: "Laboratory" },
    { x: 15, y: 55, level: "LOW", name: "Neighborhood Store", type: "Household" },
];

const colorMap = { LOW: "#22c55e", MODERATE: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444" };

export default function RiskMap() {
    const [levelFilter, setLevelFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const filtered = DEMO_POINTS.filter((p) =>
        (levelFilter === "all" || p.level === levelFilter) &&
        (typeFilter === "all" || p.type === typeFilter)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-xs tracking-widest uppercase text-cyan-400">Geospatial</div>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Chemical Exposure Risk Map</h1>
                    <p className="text-muted-foreground mt-1">Demo/Sample Data — for visualization purposes only.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                        <SelectTrigger data-testid="filter-level" className="w-40 rounded-xl"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All levels</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MODERATE">Moderate</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger data-testid="filter-type" className="w-44 rounded-xl"><SelectValue placeholder="Chemical Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="Industrial">Industrial</SelectItem>
                            <SelectItem value="Agricultural">Agricultural</SelectItem>
                            <SelectItem value="Laboratory">Laboratory</SelectItem>
                            <SelectItem value="Household">Household</SelectItem>
                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <div className="cs-glass p-4">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden cs-grid-bg bg-secondary/30" data-testid="risk-map-canvas">
                    {/* Fake continent shapes using SVG */}
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-60">
                        <path d="M5,20 Q15,12 30,15 T55,18 T85,22 L95,45 Q80,50 65,48 T35,50 T10,45 Z" fill="url(#continent)" />
                        <defs>
                            <linearGradient id="continent" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#38F9D7" stopOpacity="0.08" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {filtered.map((p, i) => (
                        <div key={i} data-testid={`map-point-${i}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: colorMap[p.level], opacity: 0.35 }} />
                            <span className="relative block w-3.5 h-3.5 rounded-full ring-2 ring-white/60" style={{ background: colorMap[p.level], boxShadow: `0 0 12px ${colorMap[p.level]}` }} />
                            <div className="absolute left-4 -top-1 hidden group-hover:block bg-card border border-border rounded-lg text-xs px-2 py-1 whitespace-nowrap shadow">
                                <div className="font-medium">{p.name}</div>
                                <div className="text-muted-foreground">{p.type} · {p.level}</div>
                            </div>
                        </div>
                    ))}

                    <div className="absolute bottom-3 left-3 cs-glass p-2 flex gap-3 text-xs">
                        {Object.entries(colorMap).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: v }} /> {k[0] + k.slice(1).toLowerCase()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <div className="text-xs tracking-widest uppercase text-cyan-400 mb-2">Exposure Hotspots</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.slice(0, 6).map((p, i) => (
                        <div key={i} className="cs-glass p-4 hover:-translate-y-1 transition-transform" data-testid={`hotspot-${i}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" style={{ color: colorMap[p.level] }} />
                                    <div className="font-medium">{p.name}</div>
                                </div>
                                <span className="text-[11px] font-bold" style={{ color: colorMap[p.level] }}>{p.level}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{p.type} · Demo Data</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
