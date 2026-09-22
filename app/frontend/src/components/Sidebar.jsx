import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ScanLine, History, Map, BookOpen, FileText, User, Settings, Shield, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
    { to: "/scan", label: "Scan Product", icon: ScanLine, id: "nav-scan" },
    { to: "/history", label: "Scan History", icon: History, id: "nav-history" },
    { to: "/map", label: "Risk Map", icon: Map, id: "nav-map" },
    { to: "/library", label: "Safety Library", icon: BookOpen, id: "nav-library" },
    { to: "/reports", label: "Reports", icon: FileText, id: "nav-reports" },
    { to: "/profile", label: "Profile", icon: User, id: "nav-profile" },
    { to: "/settings", label: "Settings", icon: Settings, id: "nav-settings" },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const nav = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success("Signed out");
        nav("/");
    };

    return (
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-md" data-testid="sidebar">
            <div className="px-6 py-6 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center shadow-lg shadow-cyan-500/20">
                    <Shield className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                    <div className="font-display text-lg font-bold tracking-tight">CHEMSHIELD</div>
                    <div className="text-[10px] tracking-widest uppercase text-muted-foreground">AI · Safety</div>
                </div>
            </div>
            <nav className="px-3 flex-1 space-y-1">
                {items.map((it) => (
                    <NavLink
                        key={it.to}
                        to={it.to}
                        data-testid={it.id}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-primary/15 text-primary shadow-inner"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`
                        }
                    >
                        <it.icon className="w-4 h-4" />
                        {it.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-3 border-t border-border space-y-2">
                <button
                    onClick={toggle}
                    data-testid="theme-toggle-sidebar"
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-accent/50">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center text-slate-900 font-bold">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{user?.name || "User"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        data-testid="logout-btn"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
