import React, { createContext, useContext, useState, useEffect } from 'react';

// The base URL for your Express backend
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/auth`;

// 1. Create the Context
const AuthContext = createContext();

// A custom hook to use the auth context easily
export const useAuth = () => useContext(AuthContext);

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
    // We'll try to load user data from localStorage on initial load
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [isAuthenticated, setIsAuthenticated] = useState(!!user);
    
    // We assume the auth state is ready instantly based on localStorage,
    // but in a real app, you might check the token validity here.
    const [isAuthReady, setIsAuthReady] = useState(true); 

    // Effect to keep localStorage in sync with user state
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('user');
            setIsAuthenticated(false);
        }
    }, [user]);

    // This function will be called in your Login/Signup components
    const login = (userData) => {
        // userData comes from the successful backend response
        // Note: The token is in an HTTP-only cookie, so we only store the user data locally.
        setUser(userData.user);
    };

    /**
     * MANDATORY: Calls the Express backend to clear the httpOnly cookie.
     */
    const logout = async () => {
        try {
            // Include credentials to send the existing cookie to the server
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'GET',
                credentials: 'include', 
            });
        } catch (error) {
            // Log error but proceed to clear client state
            console.error("Error clearing server-side cookie during logout:", error);
        } finally {
            // Always clear client-side state
            setUser(null);
        }
    };

    const value = {
        user,
        isAuthenticated,
        isAuthReady, // Useful for waiting before rendering protected routes
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
