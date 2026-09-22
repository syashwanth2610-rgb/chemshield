import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { riskColor } from "@/lib/risk";
import { Button } from "@/components/ui/button";
import { ScanLine, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function History() {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/scans");
                setScans(data);
            } catch { toast.error("Failed to load history"); }
            finally { setLoading(false); }
        })();
    }, []);

    const del = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/scans/${id}`);
            setScans((s) => s.filter((x) => x.scan_id !== id));
            toast.success("Removed");
        } catch { toast.error("Delete failed"); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs tracking-widest uppercase text-cyan-400">History</div>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Scan History</h1>
                    <p className="text-muted-foreground mt-1">Every product you've analyzed with ChemShield AI.</p>
                </div>
                <Button onClick={()=>nav("/scan")} data-testid="history-new-scan-btn" className="rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold"><ScanLine className="w-4 h-4" /> New Scan</Button>
            </header>

            {loading ? (
                <div className="cs-glass p-10 text-center text-sm text-muted-foreground">Loading scans...</div>
            ) : scans.length === 0 ? (
                <div className="cs-glass p-10 text-center">
                    <ScanLine className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    <div className="font-medium">No scans yet</div>
                    <p className="text-sm text-muted-foreground mt-1">Start by scanning your first chemical product.</p>
                    <Button onClick={()=>nav("/scan")} className="mt-4 rounded-xl">Scan a Product</Button>
                </div>
            ) : (
                <div className="cs-glass p-2 overflow-x-auto">
                    <table className="w-full text-sm" data-testid="history-table">
                        <thead>
                            <tr className="text-[10px] tracking-widest uppercase text-muted-foreground">
                                <th className="text-left px-4 py-3">Product</th>
                                <th className="text-left px-4 py-3">Date</th>
                                <th className="text-left px-4 py-3">Risk Level</th>
                                <th className="text-left px-4 py-3">Score</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scans.map((s) => {
                                const c = riskColor(s.riskLevel);
                                return (
                                    <tr key={s.scan_id} data-testid={`history-row-${s.scan_id}`} className="border-t border-border hover:bg-accent/40 cursor-pointer transition-colors" onClick={()=>nav(`/result/${s.scan_id}`)}>
                                        <td className="px-4 py-3 font-medium">{s.productName || (s.error ? "Analysis error" : "Untitled")}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                                        <td className={`px-4 py-3 font-bold ${c.text}`}>{(s.riskLevel || (s.error ? "ERROR" : "—")).toUpperCase()}</td>
                                        <td className="px-4 py-3">{s.riskScore ?? "—"}{s.riskScore != null && "/100"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" data-testid={`view-${s.scan_id}`} className="rounded-lg gap-1" onClick={(e)=>{e.stopPropagation(); nav(`/result/${s.scan_id}`);}}><Eye className="w-3.5 h-3.5" /> View</Button>
                                                <Button size="sm" variant="ghost" data-testid={`delete-${s.scan_id}`} className="rounded-lg text-destructive" onClick={(e)=>del(s.scan_id, e)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
