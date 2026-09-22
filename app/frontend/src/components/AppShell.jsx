import React from "react";
import { useAuth } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Particles from "./Particles";

export default function AppShell({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center bg-background">
                <div className="text-muted-foreground text-sm animate-pulse">Loading ChemShield...</div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
            <div className="cs-aurora opacity-40" />
            <Particles count={12} />
            <div className="relative flex min-h-screen">
                <Sidebar />
                <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
