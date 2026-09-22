import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { API } from "@/lib/api";
import { riskColor, hazardMeta } from "@/lib/risk";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Report() {
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
            } catch { toast.error("Failed to load report"); }
        })();
        return () => { if (currentBlob) URL.revokeObjectURL(currentBlob); };
    }, [id]);

    const download = () => window.print();

    if (!scan) return <div className="max-w-4xl mx-auto text-sm text-muted-foreground">Loading...</div>;
    const c = riskColor(scan.riskLevel);

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between print:hidden">
                <Button variant="ghost" onClick={()=>nav(-1)} className="rounded-xl gap-2" data-testid="report-back"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={download} data-testid="download-report-btn" className="rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold"><Download className="w-4 h-4" /> Download</Button>
            </div>

            <div className="cs-glass-strong p-8 print:bg-white print:text-black" data-testid="report-body">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center"><Shield className="w-5 h-5 text-slate-900" /></div>
                        <div>
                            <div className="font-display text-xl font-bold tracking-tight">CHEMSHIELD AI</div>
                            <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Chemical Exposure Risk Assessment</div>
                        </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <div>Report ID: {scan.scan_id.slice(0, 8)}</div>
                        <div>{new Date(scan.created_at).toLocaleString()}</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        {imgUrl && <img src={imgUrl} alt={scan.productName} className="rounded-xl border border-border object-cover aspect-[3/4] w-full" />}
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Product</div>
                            <div className="font-display text-2xl font-bold">{scan.productName}</div>
                            <div className="text-xs text-muted-foreground">AI Confidence: {scan.confidence}%</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl border border-border">
                                <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Risk Score</div>
                                <div className={`font-display text-3xl font-bold ${c.text}`}>{scan.riskScore}/100</div>
                            </div>
                            <div className="p-3 rounded-xl border border-border">
                                <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Risk Level</div>
                                <div className={`font-display text-2xl font-bold ${c.text}`}>{scan.riskLevel}</div>
                            </div>
                        </div>
                        {scan.hazardSymbols?.length > 0 && (
                            <div>
                                <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">Hazard Indicators</div>
                                <div className="flex flex-wrap gap-2">
                                    {scan.hazardSymbols.map((h, i) => {
                                        const meta = hazardMeta[h.icon] || { color: "#94a3b8", label: h.name };
                                        return <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: meta.color+"66", color: meta.color, background: meta.color+"12" }}>{h.name || meta.label}</span>;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <section>
                        <div className="text-[10px] tracking-widest uppercase text-cyan-400 mb-2">Exposure Routes</div>
                        <ul className="text-sm space-y-1">
                            {(scan.exposureRoutes || []).map((r, i) => <li key={i}>• {r}</li>)}
                        </ul>
                    </section>
                    <section>
                        <div className="text-[10px] tracking-widest uppercase text-emerald-400 mb-2">Recommendations</div>
                        <ul className="text-sm space-y-1">
                            {(scan.recommendations || []).map((r, i) => <li key={i}>✓ {r}</li>)}
                        </ul>
                    </section>
                </div>

                {scan.reasoning && (
                    <section className="mt-6">
                        <div className="text-[10px] tracking-widest uppercase text-orange-400 mb-2">AI Reasoning</div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{scan.reasoning}</p>
                    </section>
                )}

                <footer className="mt-8 pt-4 border-t border-border text-[11px] text-muted-foreground italic">
                    AI-generated risk assessment — verify with the official product Safety Data Sheet (SDS) and local safety guidance.
                </footer>
            </div>
        </div>
    );
}
