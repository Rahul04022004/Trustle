
import React, { useState, useEffect } from 'react';
import { AgentName, AgentStatus, PipelineState } from '../types';
import { AGENT_NAMES } from '../constants';
import { AGENT_ICONS } from './icons/AgentIcons';

interface AgentPipelineProps {
  pipelineState: PipelineState;
}

const StatusIndicator: React.FC<{ status: AgentStatus }> = ({ status }) => {
  switch (status) {
    case AgentStatus.RUNNING:
      return (
        // Fix: The 'title' prop is not a valid SVG attribute in React's TypeScript definitions. Replaced with the standard <title> element for accessibility.
        <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <title>Running</title>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    case AgentStatus.COMPLETED:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-success" viewBox="0 0 20 20" fill="currentColor">
          <title>Completed</title>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case AgentStatus.SKIPPED:
      // Fix: The 'title' prop is not a valid SVG attribute in React's TypeScript definitions. Replaced with the standard <title> element for accessibility.
      return (
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-brand-text-secondary">
            <title>Skipped</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      );
    case AgentStatus.ERROR:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-error" viewBox="0 0 20 20" fill="currentColor">
          <title>Error</title>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case AgentStatus.PENDING:
    default:
      return (
        <svg className="w-5 h-5 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Pending</title>
            <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

const RunningDetails: React.FC<{ text?: string }> = ({ text = "Processing" }) => {
    const baseText = text.replace(/\.+$/, '');
    const [dots, setDots] = useState('.');

    useEffect(() => {
        const timer = setInterval(() => {
            setDots(prevDots => (prevDots.length < 3 ? prevDots + '.' : '.'));
        }, 350);

        return () => clearInterval(timer);
    }, []);

    return <>{baseText}{dots}</>;
};


const AgentCard: React.FC<{ name: AgentName; status: AgentStatus; details?: string }> = ({ name, status, details }) => {
  const Icon = AGENT_ICONS[name];
  const statusClasses = {
    [AgentStatus.PENDING]: 'border-brand-border text-brand-text-secondary',
    [AgentStatus.RUNNING]: 'border-brand-accent text-brand-accent animate-pulse-fast shadow-lg shadow-brand-accent/20',
    [AgentStatus.COMPLETED]: 'border-brand-success text-brand-success',
    [AgentStatus.SKIPPED]: 'border-gray-500 text-gray-500',
    [AgentStatus.ERROR]: 'border-brand-error text-brand-error',
  };

  return (
    <div className={`flex-1 min-w-[180px] bg-brand-surface p-4 rounded-lg border-2 ${statusClasses[status]} transition-all duration-300 shadow-md`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wider">{name}</h3>
        <StatusIndicator status={status} />
      </div>
      <div className="flex items-start gap-3 mt-3">
        <Icon className="w-8 h-8 shrink-0"/>
        <p className="text-xs text-brand-text-secondary break-words h-10">
          {status === AgentStatus.RUNNING 
            ? <RunningDetails text={details} /> 
            : details || <span className="capitalize italic">{status}</span>}
        </p>
      </div>
    </div>
  );
};


const AgentPipeline: React.FC<AgentPipelineProps> = ({ pipelineState }) => {
  return (
    <div className="w-full max-w-5xl mx-auto my-8">
      <h2 className="text-center text-xl font-bold text-brand-text-primary mb-2">INTELLIGENCE PIPELINE</h2>
      <p className="text-center text-brand-text-secondary mb-6">Following agentic workflow to generate brief...</p>
      <div className="flex flex-wrap items-stretch justify-center gap-x-4 gap-y-4">
        {AGENT_NAMES.map((name, index) => (
            <div key={name} className="flex items-center">
                <AgentCard
                    name={name}
                    status={pipelineState[name].status}
                    details={pipelineState[name].details}
                />
                 {index < AGENT_NAMES.length - 1 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand-border mx-2 hidden lg:block">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};

export default AgentPipeline;