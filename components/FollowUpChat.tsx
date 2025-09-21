import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SparklesIcon } from './icons/AgentIcons';
import { UserIcon, SendIcon } from './icons/ChatIcons';
import SimpleMarkdown from './SimpleMarkdown';

interface FollowUpChatProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const FollowUpChat: React.FC<FollowUpChatProps> = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const textareaRef = useRef<null | HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const TypingIndicator = () => (
        <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce"></span>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto my-8 bg-brand-surface border border-brand-border rounded-lg shadow-2xl flex flex-col">
            <div className="p-4 border-b border-brand-border">
                <h3 className="text-xl font-bold text-brand-text-primary">Ask a Follow-up</h3>
                <p className="text-sm text-brand-text-secondary">Ask questions about the generated brief.</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto max-h-[50vh]">
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                                    <SparklesIcon className="w-5 h-5 text-brand-accent" />
                                </div>
                            )}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-sky-800 text-white' : 'bg-brand-bg'}`}>
                                <div className="text-sm text-brand-text-secondary leading-relaxed">
                                   <SimpleMarkdown content={msg.content} />
                                </div>
                            </div>
                             {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center shrink-0">
                                    <UserIcon className="w-5 h-5 text-brand-text-secondary" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && messages[messages.length -1]?.role === 'user' && (
                         <div className="flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                                <SparklesIcon className="w-5 h-5 text-brand-accent" />
                            </div>
                             <div className="max-w-xl p-3 rounded-lg bg-brand-bg">
                                <TypingIndicator />
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-brand-border bg-brand-surface/50">
                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Ask about key entities, sentiment, or source validity..."
                        className="flex-1 bg-brand-bg border border-brand-border rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200 max-h-32"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-10 w-10 flex items-center justify-center bg-brand-accent text-white font-semibold rounded-lg hover:bg-sky-400 disabled:bg-slate-500 disabled:cursor-not-allowed transition duration-200 shrink-0"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FollowUpChat;
