import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { riskColor } from "@/lib/risk";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Upload, Camera, ScanLine, AlertTriangle, ShieldCheck, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [scans, setScans] = useState([]);
    const nav = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const [s, l] = await Promise.all([
                    api.get("/stats/summary"),
                    api.get("/scans", { params: { limit: 5 } }),
                ]);
                setStats(s.data);
                setScans(l.data);
            } catch (e) {
                toast.error("Failed to load dashboard");
            }
        })();
    }, []);

    const chartData = stats ? [
        { name: "Low", value: stats.buckets.LOW || 0, color: "#22c55e" },
        { name: "Moderate", value: stats.buckets.MODERATE || 0, color: "#f59e0b" },
        { name: "High", value: stats.buckets.HIGH || 0, color: "#f97316" },
        { name: "Critical", value: stats.buckets.CRITICAL || 0, color: "#ef4444" },
    ] : [];
    const hasData = chartData.some((d) => d.value > 0);

    const now = new Date();
    const greet = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="cs-rise">
                <div className="text-xs tracking-widest uppercase text-cyan-400">Dashboard</div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">{greet}, {user?.name?.split(" ")[0] || "Analyst"} <span className="align-middle">👋</span></h1>
                <p className="text-muted-foreground mt-1">Let's check your chemical safety today.</p>
            </header>

            {/* Primary scan card */}
            <div className="cs-gradient-border p-1 cs-rise cs-delay-1">
                <div className="rounded-[calc(1rem-2px)] bg-card p-6 sm:p-8 relative overflow-hidden" data-testid="scan-cta">
                    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 blur-3xl pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium mb-3">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Gemini 3 Flash Vision
                            </div>
                            <h2 className="font-display text-2xl sm:text-3xl font-bold">Scan a Chemical Product</h2>
                            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                                Drag & drop a photo of the product label — or use your camera. AI will identify hazards and estimate exposure risk.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button data-testid="dash-upload-btn" onClick={()=>nav("/scan?mode=upload")} className="rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold hover:from-cyan-300 hover:to-emerald-300">
                                    <Upload className="w-4 h-4" /> Upload Image
                                </Button>
                                <Button data-testid="dash-camera-btn" onClick={()=>nav("/scan?mode=camera")} variant="outline" className="rounded-xl gap-2">
                                    <Camera className="w-4 h-4" /> Take Photo
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-3">Supported: JPG, PNG · Max 8MB</p>
                        </div>
                        <div className="hidden md:flex items-center justify-center w-40 h-40 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-emerald-400/10 border border-cyan-400/20">
                            <ScanLine className="w-16 h-16 text-cyan-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Products Scanned" value={stats?.total ?? 0} icon={ScanLine} accent="text-cyan-400" tid="stat-scanned" />
                <Stat label="Risk Alerts" value={stats?.alerts ?? 0} icon={AlertTriangle} accent="text-orange-400" tid="stat-alerts" />
                <Stat label="Low Risk" value={stats?.buckets?.LOW ?? 0} icon={ShieldCheck} accent="text-emerald-400" tid="stat-low" />
                <Stat label="High Risk" value={stats?.high ?? 0} icon={TrendingUp} accent="text-red-400" tid="stat-high" />
            </section>

            {/* Chart + Recent */}
            <section className="grid lg:grid-cols-5 gap-5">
                <div className="lg:col-span-2 cs-glass p-6" data-testid="risk-distribution">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-xs tracking-widest uppercase text-muted-foreground">Risk Distribution</div>
                            <div className="font-display text-lg font-semibold">Across your scans</div>
                        </div>
                    </div>
                    <div className="h-60">
                        {hasData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {chartData.map((e) => <Cell key={e.name} fill={e.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full grid place-items-center text-center text-sm text-muted-foreground">
                                <div>
                                    <ScanLine className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                                    Scan your first product to see distribution.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-3 cs-glass p-6" data-testid="recent-activity">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-xs tracking-widest uppercase text-muted-foreground">Recent Activity</div>
                            <div className="font-display text-lg font-semibold">Latest scans</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={()=>nav("/history")} className="text-cyan-400">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
                    </div>
                    {scans.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">
                            No scans yet. <button onClick={()=>nav("/scan")} className="text-cyan-400 hover:underline">Start your first scan</button>.
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {scans.map((s) => {
                                const c = riskColor(s.riskLevel);
                                return (
                                    <li key={s.scan_id} data-testid={`recent-${s.scan_id}`} className="py-3 flex items-center gap-3 cursor-pointer hover:bg-accent/40 rounded-lg px-2 transition-colors" onClick={()=>nav(`/result/${s.scan_id}`)}>
                                        <div className={`w-10 h-10 rounded-lg ${c.bg} grid place-items-center text-white text-xs font-bold`}>{s.riskScore ?? "?"}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{s.productName || (s.error ? "Analysis error" : "Untitled scan")}</div>
                                            <div className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                                        </div>
                                        <span className={`text-[11px] font-bold ${c.text}`}>{(s.riskLevel || (s.error ? "ERROR" : "—")).toUpperCase()}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </section>

            <div className="text-[11px] text-muted-foreground text-center italic">
                This assessment is for safety awareness and should not replace the product SDS, professional risk assessment, or emergency services.
            </div>
        </div>
    );
}

function Stat({ label, value, icon: Icon, accent, tid }) {
    return (
        <div className="cs-glass p-5 hover:-translate-y-1 transition-transform" data-testid={tid}>
            <div className="flex items-center justify-between">
                <div className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</div>
                <Icon className={`w-4 h-4 ${accent}`} />
            </div>
            <div className="font-display text-3xl font-bold mt-2">{value}</div>
        </div>
    );
}
