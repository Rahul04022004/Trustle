
import React from 'react';
import { HistoryItem } from '../types';
import { ClockIcon, TrashIcon, PlusIcon, LogoutIcon, ScaleIcon } from './icons/HistoryIcons';
import { UserIcon } from './icons/ChatIcons';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelectItem: (id: string) => void;
  onClearHistory: () => void;
  onNewAnalysis: () => void;
  activeItemId: string | null;
  currentUser: string;
  onLogout: () => void;
  isCompareMode: boolean;
  onToggleCompareMode: () => void;
  selectedIds: string[];
  onSelectItemForCompare: (id: string) => void;
  onRunComparison: () => void;
  isComparing: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
    history, onSelectItem, onClearHistory, onNewAnalysis, activeItemId, currentUser, onLogout,
    isCompareMode, onToggleCompareMode, selectedIds, onSelectItemForCompare, onRunComparison, isComparing
 }) => {
  return (
    <aside className="w-full md:w-80 bg-brand-surface h-auto md:h-screen flex flex-col border-b md:border-b-0 md:border-r border-brand-border p-4 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-text-primary flex items-center gap-2">
          <ClockIcon className="w-6 h-6" />
          Analysis History
        </h2>
        <div className="flex items-center gap-2">
            <button
                onClick={onToggleCompareMode}
                className={`p-1 transition-colors ${isCompareMode ? 'text-brand-accent bg-brand-accent/10 rounded' : 'text-brand-text-secondary hover:text-brand-accent'}`}
                title={isCompareMode ? "Cancel Comparison" : "Compare Analyses"}
                aria-label={isCompareMode ? "Cancel comparison mode" : "Enter comparison mode"}
            >
                <ScaleIcon className="w-6 h-6" />
            </button>
            <button
                onClick={onNewAnalysis}
                className="p-1 text-brand-text-secondary hover:text-brand-accent transition-colors"
                title="New Analysis"
                aria-label="Start a new analysis"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
            {history.length > 0 && (
            <button
                onClick={onClearHistory}
                className="p-1 text-brand-text-secondary hover:text-brand-error transition-colors"
                title="Clear History"
                aria-label="Clear analysis history"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {history.length === 0 ? (
          <div className="text-center text-brand-text-secondary pt-10 px-4">
            <p>No history yet.</p>
            <p className="text-sm">Run an analysis to begin.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((item) => {
              const isActive = !isCompareMode && activeItemId === item.id;
              const isSelected = isCompareMode && selectedIds.includes(item.id);

              return (
                <li key={item.id}>
                  <button
                    onClick={() => isCompareMode ? onSelectItemForCompare(item.id) : onSelectItem(item.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors relative flex items-center gap-3 ${
                      isActive ? 'bg-brand-accent/10' : ''
                    } ${
                        isSelected ? 'bg-brand-accent/20 border border-brand-accent' : 'hover:bg-brand-border'
                    }`}
                  >
                     {isCompareMode && (
                        <div className={`w-5 h-5 flex-shrink-0 rounded border-2 ${isSelected ? 'bg-brand-accent border-brand-accent' : 'border-brand-text-secondary'} flex items-center justify-center`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                    )}
                    {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-accent rounded-full"></div>}
                    <div className="flex-1 overflow-hidden">
                      <p className={`font-semibold text-sm truncate ${
                          isActive || isSelected ? 'text-brand-accent' : 'text-brand-text-primary'
                      }`}>{item.url}</p>
                      <p className="text-xs text-brand-text-secondary mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {isCompareMode && (
        <div className="mt-4 pt-4 border-t border-brand-border">
            <button
                onClick={onRunComparison}
                disabled={selectedIds.length < 2 || isComparing}
                className="w-full px-4 py-2 bg-brand-accent text-white font-semibold rounded-md hover:bg-sky-400 disabled:bg-slate-500 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
            >
                {isComparing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Comparing...</span>
                    </>
                ) : (
                    <>
                        <ScaleIcon className="w-5 h-5" />
                        <span>Compare Selected ({selectedIds.length})</span>
                    </>
                )}
            </button>
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-brand-text-secondary" />
                </div>
                <span className="text-sm font-medium text-brand-text-primary">{currentUser}</span>
            </div>
            <button
                onClick={onLogout}
                className="p-2 text-brand-text-secondary hover:text-brand-error transition-colors"
                title="Logout"
                aria-label="Logout"
            >
                <LogoutIcon className="w-5 h-5" />
            </button>
        </div>
    </aside>
  );
};

export default HistorySidebar;
