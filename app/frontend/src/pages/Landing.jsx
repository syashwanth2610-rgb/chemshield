import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Camera, Brain, AlertTriangle, ShieldCheck, Sparkles, ScanLine, FlaskConical, Beaker, Leaf, Building2, GraduationCap, Zap, Shield, Sun, Moon } from "lucide-react";
import Particles from "@/components/Particles";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

const HERO_IMG = "https://images.unsplash.com/photo-1639322537228-f710d846310a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNoZW1pY2FsJTIwbW9sZWN1bGUlMjBuZXR3b3JrJTIwZGFya3xlbnwwfHx8fDE3ODk0NjIzMzh8MA&ixlib=rb-4.1.0&q=85";

const stats = [
    { k: "10K+", v: "Products Analyzed" },
    { k: "AI", v: "Risk Detection" },
    { k: "Real-time", v: "Analysis" },
    { k: "Safety-first", v: "Design" },
];

const steps = [
    { icon: Camera, title: "Capture", body: "Take a photo or upload a product label." },
    { icon: Brain, title: "Analyze", body: "AI extracts product information and hazard indicators." },
    { icon: AlertTriangle, title: "Assess", body: "The system estimates potential exposure risk." },
    { icon: ShieldCheck, title: "Protect", body: "Get safety recommendations and next steps." },
];

const why = [
    { icon: Building2, title: "Workplace Safety", body: "Empower teams to identify chemical risks before handling." },
    { icon: Beaker, title: "Household Chemical Awareness", body: "Understand what's under your sink." },
    { icon: Leaf, title: "Agricultural Safety", body: "Reduce exposure risk in the field." },
    { icon: FlaskConical, title: "Laboratory Safety", body: "Support students and researchers with instant awareness." },
    { icon: GraduationCap, title: "Environmental Protection", body: "Prevent avoidable spills, misuse and cross-contamination." },
];

export default function Landing() {
    const nav = useNavigate();
    const { theme, toggle } = useTheme();
    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
            <div className="cs-aurora" />
            <Particles count={26} />

            {/* Nav */}
            <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center shadow-lg shadow-cyan-500/30">
                        <Shield className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                        <div className="font-display text-xl font-bold tracking-tight">CHEMSHIELD <span className="cs-gradient-text">AI</span></div>
                        <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Chemical Exposure Risk Mapper</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggle} data-testid="landing-theme-toggle" className="p-2 rounded-xl hover:bg-accent transition-colors">
                        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <Link to="/login" data-testid="nav-login" className="text-sm font-medium px-4 py-2 rounded-xl hover:bg-accent transition-colors">Sign In</Link>
                    <Button onClick={() => nav("/signup")} data-testid="nav-signup" className="rounded-xl">Get Started</Button>
                </div>
            </header>

            {/* Hero */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-10 items-center">
                <div className="cs-rise">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs font-medium mb-6">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Powered by Gemini 3 Flash Vision · Demo Prototype
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
                        Know the <span className="cs-gradient-text">chemical risk</span><br />before it becomes an exposure.
                    </h1>
                    <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl">
                        Upload a photo of a chemical product label and let AI identify potential hazards,
                        estimate exposure risk, and provide practical safety guidance.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button onClick={() => nav("/signup")} data-testid="hero-analyze-btn" size="lg" className="rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-900 font-semibold shadow-lg shadow-cyan-500/20">
                            <ScanLine className="w-4 h-4" /> Analyze a Product
                        </Button>
                        <Button onClick={() => nav("/login")} data-testid="hero-demo-btn" variant="outline" size="lg" className="rounded-xl gap-2">
                            Explore Demo <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {stats.map((s, i) => (
                            <div key={s.v} className={`cs-glass p-4 cs-rise cs-delay-${i+1}`}>
                                <div className="font-display text-2xl font-bold cs-gradient-text">{s.k}</div>
                                <div className="text-[11px] tracking-widest uppercase text-muted-foreground mt-1">{s.v}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hero visual */}
                <div className="relative cs-rise cs-delay-2">
                    <div className="cs-gradient-border p-1">
                        <div className="rounded-[calc(1rem-2px)] overflow-hidden bg-card">
                            <div className="relative aspect-[4/5] cs-scan-beam">
                                <img src={HERO_IMG} alt="Chemical molecule visualization" className="w-full h-full object-cover opacity-90" />
                                <div className="absolute inset-4 rounded-2xl border border-cyan-400/30 pointer-events-none">
                                    <span className="cs-corner cs-corner-tl" />
                                    <span className="cs-corner cs-corner-tr" />
                                    <span className="cs-corner cs-corner-bl" />
                                    <span className="cs-corner cs-corner-br" />
                                </div>
                                {/* Floating hazard badges */}
                                <div className="absolute top-6 right-6 flex flex-col gap-2">
                                    {[
                                        { l: "Flammable", c: "from-orange-400 to-red-500" },
                                        { l: "Toxic", c: "from-red-500 to-pink-500" },
                                        { l: "Irritant", c: "from-yellow-400 to-orange-400" },
                                    ].map((b, i) => (
                                        <div key={b.l} className={`px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-900 bg-gradient-to-r ${b.c} shadow-lg cs-rise cs-delay-${i+1}`}>
                                            {b.l}
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 cs-glass-strong p-4 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Live Analysis</span>
                                        <span className="text-xs font-bold text-orange-400">HIGH RISK · 72/100</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                        {["Inhalation","Skin","Eyes"].map(x => (
                                            <div key={x} className="p-2 rounded-lg bg-background/60">
                                                <div className="text-muted-foreground">{x}</div>
                                                <div className="h-1.5 mt-1 rounded-full bg-border overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-orange-400 to-red-500" style={{width: `${60+Math.random()*30}%`}} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="text-xs tracking-widest uppercase text-cyan-400 mb-3">The Process</div>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold">How It Works</h2>
                </div>
                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {steps.map((s, i) => (
                        <div key={s.title} className={`cs-glass p-6 cs-rise cs-delay-${i+1} hover:-translate-y-1 transition-transform`}>
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 grid place-items-center mb-4">
                                <s.icon className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Step {i+1}</div>
                            <div className="font-display text-xl font-bold mt-1">{s.title}</div>
                            <p className="text-sm text-muted-foreground mt-2">{s.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why it matters */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
                <div className="max-w-2xl">
                    <div className="text-xs tracking-widest uppercase text-emerald-400 mb-3">Impact</div>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold">Why Chemical Exposure Mapping Matters</h2>
                </div>
                <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {why.map((w) => (
                        <div key={w.title} className="cs-glass p-6 hover:-translate-y-1 transition-transform">
                            <w.icon className="w-6 h-6 text-emerald-400 mb-3" />
                            <div className="font-display text-lg font-semibold">{w.title}</div>
                            <p className="text-sm text-muted-foreground mt-1">{w.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
                <div className="cs-gradient-border p-1 rounded-2xl">
                    <div className="rounded-[calc(1rem-2px)] bg-card p-10 sm:p-14 text-center relative overflow-hidden">
                        <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                        <h3 className="font-display text-3xl sm:text-5xl font-bold">Don't Guess. <span className="cs-gradient-text">Scan the Risk.</span></h3>
                        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">See the risk. Understand the hazard. Stay safe.</p>
                        <Button onClick={() => nav("/signup")} data-testid="cta-scan-btn" size="lg" className="mt-8 rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-900 font-semibold">
                            <ScanLine className="w-4 h-4" /> Start Chemical Scan
                        </Button>
                        <p className="mt-6 text-[11px] text-muted-foreground italic max-w-lg mx-auto">
                            AI-generated risk assessment — verify with the official product Safety Data Sheet (SDS) and local safety guidance.
                        </p>
                    </div>
                </div>
            </section>

            <footer className="relative z-10 border-t border-border py-8 text-center text-sm text-muted-foreground">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between gap-3">
                    <div><span className="font-display font-bold text-foreground">CHEMSHIELD AI</span> · AI-powered chemical safety awareness platform.</div>
                    <div>© {new Date().getFullYear()} · Prototype for hackathon demo</div>
                </div>
            </footer>
        </div>
    );
}
