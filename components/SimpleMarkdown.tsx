
import React from 'react';
import { BriefcaseIcon, ListBulletIcon, ShieldExclamationIcon, LightBulbIcon, GaugeIcon } from './icons/ReportIcons';

const SECTION_ICONS: { [key: string]: React.ElementType } = {
  'Executive Summary': BriefcaseIcon,
  'Key Findings': ListBulletIcon,
  'Identified Risks': ShieldExclamationIcon,
  'Opportunities': LightBulbIcon,
  'Overall Confidence Score': GaugeIcon,
};

const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const parseInline = (text: string): (string | JSX.Element)[] => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.filter(part => part).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-brand-text-primary">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const blocks: (string[] | string)[] = [];
    let currentList: string[] | null = null;
    
    content.split('\n').forEach(line => {
        if (line.trim().startsWith('* ')) {
            if (!currentList) {
                currentList = [];
                blocks.push(currentList);
            }
            currentList.push(line);
        } else {
            currentList = null; 
            blocks.push(line);
        }
    });

    const elements = blocks.map((block, index) => {
        if (Array.isArray(block)) {
            return (
                <ul key={index} className="space-y-1 list-disc pl-5 my-2">
                    {block.map((item, itemIndex) => (
                        <li key={itemIndex}>{parseInline(item.trim().substring(2))}</li>
                    ))}
                </ul>
            );
        }
        
        const line = block as string;
        if (line.startsWith('## ')) {
            const headerText = line.substring(3);
            const Icon = SECTION_ICONS[headerText];
            return (
                <h2 key={index} className="text-2xl font-bold mt-6 mb-3 border-b-2 border-brand-border pb-2 text-brand-accent flex items-center gap-3">
                    {Icon && <Icon className="w-6 h-6" />}
                    <span>{headerText}</span>
                </h2>
            );
        }
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-brand-accent">{line.substring(4)}</h3>;
        }
        if (line.trim() === '') {
            return null;
        }
        return <p key={index} className="mb-2">{parseInline(line)}</p>;
    });

    return <>{elements}</>;
};

export default SimpleMarkdown;
