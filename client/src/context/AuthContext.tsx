import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

interface User {
    _id: string,
    name: string,
    email: string,
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    login: (userData: User, token: string, refreshToken?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        }
        setIsLoading(false);

        const handleLogoutEvent = () => {
            setUser(null);
            setToken(null);
            setRefreshToken(null);
        };

        window.addEventListener("auth:logout", handleLogoutEvent);
        return () => window.removeEventListener("auth:logout", handleLogoutEvent);
    }, []);

    const login = (userData: User, newToken: string, newRefreshToken?: string) => {
        const resolvedRefreshToken = newRefreshToken || (userData as any)?.refreshToken || null;

        setUser(userData);
        setToken(newToken);
        setRefreshToken(resolvedRefreshToken);

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", newToken);
        if (resolvedRefreshToken) {
            localStorage.setItem("refreshToken", resolvedRefreshToken);
        }
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    };

    const logout = () => {
        const currentRefreshToken = refreshToken || localStorage.getItem("refreshToken");
        if (currentRefreshToken) {
            api.post("/api/auth/logout", { refreshToken: currentRefreshToken }).catch(() => {});
        }

        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        delete api.defaults.headers.common["Authorization"];
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                refreshToken,
                isLoading,
                login,
                logout,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};