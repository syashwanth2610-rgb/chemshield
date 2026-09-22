import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { riskColor } from "@/lib/risk";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";

export default function Reports() {
    const nav = useNavigate();
    const [scans, setScans] = useState([]);
    useEffect(() => {
        (async () => { try { const { data } = await api.get("/scans"); setScans(data.filter(s => !s.error)); } catch {} })();
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header>
                <div className="text-xs tracking-widest uppercase text-cyan-400">Reports</div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Risk Reports</h1>
                <p className="text-muted-foreground mt-1">Generate a printable report for any scan.</p>
            </header>

            {scans.length === 0 ? (
                <div className="cs-glass p-10 text-center text-sm text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    No reports yet. Scan a product to create one.
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scans.map((s) => {
                        const c = riskColor(s.riskLevel);
                        return (
                            <div key={s.scan_id} className="cs-glass p-5 hover:-translate-y-1 transition-transform" data-testid={`report-card-${s.scan_id}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold ${c.text}`}>{s.riskLevel}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="font-display text-lg font-semibold mt-2 truncate">{s.productName}</div>
                                <div className="text-sm text-muted-foreground">Score: {s.riskScore}/100</div>
                                <div className="mt-4 flex gap-2">
                                    <Button size="sm" variant="outline" className="rounded-xl flex-1 gap-1" onClick={()=>nav(`/result/${s.scan_id}`)}><Eye className="w-3.5 h-3.5" /> View</Button>
                                    <Button size="sm" className="rounded-xl flex-1 gap-1 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold" onClick={()=>nav(`/report/${s.scan_id}`)}><Download className="w-3.5 h-3.5" /> Report</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
