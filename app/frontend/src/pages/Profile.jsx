import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import api from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User as UserIcon, Bell, Palette, Globe, ShieldCheck, Database, ScanLine, AlertTriangle } from "lucide-react";

export function Profile() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    useEffect(() => {
        (async () => { try { const { data } = await api.get("/stats/summary"); setStats(data); } catch {} })();
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header>
                <div className="text-xs tracking-widest uppercase text-cyan-400">Account</div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Profile</h1>
            </header>

            <div className="cs-glass p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center text-slate-900 font-bold text-2xl">
                    {user?.picture ? <img src={user.picture} alt="" className="w-16 h-16 rounded-2xl object-cover" /> : user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="font-display text-xl font-bold">{user?.name}</div>
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Signed in via {user?.provider === "google" ? "Google" : "Email"}</div>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="cs-glass p-5">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Total Scans</div>
                        <ScanLine className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="font-display text-3xl font-bold mt-2">{stats?.total ?? 0}</div>
                </div>
                <div className="cs-glass p-5">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] tracking-widest uppercase text-muted-foreground">Risk Alerts</div>
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="font-display text-3xl font-bold mt-2">{stats?.alerts ?? 0}</div>
                </div>
            </div>
        </div>
    );
}

export function SettingsPage() {
    const { theme, toggle } = useTheme();
    const [notif, setNotif] = useState(() => localStorage.getItem("cs_notif") !== "false");
    useEffect(() => localStorage.setItem("cs_notif", String(notif)), [notif]);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header>
                <div className="text-xs tracking-widest uppercase text-cyan-400">Preferences</div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Settings</h1>
            </header>

            <Row icon={Palette} title="Appearance" desc="Switch between dark and light mode">
                <div className="flex items-center gap-3">
                    <Label htmlFor="darkmode" className="text-sm">Dark Mode</Label>
                    <Switch id="darkmode" data-testid="setting-darkmode" checked={theme === "dark"} onCheckedChange={toggle} />
                </div>
            </Row>

            <Row icon={Bell} title="Notifications" desc="Get toasts for scan events">
                <Switch data-testid="setting-notif" checked={notif} onCheckedChange={(v)=>{ setNotif(v); toast.success(v ? "Notifications on" : "Notifications off"); }} />
            </Row>

            <Row icon={Globe} title="Language" desc="Interface language (locked in demo)">
                <span className="text-sm text-muted-foreground">English (US)</span>
            </Row>

            <Row icon={ShieldCheck} title="Privacy" desc="Your scans stay tied to your account and are never shared.">
                <span className="text-xs text-emerald-400">Protected</span>
            </Row>

            <Row icon={Database} title="Data Management" desc="You can delete individual scans in Scan History.">
                <span className="text-xs text-muted-foreground">Manage</span>
            </Row>
        </div>
    );
}

function Row({ icon: Icon, title, desc, children }) {
    return (
        <div className="cs-glass p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center"><Icon className="w-5 h-5 text-cyan-400" /></div>
            <div className="flex-1">
                <div className="font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <div>{children}</div>
        </div>
    );
}
