import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            // Remove expired or invalid credentials so the next login starts cleanly.
            localStorage.removeItem("cs_token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // CRITICAL: If returning from OAuth callback, skip the /me check.
        // AuthCallback will exchange the session_id and establish the session first.
        if (window.location.hash?.includes("session_id=")) {
            setLoading(false);
            return;
        }
        checkAuth();
    }, [checkAuth]);

    const loginJwt = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("cs_token", data.token);
        setUser(data.user);
        return data.user;
    };
    const registerJwt = async (name, email, password) => {
        const { data } = await api.post("/auth/register", { name, email, password });
        localStorage.setItem("cs_token", data.token);
        setUser(data.user);
        return data.user;
    };
    const logout = async () => {
        try { await api.post("/auth/logout"); } catch {}
        localStorage.removeItem("cs_token");
        setUser(null);
    };
    const setAuthFromCallback = (token, user) => {
        localStorage.setItem("cs_token", token);
        setUser(user);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, loginJwt, registerJwt, logout, setAuthFromCallback, checkAuth }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
