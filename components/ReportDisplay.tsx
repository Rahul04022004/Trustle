
import React, { useRef, useState, useMemo } from 'react';
import { DownloadIcon, ShareIcon } from './icons/AgentIcons';
import { AnalysisResults, EmotionAnalysisOutput } from '../types';
import SimpleMarkdown from './SimpleMarkdown';

// TypeScript declarations for global libraries loaded via CDN
declare const jspdf: any;
declare const html2canvas: any;

interface ReportDisplayProps {
  report: string | null;
  url: string;
  analysisResults: AnalysisResults;
}

const FaceSmileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4.06 4.06 0 01-5.656 0M9 10.5h.01M15 10.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const FaceFrownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012 15a4.486 4.486 0 00-3.182 1.318M9 10.5h.01M15 10.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SentimentIndicator: React.FC<{ sentiment: 'Positive' | 'Negative' | 'Neutral' }> = ({ sentiment }) => {
  const sentimentConfig = {
    Positive: {
      Icon: FaceSmileIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-900/50',
    },
    Negative: {
      Icon: FaceFrownIcon,
      color: 'text-red-400',
      bgColor: 'bg-red-900/50',
    },
    Neutral: {
      Icon: MinusIcon,
      color: 'text-slate-400',
      bgColor: 'bg-slate-700/50',
    }
  };
  const { Icon, color, bgColor } = sentimentConfig[sentiment];

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-lg w-full max-w-xs mx-auto ${bgColor}`}>
      <Icon className={`w-16 h-16 ${color}`} />
      <div className={`mt-2 text-2xl font-bold ${color}`}>
        {sentiment}
      </div>
    </div>
  );
};

const TagCloud: React.FC<{ title: string, tags: string[] }> = ({ title, tags }) => (
  <div>
    <h4 className="text-lg font-bold text-brand-text-primary mb-3 text-center">{title}</h4>
    <div className="flex flex-wrap justify-center gap-2">
      {tags.map((tag, index) => (
        <span key={index} className="bg-sky-800 text-sky-200 text-sm font-medium px-3 py-1 rounded-full">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const TrustBadge: React.FC<{ score: number; explanation: string }> = ({ score, explanation }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor = score >= 80 ? 'text-brand-success' : score >= 50 ? 'text-brand-warning' : 'text-brand-error';
  const strokeColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center justify-center p-4 group">
      <svg className="w-48 h-auto" viewBox="0 0 120 120">
        <circle className="text-brand-border" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
        <circle
          strokeWidth="12"
          stroke={strokeColor}
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" className={`text-3xl font-bold fill-current ${scoreColor}`}>
          {Math.round(score)}
        </text>
      </svg>
      <div className={`mt-2 text-2xl font-bold ${scoreColor}`}>
        Trust Score
      </div>
      <div className="absolute bottom-full mb-2 w-72 p-3 bg-brand-bg text-brand-text-secondary text-sm rounded-lg border border-brand-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10 text-left">
        <p className="font-bold text-brand-text-primary mb-1">Justification:</p>
        <p>{explanation}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-brand-border"></div>
      </div>
    </div>
  );
};

const RiskMeter: React.FC<{ score: number; breakdown: string[] }> = ({ score, breakdown }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const scoreColor = score >= 70 ? 'text-brand-error' : score >= 40 ? 'text-brand-warning' : 'text-brand-success';
    const strokeColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    const riskLabel = score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk';

    return (
        <div className="relative flex flex-col items-center justify-center p-4 group">
            <svg className="w-48 h-auto" viewBox="0 0 120 120">
                <circle className="text-brand-border" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                <circle
                    strokeWidth="12"
                    stroke={strokeColor}
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" className={`text-3xl font-bold fill-current ${scoreColor}`}>
                    {Math.round(score)}
                </text>
            </svg>
            <div className={`mt-2 text-2xl font-bold ${scoreColor}`}>
                {riskLabel}
            </div>
            <div className="absolute bottom-full mb-2 w-72 p-3 bg-brand-bg text-brand-text-secondary text-sm rounded-lg border border-brand-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10 text-left">
                <p className="font-bold text-brand-text-primary mb-2">Risk Factors:</p>
                <ul className="list-disc list-inside space-y-1">
                    {breakdown.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-brand-border"></div>
            </div>
        </div>
    );
};

const EmotionMeter: React.FC<{ analysis: EmotionAnalysisOutput }> = ({ analysis }) => {
  const { manipulation_level, dominant_emotion } = analysis;

  if (manipulation_level === 'Low') {
    return (
        <div className="p-4 rounded-lg bg-brand-bg border border-brand-border text-center">
            <p className="text-brand-text-secondary">
                <span className="font-semibold text-brand-text-primary">Emotion Analysis:</span> Low emotional content detected. Dominant emotion: {dominant_emotion}.
            </p>
        </div>
    );
  }

  const levelConfig = {
      High: {
          borderColor: 'border-brand-error',
          bgColor: 'bg-brand-error/10',
          textColor: 'text-brand-error',
          textColorMuted: 'text-brand-error/80',
      },
      Medium: {
          borderColor: 'border-brand-warning',
          bgColor: 'bg-brand-warning/10',
          textColor: 'text-brand-warning',
          textColorMuted: 'text-brand-warning/80',
      }
  };
  const config = levelConfig[manipulation_level];

  return (
    <div className={`p-4 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor}`}>
        <div className="flex">
            <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${config.textColor}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3">
                <h3 className={`text-md font-medium ${config.textColor}`}>
                    Warning: Emotional manipulation detected.
                </h3>
                <div className={`mt-2 text-sm ${config.textColorMuted}`}>
                    <p>This content appears designed to provoke a strong emotional reaction ({manipulation_level} level, dominant emotion: {dominant_emotion}). Check facts before sharing.</p>
                </div>
            </div>
        </div>
    </div>
  );
};


const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, url, analysisResults }) => {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [sharingStatus, setSharingStatus] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');
  
  const Recharts = (window as any).Recharts;
  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } = Recharts || {};
  
  const calculateRiskScore = (results: AnalysisResults): { score: number; breakdown: string[] } => {
    if (!results.source && !results.emotion && !results.visual && !results.textual) {
        return { score: 0, breakdown: ["Not enough data for risk assessment."] };
    }

    let score = 0;
    const breakdown: string[] = [];
    let weightsApplied = 0;

    if (results.source?.trust_score !== undefined) {
        const trustScore = results.source.trust_score;
        const riskFromSource = (100 - trustScore);
        score += riskFromSource * 0.6;
        weightsApplied += 0.6;
        if (riskFromSource > 60) breakdown.push("Source credibility is low.");
        else if (riskFromSource > 20) breakdown.push("Source credibility is moderate.");
        else breakdown.push("Source credibility is high.");
    }

    if (results.emotion?.manipulation_level) {
        const level = results.emotion.manipulation_level;
        let riskFromEmotion = 0;
        if (level === 'High') riskFromEmotion = 100;
        if (level === 'Medium') riskFromEmotion = 60;
        score += riskFromEmotion * 0.2;
        weightsApplied += 0.2;
        if (level !== 'Low') breakdown.push(`Detected ${level.toLowerCase()} emotional manipulation.`);
    }

    if (results.visual?.visual_insights[0]?.manipulation_flag) {
        const flag = results.visual.visual_insights[0].manipulation_flag;
        let riskFromVisual = 0;
        if (flag === 'High') riskFromVisual = 100;
        if (flag === 'Medium') riskFromVisual = 60;
        score += riskFromVisual * 0.2;
        weightsApplied += 0.2;
        if (flag !== 'Low') breakdown.push(`Image manipulation risk is ${flag.toLowerCase()}.`);
    }

    if (weightsApplied > 0 && weightsApplied < 1) {
        score = score / weightsApplied;
    }
    
    if (results.textual?.sentiment === 'Negative') {
        score = Math.min(100, score + 10);
        if (breakdown.length > 0) {
             breakdown.push("Content has a negative sentiment.");
        }
    }
    
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    
    if (breakdown.length === 0) {
        breakdown.push("No significant risk factors detected.");
    }

    return { score: finalScore, breakdown };
  };
  
  const riskData = useMemo(() => calculateRiskScore(analysisResults), [analysisResults]);

  const evidenceData = useMemo(() => {
    const evidence = analysisResults?.source?.evidence;
    if (!evidence || evidence.length === 0) return null;

    const counts = evidence.reduce((acc, item) => {
      acc[item.finding] = (acc[item.finding] || 0) + 1;
      return acc;
    }, {} as Record<'Positive' | 'Negative' | 'Neutral', number>);

    return [
      { name: 'Positive', count: counts.Positive || 0, fill: '#22c55e' },
      { name: 'Negative', count: counts.Negative || 0, fill: '#ef4444' },
      { name: 'Neutral', count: counts.Neutral || 0, fill: '#94a3b8' },
    ].filter(item => item.count > 0);
  }, [analysisResults]);

  const textualData = analysisResults?.textual;
  const emotionData = analysisResults?.emotion;
  const hasTextualVisualizations = textualData && (textualData.sentiment || (textualData.entities && textualData.entities.length > 0) || (textualData.keywords && textualData.keywords.length > 0));
  const sourceData = analysisResults?.source;

  const hasVisualizations = (evidenceData || sourceData?.trust_score !== undefined || riskData.score > 0 || hasTextualVisualizations || emotionData) && Recharts;

  const handleShare = async () => {
    if (!reportContentRef.current) return;
    setSharingStatus('sharing');
    try {
        const canvas = await html2canvas(reportContentRef.current, {
            backgroundColor: '#101729', // Match app background
            scale: 2, // Increase resolution
        });
        
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            throw new Error('Could not create blob from canvas');
        }
        
        const file = new File([blob], 'intelligence-brief.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Trustle Intelligence Brief',
                text: `Analysis of: ${url}`,
                files: [file],
            });
            setSharingStatus('shared');
        } else {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
            ]);
            setSharingStatus('shared');
        }
    } catch (error) {
        console.error('Sharing failed:', error);
        setSharingStatus('error');
    } finally {
        setTimeout(() => setSharingStatus('idle'), 3000); // Reset after 3 seconds
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;

    setIsGeneratingPdf(true);
    try {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

        const page = {
            width: doc.internal.pageSize.getWidth(),
            height: doc.internal.pageSize.getHeight(),
            margin: 40
        };
        const contentWidth = page.width - page.margin * 2;
        let cursorY = page.margin;

        const checkPageBreak = (neededHeight: number) => {
            if (cursorY + neededHeight > page.height - page.margin) {
                doc.addPage();
                cursorY = page.margin;
            }
        };

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor('#101729');
        doc.text('Actionable Intelligence Brief', page.margin, cursorY);
        cursorY += 30;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor('#64748b');
        const urlLines = doc.splitTextToSize(`Source URL: ${url}`, contentWidth);
        doc.text(urlLines, page.margin, cursorY);
        cursorY += (urlLines.length * 10) + 10;
        doc.setDrawColor('#cbd5e1');
        doc.line(page.margin, cursorY, page.width - page.margin, cursorY);
        cursorY += 20;

        const lines = report.split('\n');
        for (const line of lines) {
            if (line.trim() === '') {
                cursorY += 10;
                continue;
            }

            if (line.startsWith('## ')) {
                const text = line.substring(3);
                checkPageBreak(35);
                doc.line(page.margin, cursorY, page.width - page.margin, cursorY);
                cursorY += 10;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor('#1e3a8a');
                doc.text(text, page.margin, cursorY);
                cursorY += 22;
            } else if (line.startsWith('### ')) {
                const text = line.substring(4);
                checkPageBreak(20);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor('#1e293b');
                doc.text(text, page.margin, cursorY);
                cursorY += 18;
            } else if (line.startsWith('* ')) {
                const text = line.substring(2).replace(/\*\*(.*?)\*\*/g, '$1'); 
                const itemLines = doc.splitTextToSize(text, contentWidth - 15);
                checkPageBreak(itemLines.length * 12 + 4);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor('#334155');
                doc.text('•', page.margin, cursorY, { baseline: 'top' });
                doc.text(itemLines, page.margin + 15, cursorY, { baseline: 'top' });
                cursorY += (itemLines.length * 12) + 4;
            } else if (line.match(/^\*\*(.*?):\*\* (.*)/)) {
                 const match = line.match(/^\*\*(.*?):\*\* (.*)/);
                if (match) {
                    const label = `${match[1]}:`;
                    const value = match[2];
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    const labelWidth = doc.getTextWidth(label) + 2;

                    const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth);
                    checkPageBreak(valueLines.length * 12 + 4);

                    doc.setTextColor('#334155');
                    doc.text(label, page.margin, cursorY, { baseline: 'top' });

                    doc.setFont('helvetica', 'normal');
                    doc.text(valueLines, page.margin + labelWidth, cursorY, { baseline: 'top' });

                    cursorY += (valueLines.length * 12) + 4;
                }
            } else {
                const textLines = doc.splitTextToSize(line, contentWidth);
                checkPageBreak(textLines.length * 12 + 4);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor('#334155');
                doc.text(textLines, page.margin, cursorY, { baseline: 'top' });
                cursorY += (textLines.length * 12) + 4;
            }
        }
        
        const safeFilename = (url.split('//').pop() || 'report').split('/')[0].replace(/[^a-z0-9]/gi, '_');
        doc.save(`Intelligence_Brief_${safeFilename}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Check the console for more details.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  if (!report) {
    return null;
  }

  const getShareButtonContent = () => {
    switch(sharingStatus) {
        case 'sharing':
            return (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sharing...</span>
                </>
            );
        case 'shared':
            return <span>Copied!</span>;
        case 'error':
            return <span>Error!</span>;
        case 'idle':
        default:
            return (
                <>
                    <ShareIcon className="w-5 h-5" />
                    <span>Share</span>
                </>
            );
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-8">
        <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-sky-900 to-brand-surface border-b-2 border-brand-accent flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Actionable Intelligence Brief
                    </h2>
                    <p className="text-sky-300 mt-1">Synthesized report from multi-agent analysis.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShare}
                        disabled={sharingStatus !== 'idle'}
                        className="bg-brand-accent/80 text-white font-semibold rounded-md hover:bg-sky-500 disabled:bg-slate-500 disabled:cursor-wait transition-all duration-200 flex items-center justify-center gap-2 px-4 py-2 w-[120px]"
                        title="Share as Image"
                    >
                        {getShareButtonContent()}
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="bg-brand-accent text-white font-semibold rounded-md hover:bg-sky-400 disabled:bg-slate-500 disabled:cursor-wait transition duration-200 flex items-center justify-center gap-2 px-4 py-2"
                        title="Download as PDF"
                    >
                        {isGeneratingPdf ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <DownloadIcon className="w-5 h-5" />
                                <span>PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
          <div ref={reportContentRef}>
             {hasVisualizations && (
                <div className="p-6 md:p-8 border-b border-brand-border bg-brand-surface/70 space-y-8">
                   {(riskData || sourceData?.trust_score !== undefined || evidenceData) && (
                    <div>
                      <h3 className="text-xl font-bold text-brand-text-primary mb-4 text-center">Risk & Source Analysis</h3>
                      <div className="grid gap-8 items-center md:grid-cols-2">
                         <div className="flex justify-center">
                            <RiskMeter score={riskData.score} breakdown={riskData.breakdown} />
                         </div>
                         {sourceData?.trust_score !== undefined && sourceData?.source_validity_explanation ? (
                          <div className="flex justify-center">
                             <TrustBadge score={sourceData.trust_score} explanation={sourceData.source_validity_explanation} />
                          </div>
                         ) : evidenceData ? (
                           <div className="w-full h-[250px]"><h4 className="text-lg font-bold text-brand-text-primary mb-3 text-center">No Trust Score Available</h4></div>
                         ) : null}
                      </div>
                      {evidenceData && (
                          <div className="mt-8">
                             <h4 className="text-lg font-bold text-brand-text-primary mb-3 text-center">Source Evidence Breakdown</h4>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <BarChart data={evidenceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a344f" />
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis allowDecimals={false} stroke="#94a3b8" />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                            contentStyle={{ backgroundColor: '#101729', borderColor: '#2a344f', color: '#f0f4fa' }}
                                        />
                                        <Bar dataKey="count" name="Evidence Count">
                                            {evidenceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
    
                  {(hasTextualVisualizations || emotionData) && (
                    <div>
                      <h3 className="text-xl font-bold text-brand-text-primary mb-4 text-center border-t border-brand-border pt-8">Textual Insights</h3>
                       
                       {emotionData && (
                        <div className="mb-8 max-w-2xl mx-auto">
                          <EmotionMeter analysis={emotionData} />
                        </div>
                      )}
    
                       {hasTextualVisualizations && (
                        <div className={`grid gap-8 items-start ${textualData.sentiment && (textualData.entities?.length || textualData.keywords?.length) ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                            {textualData.sentiment && (
                                <div className="flex flex-col items-center">
                                    <h4 className="text-lg font-bold text-brand-text-primary mb-3 text-center">Overall Sentiment</h4>
                                    <SentimentIndicator sentiment={textualData.sentiment} />
                                </div>
                            )}
                            
                            {(textualData.entities?.length > 0 || textualData.keywords?.length > 0) && (
                                <div className="space-y-6">
                                    {textualData.entities && textualData.entities.length > 0 && (
                                        <TagCloud title="Key Entities" tags={textualData.entities} />
                                    )}
                                    {textualData.keywords && textualData.keywords.length > 0 && (
                                        <TagCloud title="Top Keywords" tags={textualData.keywords} />
                                    )}
                                </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
            )}
            
            <div className="p-6 md:p-8 text-brand-text-secondary leading-relaxed bg-brand-surface">
                <SimpleMarkdown content={report} />
            </div>
          </div>
        </div>
    </div>
  );
};

export default ReportDisplay;