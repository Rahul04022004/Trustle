
import React, { useState, useCallback, useEffect } from 'react';
import URLInput from './components/URLInput';
import AgentPipeline from './components/AgentPipeline';
import ReportDisplay from './components/ReportDisplay';
import HistorySidebar from './components/HistorySidebar';
import FollowUpChat from './components/FollowUpChat';
import ComparisonReportDisplay from './components/ComparisonReportDisplay';
import { AgentName, AgentStatus, PipelineState, AnalysisResults, IngestionOutput, HistoryItem, TextualAnalysisOutput, VisualAnalysisOutput, ChatMessage, EmotionAnalysisOutput, MisinformationRecord } from './types';
import { INITIAL_PIPELINE_STATE } from './constants';
import { performTextualAnalysis, performEmotionAnalysis, performVisualAnalysis, generateFinalBrief, performSourceIntelligence, ai, startFollowUpChat, Chat, generateComparisonBrief } from './services/geminiService';
import { addMisinformationRecord, getMisinformationRecordByDomain, openDB } from './services/db';
import { getFriendlyErrorMessage } from './utils';
import { XMarkIcon, ShieldCheckIcon } from './components/icons/AgentIcons';

interface AppProps {
  currentUser: string;
  onLogout: () => void;
}

const extractFramesFromVideo = (videoFile: File, frameCount: number = 5): Promise<Array<{ data: string; mimeType: string; }>> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: Array<{ data: string; mimeType: string; }> = [];
        
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            if (duration === Infinity) { // Handle streams
              reject("Cannot extract frames from a live stream.");
              return;
            }
            const interval = duration > 0 ? duration / frameCount : 0;

            let capturedFrames = 0;

            const captureFrame = (time: number) => {
                video.currentTime = time;
            };

            video.onseeked = () => {
                if (context && capturedFrames < frameCount) {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    const [, data] = dataUrl.split(',');
                    frames.push({ data, mimeType: 'image/jpeg' });
                    capturedFrames++;
                    
                    if (capturedFrames >= frameCount) {
                        URL.revokeObjectURL(video.src);
                        resolve(frames);
                    } else {
                        captureFrame(capturedFrames * interval);
                    }
                }
            };
            
            // Start capturing the first frame
            captureFrame(0);
        };
        
        video.onerror = (e) => {
            reject("Error loading video file for frame extraction.");
            URL.revokeObjectURL(video.src);
        };
        
        const videoUrl = URL.createObjectURL(videoFile);
        video.src = videoUrl;
        video.load();
    });
};


const App: React.FC<AppProps> = ({ currentUser, onLogout }) => {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pipelineState, setPipelineState] = useState<PipelineState>(INITIAL_PIPELINE_STATE);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);

  // State for Misinformation Memory
  const [misinformationWarning, setMisinformationWarning] = useState<MisinformationRecord | null>(null);

  // State for Follow-up Chat
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  // State for Comparative Analysis
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonReport, setComparisonReport] = useState<string | null>(null);
  const [showComparisonView, setShowComparisonView] = useState(false);
  
  const historyKey = `agentic-intelligence-history-${currentUser}`;


  useEffect(() => {
    openDB().catch(err => console.error("Failed to initialize DB:", err));
    try {
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    } catch (error) {
        console.error("Failed to load history from localStorage", error);
    }
  }, [historyKey]);

  const resetAnalysisState = () => {
    setUrl('');
    setIsLoading(false);
    setPipelineState(INITIAL_PIPELINE_STATE);
    setAnalysisResults({});
    setFinalReport(null);
    setError(null);
    setActiveAnalysisId(null);
    setChatSession(null);
    setChatMessages([]);
    setIsChatLoading(false);
    setIsCompareMode(false);
    setSelectedHistoryIds([]);
    setIsComparing(false);
    setComparisonReport(null);
    setShowComparisonView(false);
  };

  const handleNewAnalysis = () => {
    resetAnalysisState();
    setMisinformationWarning(null);
  };

  const handleSelectHistory = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
        setIsLoading(false);
        setError(null);
        setUrl(item.url);
        setFinalReport(item.report);
        setPipelineState(item.pipelineState);
        setAnalysisResults(item.analysisResults || {});
        setActiveAnalysisId(item.id);
        
        // Re-initialize chat for the selected report
        setChatMessages([]);
        if (item.report) {
            const session = startFollowUpChat(item.report);
            setChatSession(session);
            setChatMessages([{ role: 'model', content: "This is a past report. Feel free to ask me any questions about it." }]);
        } else {
            setChatSession(null);
        }

        setIsCompareMode(false);
        setSelectedHistoryIds([]);
        setShowComparisonView(false);
        setMisinformationWarning(null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all analysis history? This action cannot be undone.")) {
        setHistory([]);
        try {
            localStorage.removeItem(historyKey);
        } catch (error) {
            console.error("Failed to clear history from localStorage", error);
        }
        resetAnalysisState();
    }
  };

  const handleToggleCompareMode = () => {
    setIsCompareMode(!isCompareMode);
    setSelectedHistoryIds([]);
  };

  const handleSelectItemForCompare = (id: string) => {
    setSelectedHistoryIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async () => {
    if (selectedHistoryIds.length < 2) return;
    
    setIsComparing(true);
    setComparisonReport('');
    setError(null);

    const reportsToCompare = history.filter(item => selectedHistoryIds.includes(item.id));
    
    try {
      const briefStream = generateComparisonBrief(reportsToCompare);
      let fullBrief = '';
      for await (const chunk of briefStream) {
        fullBrief += chunk;
        setComparisonReport(prev => (prev ?? '') + chunk);
      }
      
      setShowComparisonView(true);
      setIsCompareMode(false);
      
    } catch (err) {
      console.error("Comparison Error:", err);
      const friendlyMessage = getFriendlyErrorMessage(err);
      setError(`Comparison failed: ${friendlyMessage}`);
      setIsCompareMode(false);
      setSelectedHistoryIds([]);
    } finally {
      setIsComparing(false);
    }
  };
  
  const handleExitComparisonView = () => {
      setShowComparisonView(false);
      setComparisonReport(null);
      setSelectedHistoryIds([]);
      handleNewAnalysis();
  };


  const handleRunPipeline = useCallback(async ({ url: submittedUrl, imageFile, videoFile, textInput }: { url: string; imageFile: File | null; videoFile: File | null; textInput: string; }) => {
    if (!submittedUrl && !imageFile && !videoFile && !textInput) return;
    
    setMisinformationWarning(null);
    if (submittedUrl) {
      try {
        const urlDomain = new URL(submittedUrl).hostname;
        const record = await getMisinformationRecordByDomain(urlDomain);
        if (record) {
          setMisinformationWarning(record);
        }
      } catch (e) {
        console.error("Could not check misinformation log:", e);
      }
    }
    
    resetAnalysisState();
    setUrl(submittedUrl || (textInput ? "Direct Text Input" : (imageFile ? imageFile.name : videoFile!.name)));
    setIsLoading(true);

    let currentPipelineState = { ...INITIAL_PIPELINE_STATE };
    const updateAndTrackStatus = (agent: AgentName, status: AgentStatus, details?: string) => {
        currentPipelineState = { ...currentPipelineState, [agent]: { status, details } };
        setPipelineState(currentPipelineState);
    };
    
    let currentAnalysisResults: AnalysisResults = {};

    try {
      let imageData: { data: string; mimeType: string; } | null = null;
      if (imageFile) {
        try {
          const base64String = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
          const [meta, data] = base64String.split(',');
          imageData = { data, mimeType: meta.split(';')[0].split(':')[1] };
        } catch (e) {
          throw new Error("Failed to read image file.");
        }
      }

      // 1. Content Ingestion
      if (submittedUrl) {
        updateAndTrackStatus(AgentName.CONTENT_INGESTION, AgentStatus.RUNNING, "Ingesting content from URL...");
        const ingestionPrompt = `
            You are a Content Ingestion Agent. Your task is to act as a web scraper.
            Access the content of the following URL and extract the main article text.
            
            URL: ${submittedUrl}

            Your response must be a single JSON object inside a markdown code block, like this:
            \`\`\`json
            {
              "text": "The full extracted text of the article goes here..."
            }
            \`\`\`
            If you cannot access the URL or find any main content, return an empty string for the "text" value.
        `;
        const ingestionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: ingestionPrompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        let jsonString = ingestionResponse.text;
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);

        if (match && match[1]) {
            jsonString = match[1];
        } else {
            const jsonStart = jsonString.indexOf('{');
            const jsonEnd = jsonString.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
            }
        }
        
        let ingestionJson;
        try {
          ingestionJson = JSON.parse(jsonString);
        } catch(e) {
            console.error("Failed to parse ingestion JSON, using fallback:", jsonString);
            ingestionJson = { text: jsonString };
        }

        const extractedText = ingestionJson.text?.trim() || '';
        const domain = new URL(submittedUrl).hostname;
        const ingestionResult: IngestionOutput = {
            text: extractedText,
            images: [], 
            domain,
        };
        currentAnalysisResults.ingestion = ingestionResult;
        setAnalysisResults(currentAnalysisResults);
        if (extractedText) {
          updateAndTrackStatus(AgentName.CONTENT_INGESTION, AgentStatus.COMPLETED, "Text extracted");
        } else {
          updateAndTrackStatus(AgentName.CONTENT_INGESTION, AgentStatus.COMPLETED, "No main text found");
        }
      } else if (textInput) {
        updateAndTrackStatus(AgentName.CONTENT_INGESTION, AgentStatus.RUNNING, "Processing direct text...");
        const ingestionResult: IngestionOutput = {
            text: textInput,
            images: [],
            domain: '', // No domain for direct text
        };
        currentAnalysisResults.ingestion = ingestionResult;
        setAnalysisResults(currentAnalysisResults);
        updateAndTrackStatus(AgentName.CONTENT_INGESTION, AgentStatus.COMPLETED, "Text processed");
      } else {
         updateAndTrackStatus(AgentName.CONTENT_INGESTION, AgentStatus.SKIPPED, "No URL or text provided");
      }

      // 2. Textual Analysis
      if (currentAnalysisResults.ingestion?.text) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add 1s delay to avoid rate limiting
        updateAndTrackStatus(AgentName.TEXTUAL_ANALYSIS, AgentStatus.RUNNING, "Analyzing text...");
        const textualResult: TextualAnalysisOutput = await performTextualAnalysis(currentAnalysisResults.ingestion.text);
        currentAnalysisResults.textual = textualResult;
        setAnalysisResults(currentAnalysisResults);
        updateAndTrackStatus(AgentName.TEXTUAL_ANALYSIS, AgentStatus.COMPLETED, "Summary and entities extracted");
      } else {
        updateAndTrackStatus(AgentName.TEXTUAL_ANALYSIS, AgentStatus.SKIPPED, "No text to analyze");
      }
      
      // 3. Emotion Analysis
      if (currentAnalysisResults.ingestion?.text) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add 1s delay to avoid rate limiting
        updateAndTrackStatus(AgentName.EMOTION_ANALYSIS, AgentStatus.RUNNING, "Analyzing emotional tone...");
        const emotionResult: EmotionAnalysisOutput = await performEmotionAnalysis(currentAnalysisResults.ingestion.text);
        currentAnalysisResults.emotion = emotionResult;
        setAnalysisResults(currentAnalysisResults);
        updateAndTrackStatus(AgentName.EMOTION_ANALYSIS, AgentStatus.COMPLETED, `Emotion: ${emotionResult.dominant_emotion}`);
      } else {
        updateAndTrackStatus(AgentName.EMOTION_ANALYSIS, AgentStatus.SKIPPED, "No text to analyze");
      }

      // 4. Visual Analysis
      if (imageData) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add 1s delay to avoid rate limiting
        updateAndTrackStatus(AgentName.VISUAL_ANALYSIS, AgentStatus.RUNNING, "Analyzing uploaded image...");
        const visualResult = await performVisualAnalysis(imageData);
        currentAnalysisResults.visual = visualResult;
        setAnalysisResults(currentAnalysisResults);
        updateAndTrackStatus(AgentName.VISUAL_ANALYSIS, AgentStatus.COMPLETED, "Image analysis complete");
      } else if (videoFile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateAndTrackStatus(AgentName.VISUAL_ANALYSIS, AgentStatus.RUNNING, "Extracting frames from video...");
        const frames = await extractFramesFromVideo(videoFile, 5);
        updateAndTrackStatus(AgentName.VISUAL_ANALYSIS, AgentStatus.RUNNING, "Analyzing video frames...");
        const visualResult = await performVisualAnalysis(frames);
        currentAnalysisResults.visual = visualResult;
        setAnalysisResults(currentAnalysisResults);
        updateAndTrackStatus(AgentName.VISUAL_ANALYSIS, AgentStatus.COMPLETED, "Video analysis complete");
      } else {
        updateAndTrackStatus(AgentName.VISUAL_ANALYSIS, AgentStatus.SKIPPED, "No visual media uploaded");
      }

      // 5. Source Intelligence
      if (currentAnalysisResults.ingestion?.domain) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add 1s delay to avoid rate limiting
        updateAndTrackStatus(AgentName.SOURCE_INTELLIGENCE, AgentStatus.RUNNING, "Verifying source credibility...");
        const sourceResult = await performSourceIntelligence(currentAnalysisResults.ingestion.domain);
        currentAnalysisResults.source = sourceResult;
        setAnalysisResults(currentAnalysisResults);
        // Fix: Corrected typo from SOURCE_INTELLigence to SOURCE_INTELLIGENCE
        updateAndTrackStatus(AgentName.SOURCE_INTELLIGENCE, AgentStatus.COMPLETED, `Credibility: ${sourceResult.source_validity}`);
        
        const MISINFORMATION_THRESHOLD = 40;
        if (sourceResult.trust_score < MISINFORMATION_THRESHOLD) {
          try {
            await addMisinformationRecord({
              domain: currentAnalysisResults.ingestion.domain,
              url: submittedUrl,
              trustScore: sourceResult.trust_score,
              timestamp: Date.now(),
            });
          } catch (e) {
            console.error("Failed to save misinformation record:", e);
          }
        }
      } else {
        updateAndTrackStatus(AgentName.SOURCE_INTELLIGENCE, AgentStatus.SKIPPED, "No domain to verify");
      }

      
      // 6. Final Synthesis
      if (!currentAnalysisResults.textual && !currentAnalysisResults.visual) {
        throw new Error("No data available to generate a brief. Provide a URL, image, or text.");
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Add 1s delay to avoid rate limiting
      updateAndTrackStatus(AgentName.FINAL_SYNTHESIS, AgentStatus.RUNNING, "Generating final brief...");
      const reportStream = generateFinalBrief(currentAnalysisResults);
      let fullReport = '';
      setFinalReport(''); 
      for await (const chunk of reportStream) {
        fullReport += chunk;
        setFinalReport(prev => (prev ?? '') + chunk);
      }
      updateAndTrackStatus(AgentName.FINAL_SYNTHESIS, AgentStatus.COMPLETED, "Brief generated successfully");
      
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        url: submittedUrl || (textInput ? "Direct Text Input" : (imageFile ? imageFile.name : videoFile!.name)),
        report: fullReport,
        timestamp: new Date().toISOString(),
        pipelineState: currentPipelineState,
        analysisResults: currentAnalysisResults,
      };

      setActiveAnalysisId(newHistoryItem.id);
      setHistory(prevHistory => {
          const updatedHistory = [newHistoryItem, ...prevHistory];
          try {
              localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
          } catch (e) {
              console.error("Failed to save history to localStorage", e);
          }
          return updatedHistory;
      });

      // Initialize chat session after report is generated
      const session = startFollowUpChat(fullReport);
      setChatSession(session);
      setChatMessages([{ role: 'model', content: "I've generated the brief. What specific details would you like to explore?" }]);


    } catch (err) {
      console.error("Pipeline Error:", err);
      const friendlyMessage = getFriendlyErrorMessage(err);
      
      const runningAgentEntry = Object.entries(currentPipelineState).find(([, val]) => val.status === AgentStatus.RUNNING);
      const failedAgentName = runningAgentEntry ? runningAgentEntry[0] as AgentName : null;

      let userFacingError = `Pipeline failed: ${friendlyMessage}`;

      if (failedAgentName) {
        updateAndTrackStatus(failedAgentName, AgentStatus.ERROR, friendlyMessage);

        switch (failedAgentName) {
          case AgentName.CONTENT_INGESTION:
            userFacingError = `Content Ingestion failed. Please check if the URL is correct and publicly accessible, or try a different source. Details: ${friendlyMessage}`;
            break;
          case AgentName.TEXTUAL_ANALYSIS:
            userFacingError = `Textual Analysis failed. The content from the source might be malformed or empty. Details: ${friendlyMessage}`;
            break;
          case AgentName.EMOTION_ANALYSIS:
            userFacingError = `Emotion Analysis failed. The model could not determine the emotional tone of the content. Details: ${friendlyMessage}`;
            break;
          case AgentName.VISUAL_ANALYSIS:
            userFacingError = `Visual Analysis failed. The uploaded media might be corrupted or in an unsupported format. Details: ${friendlyMessage}`;
            break;
          case AgentName.SOURCE_INTELLIGENCE:
            userFacingError = `Source Intelligence failed. The model could not verify the source's credibility, which can happen with new or obscure domains. Details: ${friendlyMessage}`;
            break;
          case AgentName.FINAL_SYNTHESIS:
            userFacingError = `Final Synthesis failed. The model could not generate a brief from the collected data. Details: ${friendlyMessage}`;
            break;
          default:
            userFacingError = `An error occurred during the '${failedAgentName}' step. Details: ${friendlyMessage}`;
            break;
        }
      }
      
      setError(userFacingError);

    } finally {
      setIsLoading(false);
    }
  }, [historyKey]); 
  
  const handleSendChatMessage = async (message: string) => {
    if (!chatSession || isChatLoading) return;

    setIsChatLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);

    try {
        const stream = await chatSession.sendMessageStream({ message });
        
        let modelResponse = '';
        setChatMessages(prev => [...prev, { role: 'model', content: '' }]);

        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.content = modelResponse;
                }
                return newMessages;
            });
        }

    } catch (err) {
        console.error("Chat Error:", err);
        const friendlyMessage = getFriendlyErrorMessage(err);
        setChatMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
                lastMessage.content = `Sorry, an error occurred: ${friendlyMessage}`;
            }
            return newMessages;
        });
    } finally {
        setIsChatLoading(false);
    }
  };


  return (
    <div className="bg-brand-bg font-sans flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      <HistorySidebar 
        history={history} 
        onSelectItem={handleSelectHistory} 
        onClearHistory={handleClearHistory}
        onNewAnalysis={handleNewAnalysis}
        activeItemId={activeAnalysisId}
        currentUser={currentUser}
        onLogout={onLogout}
        isCompareMode={isCompareMode}
        onToggleCompareMode={handleToggleCompareMode}
        selectedIds={selectedHistoryIds}
        onSelectItemForCompare={handleSelectItemForCompare}
        onRunComparison={handleRunComparison}
        isComparing={isComparing}
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {showComparisonView ? (
           <ComparisonReportDisplay
            comparisonBrief={comparisonReport}
            originalReports={history.filter(item => selectedHistoryIds.includes(item.id))}
            onBack={handleExitComparisonView}
          />
        ) : (
          <>
            <header className="text-center mb-8">
              <div className="inline-block p-3 bg-brand-surface border border-brand-border rounded-full mb-4 shadow-lg shadow-brand-accent/10">
                  <ShieldCheckIcon className="w-10 h-10 text-brand-accent" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-brand-accent">
                  Trustle
              </h1>
              <p className="text-lg text-brand-text-secondary mt-2 max-w-2xl mx-auto">
                Your shield against misinformation. Turning data into trusted intelligence.
              </p>
            </header>
            
            <main>
                <URLInput onSubmit={handleRunPipeline} isLoading={isLoading} />

                {misinformationWarning && (
                    <div className="max-w-3xl mx-auto my-4 p-4 bg-yellow-900/50 border border-brand-warning text-brand-warning rounded-lg flex items-start gap-4" role="alert">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-bold">Déjà Vu Warning</p>
                            <p className="text-sm">You've previously analyzed this source (<span className="font-semibold">{misinformationWarning.domain}</span>) and found it to be unreliable.</p>
                            <p className="text-xs mt-2">Logged on {new Date(misinformationWarning.timestamp).toLocaleDateString()} with a trust score of {misinformationWarning.trustScore}/100.</p>
                        </div>
                        <button onClick={() => setMisinformationWarning(null)} className="ml-auto p-1 -mt-2 -mr-2 text-brand-warning/70 hover:text-brand-warning" aria-label="Dismiss warning">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {(isLoading || finalReport || error) && (
                    <AgentPipeline pipelineState={pipelineState} />
                )}
                
                {error && (
                    <div className="max-w-4xl mx-auto my-4 p-4 bg-red-900/50 border border-brand-error text-brand-error rounded-lg">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {finalReport && !isLoading && (
                    <ReportDisplay report={finalReport} url={url} analysisResults={analysisResults} />
                )}

                {finalReport && !isLoading && chatSession && (
                  <FollowUpChat
                    messages={chatMessages}
                    onSendMessage={handleSendChatMessage}
                    isLoading={isChatLoading}
                  />
                )}
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
