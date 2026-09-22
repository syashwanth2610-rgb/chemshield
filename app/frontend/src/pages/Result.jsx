import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { API } from "@/lib/api";
import RiskGauge from "@/components/RiskGauge";
import { riskColor, hazardMeta } from "@/lib/risk";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wind, Hand, Eye, Flame, Skull, ArrowLeft, Sparkles, FileText, ScanLine, Save, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import VoiceReport from "@/components/VoiceReport";

const factorMeta = [
    { key: "inhalation", label: "Inhalation Risk", icon: Wind },
    { key: "skinContact", label: "Skin Contact", icon: Hand },
    { key: "eyeExposure", label: "Eye Exposure", icon: Eye },
    { key: "flammability", label: "Flammability", icon: Flame },
    { key: "toxicity", label: "Toxicity Indicators", icon: Skull },
];

export default function Result() {
    const { id } = useParams();
    const nav = useNavigate();
    const [scan, setScan] = useState(null);
    const [imgUrl, setImgUrl] = useState(null);

    useEffect(() => {
        let currentBlob = null;
        (async () => {
            try {
                const { data } = await api.get(`/scans/${id}`);
                setScan(data);
                if (data.storage_path) {
                    const token = localStorage.getItem("cs_token");
                    const resp = await fetch(`${API}/files/${encodeURI(data.storage_path)}?auth=${token || ""}`, { credentials: "include" });
                    if (resp.ok) {
                        const blob = await resp.blob();
                        currentBlob = URL.createObjectURL(blob);
                        setImgUrl(currentBlob);
                    }
                }
            } catch (e) {
                toast.error("Could not load scan");
                nav("/history");
            }
        })();
        return () => { if (currentBlob) URL.revokeObjectURL(currentBlob); };
    }, [id, nav]);

    if (!scan) return <div className="max-w-6xl mx-auto text-sm text-muted-foreground">Loading scan...</div>;

    if (scan.error) {
        return (
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="cs-glass p-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                    <div className="font-display text-2xl font-bold">Unable to analyze this image</div>
                    <p className="text-sm text-muted-foreground mt-2">{scan.error}</p>
                    <div className="mt-5 flex justify-center gap-3">
                        <Button onClick={()=>nav("/scan")} className="rounded-xl">Try Another Image</Button>
                    </div>
                </div>
            </div>
        );
    }

    const c = riskColor(scan.riskLevel);
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={()=>nav(-1)} data-testid="result-back" className="rounded-xl gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <div className="text-xs tracking-widest uppercase text-cyan-400">Chemical Risk Assessment</div>
            </div>

            <div className="grid lg:grid-cols-5 gap-5">
                <div className="lg:col-span-2 cs-glass p-6" data-testid="result-product-card">
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border">
                        {imgUrl ? <img src={imgUrl} alt={scan.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-sm text-muted-foreground">No image</div>}
                    </div>
                    <div className="mt-4">
                        <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Product</div>
                        <div className="font-display text-xl font-bold mt-1">{scan.productName}</div>
                        <div className="text-xs text-muted-foreground mt-1">AI Confidence: <span className="text-foreground font-semibold">{scan.confidence}%</span></div>
                    </div>
                    {scan.hazardSymbols?.length > 0 && (
                        <div className="mt-4">
                            <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Detected Hazards</div>
                            <div className="flex flex-wrap gap-2">
                                {scan.hazardSymbols.map((h, i) => {
                                    const meta = hazardMeta[h.icon] || { color: "#94a3b8", label: h.name };
                                    return (
                                        <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: meta.color+"66", color: meta.color, background: meta.color+"14" }}>
                                            {h.name || meta.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-3 cs-glass p-6 flex flex-col items-center justify-center" data-testid="result-gauge-card">
                    <RiskGauge score={scan.riskScore} level={scan.riskLevel} size={260} />
                    <div className="mt-4 text-sm text-muted-foreground text-center max-w-md">
                        This is an AI-generated risk awareness score. Always verify with the product SDS.
                    </div>
                </div>
            </div>

            {/* Risk factors */}
            <VoiceReport scan={scan} />

            <div className="cs-glass p-6" data-testid="risk-factors">
                <div className="text-xs tracking-widest uppercase text-cyan-400 mb-1">Exposure Risk Factors</div>
                <div className="font-display text-2xl font-bold mb-4">Detected exposure profile</div>
                <div className="grid sm:grid-cols-2 gap-4">
                    {factorMeta.map((f) => {
                        const v = Math.max(0, Math.min(100, scan.riskFactors?.[f.key] ?? 0));
                        const level = v >= 75 ? "risk-critical" : v >= 55 ? "risk-high" : v >= 30 ? "risk-moderate" : "risk-low";
                        const label = v >= 75 ? "Critical" : v >= 55 ? "High" : v >= 30 ? "Moderate" : "Low";
                        return (
                            <div key={f.key} className="p-4 rounded-xl border border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-medium"><f.icon className="w-4 h-4 text-cyan-400" /> {f.label}</div>
                                    <div className={`text-xs font-bold ${level}`}>{label}</div>
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${v}%`, background: `linear-gradient(90deg, #00F2FE, ${v >= 55 ? "#f97316" : "#38F9D7"})` }} />
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1">Score: {v}/100</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Why + Insight + Routes + Recs */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="cs-glass p-6" data-testid="why-risky">
                    <div className="text-xs tracking-widest uppercase text-orange-400 mb-1">Why is this risky?</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{scan.reasoning}</p>
                </div>
                <div className="cs-gradient-border p-1" data-testid="ai-insight">
                    <div className="rounded-[calc(1rem-2px)] bg-card p-6 h-full">
                        <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-cyan-400 mb-1">
                            <Sparkles className="w-3.5 h-3.5" /> AI Insight
                        </div>
                        <p className="text-sm leading-relaxed">{scan.aiInsight || "Review this product's SDS carefully before handling."}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
                <div className="cs-glass p-6">
                    <div className="text-xs tracking-widest uppercase text-yellow-400 mb-3">Potential Exposure Routes</div>
                    <ul className="space-y-2">
                        {(scan.exposureRoutes || []).map((r, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-yellow-400" /> {r}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="cs-glass p-6">
                    <div className="text-xs tracking-widest uppercase text-emerald-400 mb-3">Recommended Precautions</div>
                    <ul className="space-y-2">
                        {(scan.recommendations || []).map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {r}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-4">
                <Button asChild data-testid="view-report-btn" className="rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold">
                    <Link to={`/report/${scan.scan_id}`}><FileText className="w-4 h-4" /> View Full Report</Link>
                </Button>
                <Button variant="outline" onClick={()=>nav("/scan")} data-testid="scan-another-btn" className="rounded-xl gap-2"><ScanLine className="w-4 h-4" /> Scan Another</Button>
                <Button variant="ghost" data-testid="save-result-btn" onClick={()=>toast.success("Scan saved to history")} className="rounded-xl gap-2"><Save className="w-4 h-4" /> Save Result</Button>
            </div>

            <div className="text-center text-[11px] text-muted-foreground italic pb-6 max-w-2xl mx-auto">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                This assessment is for safety awareness and should not replace the product SDS, professional risk assessment, or emergency services.
            </div>
        </div>
    );
}
