import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Particles from "@/components/Particles";

function googleLogin() {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}

export function LoginPage() {
    const nav = useNavigate();
    const { loginJwt } = useAuth();
    const [email, setEmail] = useState("demo@chemshield.ai");
    const [password, setPassword] = useState("Demo@1234");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginJwt(email, password);
            toast.success("Signed in successfully");
            nav("/dashboard");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return <AuthLayout mode="login">
        <form onSubmit={submit} className="space-y-4" data-testid="login-form">
            <div>
                <Label className="text-xs tracking-widest uppercase text-muted-foreground">Email</Label>
                <div className="relative mt-1.5">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input data-testid="login-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" className="pl-9 h-11 rounded-xl" required />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between">
                    <Label className="text-xs tracking-widest uppercase text-muted-foreground">Password</Label>
                    <button type="button" className="text-xs text-cyan-400 hover:underline">Forgot?</button>
                </div>
                <div className="relative mt-1.5">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input data-testid="login-password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="pl-9 h-11 rounded-xl" required />
                </div>
            </div>
            <Button disabled={loading} data-testid="login-submit" type="submit" className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold hover:from-cyan-300 hover:to-emerald-300">
                {loading ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <div className="text-[10px] tracking-widest uppercase text-muted-foreground">or</div>
            <div className="h-px flex-1 bg-border" />
        </div>

        <Button onClick={googleLogin} data-testid="google-signin-btn" variant="outline" className="w-full h-11 rounded-xl gap-2">
            <GoogleIcon /> Continue with Google
        </Button>

        <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link data-testid="switch-to-signup" to="/signup" className="text-cyan-400 hover:underline font-medium">Create one</Link>
        </div>
        <div className="mt-3 text-center text-[11px] text-muted-foreground">
            Demo login is pre-filled — just click <b>Sign In</b>.
        </div>
    </AuthLayout>;
}

export function SignupPage() {
    const nav = useNavigate();
    const { registerJwt } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (password !== confirm) { toast.error("Passwords do not match"); return; }
        setLoading(true);
        try {
            await registerJwt(name, email, password);
            toast.success("Welcome to ChemShield!");
            nav("/dashboard");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Signup failed");
        } finally { setLoading(false); }
    };

    return <AuthLayout mode="signup">
        <form onSubmit={submit} className="space-y-4" data-testid="signup-form">
            <div>
                <Label className="text-xs tracking-widest uppercase text-muted-foreground">Full Name</Label>
                <div className="relative mt-1.5">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input data-testid="signup-name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Jane Analyst" className="pl-9 h-11 rounded-xl" required />
                </div>
            </div>
            <div>
                <Label className="text-xs tracking-widest uppercase text-muted-foreground">Email</Label>
                <div className="relative mt-1.5">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input data-testid="signup-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" className="pl-9 h-11 rounded-xl" required />
                </div>
            </div>
            <div>
                <Label className="text-xs tracking-widest uppercase text-muted-foreground">Password</Label>
                <div className="relative mt-1.5">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input data-testid="signup-password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="At least 6 characters" className="pl-9 h-11 rounded-xl" required />
                </div>
            </div>
            <div>
                <Label className="text-xs tracking-widest uppercase text-muted-foreground">Confirm Password</Label>
                <div className="relative mt-1.5">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input data-testid="signup-confirm" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="Retype password" className="pl-9 h-11 rounded-xl" required />
                </div>
            </div>
            <Button disabled={loading} data-testid="signup-submit" type="submit" className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold hover:from-cyan-300 hover:to-emerald-300">
                {loading ? "Creating..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </Button>
        </form>
        <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" /><div className="text-[10px] tracking-widest uppercase text-muted-foreground">or</div><div className="h-px flex-1 bg-border" />
        </div>
        <Button onClick={googleLogin} data-testid="google-signup-btn" variant="outline" className="w-full h-11 rounded-xl gap-2">
            <GoogleIcon /> Continue with Google
        </Button>
        <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link data-testid="switch-to-login" to="/login" className="text-cyan-400 hover:underline font-medium">Sign in</Link>
        </div>
    </AuthLayout>;
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
        </svg>
    );
}

function AuthLayout({ children, mode }) {
    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-hidden grid lg:grid-cols-2">
            <div className="cs-aurora" />
            <Particles count={18} />

            {/* Left visual */}
            <div className="relative z-10 hidden lg:flex flex-col justify-between p-12">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center shadow-lg shadow-cyan-500/30">
                        <Shield className="w-5 h-5 text-slate-900" />
                    </div>
                    <span className="font-display text-xl font-bold">CHEMSHIELD <span className="cs-gradient-text">AI</span></span>
                </Link>
                <div>
                    <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
                        Your safety intelligence <span className="cs-gradient-text">starts here.</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-md">
                        Securely access your chemical risk analysis dashboard — powered by AI vision.
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground">
                        <span className="w-8 h-px bg-cyan-400" /> SCAN · UNDERSTAND · STAY SAFE
                    </div>
                </div>
                <div className="text-[11px] text-muted-foreground">Prototype for hackathon demo — always verify with SDS.</div>
            </div>

            {/* Right form */}
            <div className="relative z-10 flex items-center justify-center p-6 sm:p-10">
                <div className="cs-gradient-border p-1 w-full max-w-md">
                    <div className="rounded-[calc(1rem-2px)] bg-card p-8">
                        <div className="lg:hidden flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 grid place-items-center">
                                <Shield className="w-5 h-5 text-slate-900" />
                            </div>
                            <span className="font-display text-lg font-bold">CHEMSHIELD <span className="cs-gradient-text">AI</span></span>
                        </div>
                        <div className="text-xs tracking-widest uppercase text-cyan-400">{mode === "login" ? "Welcome Back" : "Create Account"}</div>
                        <h1 className="font-display text-3xl font-bold mt-1">{mode === "login" ? "Sign in to ChemShield" : "Join ChemShield AI"}</h1>
                        <p className="text-sm text-muted-foreground mt-1 mb-6">{mode === "login" ? "Continue to your safety dashboard." : "Start scanning chemical risks in seconds."}</p>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
