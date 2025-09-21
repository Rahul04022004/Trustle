import React from 'react';
import { ShieldCheckIcon } from '../components/icons/AgentIcons';

interface LandingPageProps {
    onNavigateToAuth: (initialState: 'login' | 'signup') => void;
}

const BinaryRainBackground: React.FC = () => {
    // Using useCallback to memoize the function for stable dependencies in useEffect
    const createColumnContent = React.useCallback(() => {
        let binaryString = '';
        for (let i = 0; i < 100; i++) { // String length
            binaryString += Math.round(Math.random());
        }
        return binaryString;
    }, []);

    const [columns, setColumns] = React.useState(() =>
        Array.from({ length: 70 }).map(() => ({
            content: createColumnContent(),
            duration: `${Math.random() * 5 + 5}s`,
            delay: `${Math.random() * -15}s`,
            // Generate opacity around the original 0.15 value for depth
            opacity: Math.random() * 0.15 + 0.05, // Varies from 0.05 to 0.20
        }))
    );

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            // Update the content of each column to create a flickering effect
            setColumns(currentColumns =>
                currentColumns.map(col => ({
                    ...col,
                    content: createColumnContent(),
                }))
            );
        }, 120); // Flicker rate in milliseconds

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, [createColumnContent]);


    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-brand-bg" aria-hidden="true">
            <div className="absolute top-0 left-0 right-0 flex justify-around">
                {columns.map((col, i) => (
                    <div
                        key={i}
                        className="text-brand-accent font-mono text-lg select-none"
                        style={{
                            writingMode: 'vertical-rl',
                            textOrientation: 'upright',
                            animationName: 'binary-rain',
                            animationDuration: col.duration,
                            animationTimingFunction: 'linear',
                            animationDelay: col.delay,
                            animationIterationCount: 'infinite',
                            opacity: col.opacity,
                        }}
                    >
                        {col.content}
                    </div>
                ))}
            </div>
        </div>
    );
};


const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
    const features = [
        {
            name: "Deep Content Verification",
            description: "Our multi-agent system performs textual, visual, and emotional analysis to uncover hidden biases and manipulation tactics.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-brand-accent mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 7.5v1.5h1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9h1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5h1.5v1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5h1.5" />
                </svg>
            )
        },
        {
            name: "Clear Intelligence Reports",
            description: "Receive synthesized briefs with at-a-glance risk scores, data visualizations, and evidence-based findings for quick comprehension.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-brand-accent mb-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            )
        },
        {
            name: "AI-Powered Investigation",
            description: "Go beyond the initial report. Ask follow-up questions and use our AI chat to probe deeper into the data and gain more specific insights.",
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-brand-accent mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.05 1.05 0 01-1.485 0l-3.72-3.72A2.1 2.1 0 016.75 15.286V10.608c0-.97.616-1.813 1.5-2.097L12 6.75l4.5 1.5-1.5 1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h1.5v1.5h-1.5V6.75zM12 6.75h1.5v1.5h-1.5V6.75zM15.75 6.75h1.5v1.5h-1.5V6.75z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75h7.5" />
                 </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col items-center justify-center p-4 isolate">
            <BinaryRainBackground />
            
            <div className="w-full max-w-5xl mx-auto text-center">
                <header className="mb-12">
                     <div className="inline-block p-4 bg-brand-accent/10 rounded-full mb-6 shadow-lg shadow-brand-accent/20">
                        <ShieldCheckIcon className="w-12 h-12 text-brand-accent" />
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-brand-accent mb-4">
                        Trustle
                    </h1>
                    <p className="text-2xl font-semibold text-brand-text-secondary tracking-wide">
                        Your Digital Shield Against Misinformation
                    </p>
                    <p className="text-lg text-brand-text-secondary mt-6 max-w-3xl mx-auto">
                        Trustle’s advanced AI agents dissect web content, verify sources, and deliver clear, actionable intelligence, empowering you to make decisions with confidence.
                    </p>
                </header>

                <main>
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {features.map((feature) => (
                            <div key={feature.name} className="bg-brand-surface p-6 rounded-lg border border-brand-border transition-all duration-300 hover:border-brand-accent/70 hover:shadow-2xl hover:shadow-brand-accent/10 hover:-translate-y-1">
                                {feature.icon}
                                <h3 className="text-xl font-semibold text-brand-text-primary mb-2">{feature.name}</h3>
                                <p className="text-sm text-brand-text-secondary">{feature.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => onNavigateToAuth('signup')}
                            className="w-full sm:w-auto px-8 py-3 bg-brand-accent text-white font-semibold rounded-md hover:bg-sky-400 transition-all duration-200 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 transform hover:scale-105"
                        >
                            Get Started Free
                        </button>
                        <button 
                            onClick={() => onNavigateToAuth('login')}
                            className="w-full sm:w-auto px-8 py-3 bg-brand-surface text-brand-text-primary font-semibold rounded-md hover:bg-brand-border border border-brand-border transition duration-200"
                        >
                            Log In
                        </button>
                    </div>
                </main>
                
                <footer className="mt-20 text-sm text-brand-text-secondary">
                    <p>&copy; {new Date().getFullYear()} Trustle. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;