import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/auth`;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // ✅ Store both user and token
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    
    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || null;
    });
    
    const [isAuthenticated, setIsAuthenticated] = useState(!!user && !!token);
    const [isAuthReady, setIsAuthReady] = useState(true);

    // ✅ Sync with localStorage
    useEffect(() => {
        if (user && token) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
        }
    }, [user, token]);

    // ✅ Updated login function
    const login = (userData) => {
        setUser(userData.user);
        setToken(userData.token); // Store the token
    };

    // ✅ Updated logout function
    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'GET',
                credentials: 'include',
            });
        } catch (error) {
            console.error("Error clearing server-side cookie during logout:", error);
        } finally {
            setUser(null);
            setToken(null);
        }
    };

    const value = {
        user,
        token, // 🔥 Expose token for API calls
        isAuthenticated,
        isAuthReady,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
