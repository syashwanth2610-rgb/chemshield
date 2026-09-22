import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

import Landing from "@/pages/Landing";
import { LoginPage, SignupPage } from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import Scanner from "@/pages/Scanner";
import Result from "@/pages/Result";
import History from "@/pages/History";
import RiskMap from "@/pages/RiskMap";
import Library from "@/pages/Library";
import Report from "@/pages/Report";
import Reports from "@/pages/Reports";
import { Profile, SettingsPage } from "@/pages/Profile";
import AppShell from "@/components/AppShell";

function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm animate-pulse">Loading ChemShield…</div>
    );
    if (!user) return <Navigate to="/login" replace />;
    return <AppShell>{children}</AppShell>;
}

function InnerRoutes() {
    const location = useLocation();
    // Detect OAuth callback fragment during render (avoids race conditions)
    if (location.hash?.includes("session_id=")) return <AuthCallback />;

    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/scan" element={<Protected><Scanner /></Protected>} />
            <Route path="/result/:id" element={<Protected><Result /></Protected>} />
            <Route path="/history" element={<Protected><History /></Protected>} />
            <Route path="/map" element={<Protected><RiskMap /></Protected>} />
            <Route path="/library" element={<Protected><Library /></Protected>} />
            <Route path="/report/:id" element={<Protected><Report /></Protected>} />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                    <InnerRoutes />
                    <Toaster richColors position="top-right" theme="dark" toastOptions={{ style: { borderRadius: 12 } }} />
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}
