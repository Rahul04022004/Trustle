
import React, { useState } from 'react';
import { UserIcon, LockIcon, LoginIcon, EnvelopeIcon } from '../components/icons/AuthIcons';

interface AuthPageProps {
    onLoginSuccess: (username: string) => void;
    onNavigateToLanding: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onNavigateToLanding }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAuthAction = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!username || !password) {
            setError("Username and password are required.");
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');

            if (isLoginView) {
                // Handle Login
                if (users[username] && users[username].password === password) {
                    onLoginSuccess(username);
                } else {
                    setError("Invalid username or password.");
                }
            } else {
                // Handle Signup
                 if (!email) {
                    setError("Email is required for signup.");
                    return;
                }
                if (!/^\S+@\S+\.\S+$/.test(email)) {
                    setError("Please enter a valid email address.");
                    return;
                }

                if (users[username]) {
                    setError("Username already exists.");
                } else {
                    const emailExists = Object.values(users).some((user: any) => user.email === email);
                    if (emailExists) {
                        setError("An account with this email already exists.");
                        return;
                    }
                    
                    const newUsers = { ...users, [username]: { password: password, email: email } };
                    localStorage.setItem('users', JSON.stringify(newUsers));
                    setSuccess("Account created successfully! Please log in.");
                    setIsLoginView(true);
                    setUsername('');
                    setPassword('');
                    setEmail('');
                }
            }
        } catch (storageError) {
            console.error("LocalStorage Error:", storageError);
            setError("A local storage error occurred. Please enable cookies/storage and try again.");
        }
    };
    
    return (
        <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center p-4">
             <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-brand-accent/10 rounded-full mb-4">
                       <LoginIcon className="w-8 h-8 text-brand-accent" />
                    </div>
                    <h1 className="text-3xl font-bold text-brand-text-primary">
                        {isLoginView ? 'Welcome Back' : 'Create an Account'}
                    </h1>
                    <p className="text-brand-text-secondary mt-2">
                        {isLoginView ? 'Log in to access your Trustle dashboard.' : 'Sign up to start analyzing.'}
                    </p>
                </div>
            
                <form onSubmit={handleAuthAction} className="bg-brand-surface border border-brand-border p-8 rounded-lg shadow-lg space-y-6">
                    {error && <p className="text-sm text-brand-error bg-brand-error/10 p-3 rounded-md">{error}</p>}
                    {success && <p className="text-sm text-brand-success bg-brand-success/10 p-3 rounded-md">{success}</p>}
                    <div className="relative">
                        <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full bg-brand-bg border border-brand-border text-brand-text-primary rounded-md py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200"
                            required
                        />
                    </div>
                    {!isLoginView && (
                         <div className="relative">
                            <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="w-full bg-brand-bg border border-brand-border text-brand-text-primary rounded-md py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200"
                                required
                            />
                        </div>
                    )}
                    <div className="relative">
                        <LockIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-brand-bg border border-brand-border text-brand-text-primary rounded-md py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-brand-accent text-white font-semibold rounded-md hover:bg-sky-400 disabled:bg-slate-500 transition duration-200"
                    >
                        {isLoginView ? 'Log In' : 'Sign Up'}
                    </button>
                    
                    <p className="text-center text-sm text-brand-text-secondary">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLoginView(!isLoginView);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="font-semibold text-brand-accent hover:underline focus:outline-none"
                        >
                            {isLoginView ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </form>
                <div className="text-center mt-6">
                    <button onClick={onNavigateToLanding} className="text-sm text-brand-text-secondary hover:text-brand-accent transition-colors">
                        &larr; Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;