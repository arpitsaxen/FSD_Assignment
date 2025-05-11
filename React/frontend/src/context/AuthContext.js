// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Check if user is already logged in
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        
        setLoading(false);
    }, []);
    
    const login = async (username, password) => {
        try {
            const response = await API.post('auth/login/', { username, password });
            const { access, refresh, user } = response.data;
            
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(user));
            
            setUser(user);
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };
    
    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
    };
    
    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};