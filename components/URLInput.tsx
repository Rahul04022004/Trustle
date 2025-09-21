import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VideoCameraIcon, XMarkIcon } from './icons/AgentIcons';

interface URLInputProps {
  onSubmit: (data: { url: string; imageFile: File | null; videoFile: File | null; textInput: string; }) => void;
  isLoading: boolean;
}

// Icons for Camera Modal
const RecordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="12" cy="12" r="8" />
    </svg>
);

const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
);

const SwitchCameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695v-2.695A8.25 8.25 0 008.842 3.644l-3.18 3.182m0 0h4.992m-4.992 0l3.182-3.182" />
    </svg>
);


const URLInput: React.FC<URLInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const MAX_RECORDING_TIME = 10; // in seconds
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Camera stream management
    const startStream = async () => {
      if (!videoRef.current) return;
      
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera not supported on this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("Could not access camera. Please check permissions in your browser settings.");
      }
    };

    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (showCamera) {
      startStream();
    } else {
      stopStream();
    }
    
    return () => {
      stopStream();
    };
  }, [showCamera]);


  const clearAllFiles = () => {
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);
  }
  
  const handleVideoFileChange = (file: File | null) => {
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear other inputs
      setUrl('');
      setTextInput('');
      setImageFile(null);
      setImagePreview(null);
    } else {
      clearAllFiles();
      if(file) alert('Please select a valid video file.');
    }
  }

  const handleFileChange = (file: File | null) => {
    if (!file) {
      clearAllFiles();
      return;
    }

    if (file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear other inputs
      setUrl('');
      setTextInput('');
      setVideoFile(null);
      setVideoPreview(null);
    } else if (file.type.startsWith('video/')) {
        handleVideoFileChange(file);
    } else {
      clearAllFiles();
      alert('Please select a valid image or video file.');
    }
  };
  
  const handleCapture = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (context) {
              context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              canvas.toBlob(blob => {
                  if (blob) {
                      const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                      handleFileChange(file);
                  }
                  setShowCamera(false);
              }, 'image/png');
          } else {
            setShowCamera(false);
          }
      }
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      // Start recording
      if (!streamRef.current) {
        setCameraError("Camera stream not available.");
        return;
      }
      setIsRecording(true);
      setRecordingTime(0);
      recordedChunksRef.current = [];
      
      const options = { mimeType: 'video/webm; codecs=vp9' };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: options.mimeType });
        handleVideoFileChange(file);
        setShowCamera(false);
      };

      mediaRecorderRef.current.start();
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            handleToggleRecording(); // Stop recording
          }
          return newTime;
        });
      }, 1000);

    } else {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setIsRecording(false);
      setRecordingTime(0);
    }
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    if(newUrl) {
        handleFileChange(null);
        setTextInput('');
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setTextInput(newText);
      if(newText) {
          handleFileChange(null);
          setUrl('');
      }
  };


  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((url || imageFile || videoFile || textInput) && !isLoading) {
      onSubmit({ url, imageFile, videoFile, textInput });
    }
  };

  const isUrlDisabled = isLoading || !!imageFile || !!textInput || !!videoFile;
  const isMediaDisabled = isLoading || !!url || !!textInput;
  const isTextDisabled = isLoading || !!url || !!imageFile || !!videoFile;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 bg-brand-surface border border-brand-border p-4 rounded-lg shadow-lg">
        <div className="relative flex-grow w-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter URL to analyze..."
            className="w-full bg-brand-bg border border-brand-border text-brand-text-primary rounded-md py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200 disabled:bg-brand-bg/50 disabled:cursor-not-allowed"
            disabled={isUrlDisabled}
            />
        </div>

        <div className="w-full flex items-center justify-center gap-4 text-sm font-semibold text-brand-text-secondary">
            <div className="h-px flex-grow bg-brand-border"></div>
            <span>OR</span>
            <div className="h-px flex-grow bg-brand-border"></div>
        </div>

        <div 
          className={`w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-200 ${isMediaDisabled ? 'opacity-50 cursor-not-allowed' : (isDragging ? 'border-brand-accent bg-brand-accent/10' : 'border-brand-border hover:border-brand-accent/70')}`}
          onDragEnter={isMediaDisabled ? undefined : onDragEnter}
          onDragLeave={isMediaDisabled ? undefined : onDragLeave}
          onDragOver={isMediaDisabled ? undefined : onDragOver}
          onDrop={isMediaDisabled ? undefined : onDrop}
        >
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            className="hidden"
            disabled={isMediaDisabled}
            id="media-upload"
          />
          {imagePreview ? (
            <div className="text-center">
              <img src={imagePreview} alt="Image preview" className="max-h-32 rounded-md mx-auto mb-2" />
              <p className="text-sm text-brand-text-primary break-all">{imageFile?.name}</p>
              <button 
                type="button"
                onClick={() => handleFileChange(null)}
                className="mt-2 text-xs text-brand-error hover:underline"
                disabled={isLoading}
              >
                Remove
              </button>
            </div>
          ) : videoPreview ? (
             <div className="text-center">
              <video src={videoPreview} controls className="max-h-32 rounded-md mx-auto mb-2" />
              <p className="text-sm text-brand-text-primary break-all">{videoFile?.name}</p>
              <button 
                type="button"
                onClick={() => handleFileChange(null)}
                className="mt-2 text-xs text-brand-error hover:underline"
                disabled={isLoading}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-brand-text-secondary w-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-4 text-brand-text-secondary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="font-semibold text-brand-text-primary">Add an image or video</p>
                <p className="text-xs text-brand-text-secondary mb-4">Drag & drop file, or choose an option below</p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label htmlFor="media-upload" className={`w-full sm:w-auto text-center px-4 py-2 text-sm font-semibold bg-brand-bg border border-brand-border rounded-md text-brand-text-primary transition-colors ${isMediaDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-brand-accent/70'}`}>
                        Upload from device
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        disabled={isMediaDisabled}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 bg-brand-bg border border-brand-border rounded-md hover:border-brand-accent/70 text-brand-text-primary transition-colors disabled:cursor-not-allowed"
                        aria-label="Scan from camera"
                    >
                        <VideoCameraIcon className="w-5 h-5"/>
                        Scan from Camera
                    </button>
                </div>
            </div>
          )}
        </div>

        <div className="w-full flex items-center justify-center gap-4 text-sm font-semibold text-brand-text-secondary">
            <div className="h-px flex-grow bg-brand-border"></div>
            <span>OR</span>
            <div className="h-px flex-grow bg-brand-border"></div>
        </div>
        
        <div className="relative flex-grow w-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 absolute left-3 top-3.5 text-brand-text-secondary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            <textarea
                value={textInput}
                onChange={handleTextInputChange}
                placeholder="Paste text to analyze..."
                className="w-full bg-brand-bg border border-brand-border text-brand-text-primary rounded-md py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200 min-h-[120px] resize-y disabled:bg-brand-bg/50 disabled:cursor-not-allowed"
                disabled={isTextDisabled}
            />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || (!url && !imageFile && !videoFile && !textInput)}
          className="w-full sm:w-auto px-6 py-3 bg-brand-accent text-white font-semibold rounded-md hover:bg-sky-400 disabled:bg-slate-500 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : "Generate Brief"}
        </button>
      </form>
      {showCamera && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="camera-modal-title">
            <h2 id="camera-modal-title" className="sr-only">Camera View</h2>

            <div className="absolute inset-0 w-full h-full">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>

            {/* Overlay with scanning frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-11/12 sm:w-3/4 md:w-1/2 aspect-video relative">
                    <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg animate-pulse-fast"></div>
                    <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg animate-pulse-fast"></div>
                    <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg animate-pulse-fast"></div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg animate-pulse-fast"></div>
                    
                    <div className="absolute left-0 right-0 h-1 bg-brand-accent/70 shadow-[0_0_10px_2px_#38bdf8] animate-scan"></div>
                </div>
            </div>

            {/* Controls */}
             <div className="absolute top-5 right-5 flex items-center gap-4 z-10">
                {/* Mode Toggle */}
                <div className="bg-black/40 rounded-full p-1 flex text-sm text-white font-semibold">
                    <button onClick={() => setCameraMode('photo')} className={`px-3 py-1 rounded-full transition-colors ${cameraMode === 'photo' ? 'bg-brand-accent' : ''}`}>Photo</button>
                    <button onClick={() => setCameraMode('video')} className={`px-3 py-1 rounded-full transition-colors ${cameraMode === 'video' ? 'bg-brand-accent' : ''}`}>Video</button>
                </div>
                <button 
                    type="button"
                    onClick={() => setShowCamera(false)} 
                    className="bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors"
                    aria-label="Close camera"
                >
                    <XMarkIcon className="w-8 h-8" />
                </button>
            </div>
            
             {isRecording && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-white font-mono text-lg">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span>{`0:${(MAX_RECORDING_TIME - recordingTime).toString().padStart(2, '0')}`}</span>
                </div>
            )}
            
            <div className="absolute bottom-8 flex justify-center w-full">
                {cameraMode === 'photo' ? (
                     <button 
                        type="button" 
                        onClick={handleCapture} 
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-brand-border hover:border-brand-accent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-black/50"
                        aria-label="Capture photo"
                    >
                        <div className="w-[70px] h-[70px] bg-white rounded-full border-2 border-brand-bg"></div>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleToggleRecording}
                        className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center border-4 border-brand-border hover:border-red-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black/50"
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        {isRecording ? (
                            <StopIcon className="w-9 h-9 text-white" />
                        ) : (
                            <RecordIcon className="w-16 h-16 text-white" />
                        )}
                    </button>
                )}
            </div>
            
            {cameraError && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md p-4" aria-live="polite">
                    <p className="text-brand-error mt-4 text-center bg-brand-error/20 border border-brand-error p-3 rounded">{cameraError}</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default URLInput;
