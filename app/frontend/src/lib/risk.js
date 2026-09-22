// Helper to color-code risk levels
export const riskColor = (level) => {
    switch ((level || "").toUpperCase()) {
        case "LOW": return { text: "risk-low", bg: "bg-risk-low", hex: "#22c55e", label: "Low Risk" };
        case "MODERATE": return { text: "risk-moderate", bg: "bg-risk-moderate", hex: "#f59e0b", label: "Moderate Risk" };
        case "HIGH": return { text: "risk-high", bg: "bg-risk-high", hex: "#f97316", label: "High Risk" };
        case "CRITICAL": return { text: "risk-critical", bg: "bg-risk-critical", hex: "#ef4444", label: "Critical Risk" };
        default: return { text: "risk-low", bg: "bg-risk-low", hex: "#22c55e", label: "Low Risk" };
    }
};

export const hazardMeta = {
    toxic: { label: "Toxic", color: "#ef4444" },
    flammable: { label: "Flammable", color: "#f97316" },
    irritant: { label: "Irritant", color: "#f59e0b" },
    corrosive: { label: "Corrosive", color: "#a855f7" },
    environmental: { label: "Environmental", color: "#22c55e" },
    explosive: { label: "Explosive", color: "#dc2626" },
    oxidizer: { label: "Oxidizer", color: "#eab308" },
    health: { label: "Health Hazard", color: "#3b82f6" },
};
