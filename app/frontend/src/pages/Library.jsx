import React from "react";
import { Beaker, FlaskConical, Leaf, Building2, SprayCan, Skull, Flame, AlertTriangle, Droplets, TreePine, Zap, Heart } from "lucide-react";

const categories = [
    { icon: SprayCan, title: "Household Chemicals", body: "Cleaning products, detergents, bleaches — often mixed at home." },
    { icon: Leaf, title: "Agricultural Chemicals", body: "Pesticides, herbicides and fertilizers used in the field." },
    { icon: Building2, title: "Industrial Chemicals", body: "Solvents, acids and reagents used in manufacturing." },
    { icon: FlaskConical, title: "Laboratory Chemicals", body: "Research-grade compounds in schools and universities." },
    { icon: Beaker, title: "Cleaning Products", body: "Commercial disinfectants and specialty cleaners." },
];

const symbols = [
    { icon: Skull, name: "Toxic", color: "#ef4444", body: "May cause serious harm or death if inhaled, swallowed or absorbed." },
    { icon: Flame, name: "Flammable", color: "#f97316", body: "Ignites easily; keep away from sparks, flame and heat." },
    { icon: AlertTriangle, name: "Irritant", color: "#f59e0b", body: "Causes skin, eye or respiratory irritation." },
    { icon: Droplets, name: "Corrosive", color: "#a855f7", body: "Causes burns to skin, eyes or damage to materials." },
    { icon: TreePine, name: "Environmental Hazard", color: "#22c55e", body: "Toxic to aquatic life or the environment." },
    { icon: Zap, name: "Explosive", color: "#dc2626", body: "May explode under heat, shock, friction or fire." },
    { icon: Heart, name: "Health Hazard", color: "#3b82f6", body: "May cause long-term or serious health effects." },
];

export default function Library() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header>
                <div className="text-xs tracking-widest uppercase text-cyan-400">Learn</div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Safety Library</h1>
                <p className="text-muted-foreground mt-1">General awareness only — always defer to product SDS and local safety authority.</p>
            </header>

            <section>
                <div className="text-xs tracking-widest uppercase text-emerald-400 mb-3">Categories</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((c) => (
                        <div key={c.title} className="cs-glass p-5 hover:-translate-y-1 transition-transform">
                            <c.icon className="w-6 h-6 text-cyan-400 mb-3" />
                            <div className="font-display text-lg font-semibold">{c.title}</div>
                            <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <div className="text-xs tracking-widest uppercase text-yellow-400 mb-3">Hazard Symbol Guide</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {symbols.map((s) => (
                        <div key={s.name} className="cs-glass p-5 hover:-translate-y-1 transition-transform" data-testid={`hazard-${s.name.toLowerCase().replace(/\s/g, "-")}`}>
                            <div className="w-11 h-11 rounded-xl grid place-items-center mb-3" style={{ background: s.color + "20", border: `1px solid ${s.color}55` }}>
                                <s.icon className="w-5 h-5" style={{ color: s.color }} />
                            </div>
                            <div className="font-display text-lg font-semibold">{s.name}</div>
                            <p className="text-sm text-muted-foreground mt-1">{s.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="cs-glass p-6">
                <div className="text-xs tracking-widest uppercase text-cyan-400 mb-2">Basic Awareness</div>
                <ul className="grid sm:grid-cols-2 gap-3 text-sm">
                    <li className="p-3 rounded-lg bg-secondary/40"><b>Common exposure routes:</b> inhalation, skin/eye contact, ingestion.</li>
                    <li className="p-3 rounded-lg bg-secondary/40"><b>Basic precautions:</b> read the label, use PPE, ventilate, avoid mixing.</li>
                    <li className="p-3 rounded-lg bg-secondary/40"><b>Emergency:</b> contact local poison control / emergency services immediately.</li>
                    <li className="p-3 rounded-lg bg-secondary/40"><b>Storage:</b> original container, out of children's reach, cool and dry.</li>
                </ul>
                <div className="mt-4 text-[11px] italic text-muted-foreground">
                    ChemShield AI does not provide handling procedures or exposure limits. Always consult the product SDS.
                </div>
            </section>
        </div>
    );
}
