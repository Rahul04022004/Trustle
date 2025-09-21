
import React, { useState, useEffect, useCallback } from 'react';
import App from './App';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';

type Page = 'landing' | 'auth';

const Main: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('landing');

    useEffect(() => {
        try {
            const loggedInUser = localStorage.getItem('currentUser');
            if (loggedInUser) {
                setCurrentUser(loggedInUser);
            }
        } catch (error) {
            console.error("Failed to access localStorage:", error);
        }
    }, []);

    const handleLoginSuccess = useCallback((username: string) => {
        try {
            localStorage.setItem('currentUser', username);
            setCurrentUser(username);
        } catch (error) {
            console.error("Failed to save user to localStorage:", error);
        }
    }, []);

    const handleLogout = useCallback(() => {
        try {
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
            setCurrentPage('landing');
        } catch (error) {
            console.error("Failed to clear user from localStorage:", error);
        }
    }, []);

    const navigateToAuth = (initialState: 'login' | 'signup' = 'login') => {
        setCurrentPage('auth');
    };

    if (currentUser) {
        return <App currentUser={currentUser} onLogout={handleLogout} />;
    }

    if (currentPage === 'auth') {
        return <AuthPage onLoginSuccess={handleLoginSuccess} onNavigateToLanding={() => setCurrentPage('landing')} />;
    }
    
    return <LandingPage onNavigateToAuth={navigateToAuth} />;
};

export default Main;
