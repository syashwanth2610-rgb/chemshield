import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Square, Volume2, Sparkles, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Build a natural, safety-first spoken brief from a scan document.
function buildBrief(scan) {
    if (!scan || scan.error) return "This product could not be confidently identified. Please try another image of the label.";
    const level = (scan.riskLevel || "unknown").toString().toLowerCase();
    const score = scan.riskScore ?? "unknown";
    const product = scan.productName || "an unidentified chemical product";
    const hazards = (scan.hazardSymbols || []).map(h => h.name || h.icon).filter(Boolean).slice(0, 4);
    const routes = (scan.exposureRoutes || []).slice(0, 4);
    const recs = (scan.recommendations || []).slice(0, 3);
    const insight = scan.aiInsight || "";

    const parts = [];
    parts.push(`ChemShield safety brief for ${product}.`);
    parts.push(`Overall risk level: ${level}, with a score of ${score} out of one hundred.`);
    if (hazards.length) parts.push(`Detected hazard indicators include: ${hazards.join(", ")}.`);
    if (routes.length) parts.push(`Likely exposure routes are: ${routes.join(", ")}.`);
    if (recs.length) parts.push(`Recommended precautions: ${recs.map((r, i) => `${i + 1}. ${r}`).join(" ")}`);
    if (insight) parts.push(`AI insight: ${insight}`);
    parts.push("This assessment is for safety awareness and should not replace the product safety data sheet or emergency services.");
    return parts.join(" ");
}

export default function VoiceReport({ scan }) {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window;
    const brief = useMemo(() => buildBrief(scan), [scan]);
    const [playing, setPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [rate, setRate] = useState(1);
    const [voice, setVoice] = useState(null);
    const [voices, setVoices] = useState([]);
    const utterRef = useRef(null);

    // Load voices (async in some browsers)
    useEffect(() => {
        if (!supported) return;
        const load = () => {
            const list = window.speechSynthesis.getVoices();
            setVoices(list);
            if (!voice && list.length) {
                // Prefer an English natural voice
                const preferred =
                    list.find(v => /en(-|_)?(US|GB|AU|IN)/i.test(v.lang) && /female|samantha|google|natural|siri/i.test(v.name)) ||
                    list.find(v => /^en/i.test(v.lang)) ||
                    list[0];
                setVoice(preferred);
            }
        };
        load();
        window.speechSynthesis.onvoiceschanged = load;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, [supported]); // eslint-disable-line

    // Stop on unmount / scan change
    useEffect(() => {
        return () => { if (supported) window.speechSynthesis.cancel(); };
    }, [supported]);
    useEffect(() => {
        if (supported) window.speechSynthesis.cancel();
        setPlaying(false); setPaused(false);
    }, [scan?.scan_id, supported]);

    const play = () => {
        if (!supported) { toast.error("Voice not supported in this browser"); return; }
        if (paused && utterRef.current) {
            window.speechSynthesis.resume();
            setPaused(false); setPlaying(true);
            return;
        }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(brief);
        u.rate = rate; u.pitch = 1; u.volume = 1;
        if (voice) u.voice = voice;
        u.onend = () => { setPlaying(false); setPaused(false); };
        u.onerror = () => { setPlaying(false); setPaused(false); toast.error("Voice playback failed"); };
        utterRef.current = u;
        window.speechSynthesis.speak(u);
        setPlaying(true); setPaused(false);
    };

    const pause = () => { if (supported && playing) { window.speechSynthesis.pause(); setPaused(true); setPlaying(false); } };
    const stop = () => { if (supported) { window.speechSynthesis.cancel(); setPlaying(false); setPaused(false); } };

    return (
        <div className="cs-gradient-border p-1" data-testid="voice-report">
            <div className="rounded-[calc(1rem-2px)] bg-card p-5">
                <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 ${playing ? "animate-pulse" : ""}`}>
                        <Volume2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-cyan-400">
                            <Sparkles className="w-3.5 h-3.5" /> Voice Safety Brief
                        </div>
                        <div className="font-display text-lg font-semibold mt-0.5">Listen to the safety summary</div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{brief}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {!playing && !paused && (
                                <Button data-testid="voice-play-btn" onClick={play} size="sm" className="rounded-xl gap-1.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold hover:from-cyan-300 hover:to-emerald-300">
                                    <Play className="w-3.5 h-3.5" /> Play
                                </Button>
                            )}
                            {playing && (
                                <Button data-testid="voice-pause-btn" onClick={pause} size="sm" variant="outline" className="rounded-xl gap-1.5">
                                    <Pause className="w-3.5 h-3.5" /> Pause
                                </Button>
                            )}
                            {paused && (
                                <Button data-testid="voice-resume-btn" onClick={play} size="sm" className="rounded-xl gap-1.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold">
                                    <Play className="w-3.5 h-3.5" /> Resume
                                </Button>
                            )}
                            {(playing || paused) && (
                                <Button data-testid="voice-stop-btn" onClick={stop} size="sm" variant="ghost" className="rounded-xl gap-1.5">
                                    <Square className="w-3.5 h-3.5" /> Stop
                                </Button>
                            )}

                            <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
                                <Gauge className="w-3.5 h-3.5" />
                                <select
                                    data-testid="voice-rate-select"
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value))}
                                    className="bg-secondary rounded-lg px-2 py-1 text-xs border border-border"
                                >
                                    <option value="0.85">0.85x</option>
                                    <option value="1">1x</option>
                                    <option value="1.15">1.15x</option>
                                    <option value="1.3">1.3x</option>
                                </select>
                                {voices.length > 1 && (
                                    <select
                                        data-testid="voice-select"
                                        value={voice?.name || ""}
                                        onChange={(e) => setVoice(voices.find(v => v.name === e.target.value))}
                                        className="bg-secondary rounded-lg px-2 py-1 text-xs border border-border max-w-[140px] truncate"
                                    >
                                        {voices.filter(v => /^en/i.test(v.lang)).slice(0, 8).map(v => (
                                            <option key={v.name} value={v.name}>{v.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {!supported && (
                            <div className="text-[11px] text-muted-foreground mt-2 italic">Voice playback is not supported in this browser.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
