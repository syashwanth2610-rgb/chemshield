import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Shield } from "lucide-react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
    const loc = useLocation();
    const nav = useNavigate();
    const { setAuthFromCallback } = useAuth();
    const done = useRef(false);

    useEffect(() => {
        if (done.current) return;
        done.current = true;
        const hash = loc.hash.startsWith("#") ? loc.hash.slice(1) : loc.hash;
        const params = new URLSearchParams(hash);
        const sessionId = params.get("session_id");
        if (!sessionId) { nav("/login"); return; }
        (async () => {
            try {
                const { data } = await api.post("/auth/google/callback", { session_id: sessionId });
                setAuthFromCallback(data.token, data.user);
                window.history.replaceState({}, "", "/dashboard");
                toast.success(`Welcome, ${data.user.name?.split(" ")[0] || "Analyst"}!`);
                nav("/dashboard", { replace: true, state: { user: data.user } });
            } catch (e) {
                toast.error("Google sign-in failed. Please try again.");
                nav("/login", { replace: true });
            }
        })();
    }, [loc, nav, setAuthFromCallback]);

    return (
        <div className="min-h-screen grid place-items-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center animate-pulse">
                    <Shield className="w-7 h-7 text-slate-900" />
                </div>
                <div className="text-sm text-muted-foreground">Completing sign-in...</div>
            </div>
        </div>
    );
}
