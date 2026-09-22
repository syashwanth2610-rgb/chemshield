import React from "react";

export default function Particles({ count = 22 }) {
    const parts = Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        const size = 3 + Math.random() * 6;
        const delay = -Math.random() * 18;
        const dur = 12 + Math.random() * 14;
        const hue = ["#00F2FE", "#38F9D7", "#FDEB71"][i % 3];
        return (
            <span
                key={i}
                className="cs-particle"
                style={{
                    left: `${left}%`,
                    top: `${100 + Math.random() * 20}%`,
                    width: size,
                    height: size,
                    background: `radial-gradient(circle at 30% 30%, ${hue}, transparent 70%)`,
                    boxShadow: `0 0 10px ${hue}`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${dur}s`,
                }}
            />
        );
    });
    return <div className="cs-particles">{parts}</div>;
}
