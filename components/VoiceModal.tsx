import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  X, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  Volume2, 
  AlertCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { PantryItem, ShoppingList, ShoppingPlan } from '../types';
import { ExtendedIntentResponse } from '../lib/nlp';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pantry: PantryItem[];
  activeList: ShoppingList | null;
  existingLists?: ShoppingList[];
  onApplyIntent: (response: ExtendedIntentResponse, plan?: ShoppingPlan, targetListId?: string) => void;
  language?: 'en-IN' | 'hi-IN';
}

type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing';

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  pantry,
  activeList,
  existingLists = [],
  onApplyIntent,
  language = 'en-IN'
}) => {
  const [currentLang, setCurrentLang] = useState<'en-IN' | 'hi-IN'>(language);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [state, setState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [agentSpokenText, setAgentSpokenText] = useState('');
  const [textFallback, setTextFallback] = useState('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>([12, 18, 10, 24, 15, 20, 14]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-turn context & thread locks
  const pendingContextRef = useRef<string>('');
  const currentTranscriptRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const englishPromptChips = [
    "Add 2 kg potatoes and 3 packets of milk",
    "What is running low in my pantry?",
    "Show me today's top deals and discounts",
    "Add ingredients for Pav Bhaji"
  ];

  const hindiPromptChips = [
    "Do packet doodh aur bread add kardo",
    "Pantry me kya bacha hai?",
    "Aaj ke saste deals aur offers dikhao",
    "Pav bhaji bnani hai 4 logo ke liye"
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stopAudioStreams = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyBars([12, 18, 10, 24, 15, 20, 14]);
  }, []);

  const speakVoice = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLang;
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        // Essential cooling period to avoid hardware lock
        setTimeout(() => onEnd?.(), 350);
      };
      utterance.onerror = () => {
        setTimeout(() => onEnd?.(), 350);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }, [currentLang]);

  const handleUserSpeech = useCallback(async (rawInput: string) => {
    const cleanInput = rawInput.trim();
    if (!cleanInput || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    stopAudioStreams();
    setState('processing');
    const currentList = activeList || existingLists[0];

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: cleanInput,
          pendingItemContext: pendingContextRef.current,
          language: currentLang,
          purchaseHistory: pantry,
          currentCart: currentList?.items || []
        })
      });

      if (!res.ok) throw new Error('Voice API failed');

      const result = await res.json();
      const feedback = result.ai_response_text || result.feedbackMessage || 'Item updated in your list.';
      setAgentSpokenText(feedback);

      if (result.clarificationRequired) {
        // Multi-turn follow-up
        pendingContextRef.current = result.pendingContext || cleanInput.replace(/add|buy|get|need/gi, '').trim();
        setState('speaking');
        isProcessingRef.current = false;
        speakVoice(feedback, () => {
          startListening();
        });
      } else {
        // Terminal intent resolution
        pendingContextRef.current = '';
        setState('speaking');
        onApplyIntent(result, undefined, currentList?.id);
        isProcessingRef.current = false;
        speakVoice(feedback, () => {
          setTimeout(() => {
            onClose();
            setState('idle');
          }, 1200);
        });
      }
    } catch {
      setErrorMessage('Could not process speech intent. Please tap the mic and try again.');
      isProcessingRef.current = false;
      setState('idle');
    }
  }, [activeList, currentLang, existingLists, onApplyIntent, onClose, pantry, speakVoice, stopAudioStreams]);

  const startListening = useCallback(() => {
    stopAudioStreams();
    setErrorMessage(null);
    setLiveTranscript('');
    currentTranscriptRef.current = '';
    isProcessingRef.current = false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      // Audio Visualizer Setup
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaStreamRef.current = stream;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateBars = () => {
          if (!mediaStreamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const avg = sum / bufferLength;
          setAudioLevel(Math.min(100, Math.round((avg / 120) * 100)));

          setFrequencyBars([
            Math.max(12, Math.round((dataArray[1] / 255) * 64)),
            Math.max(12, Math.round((dataArray[3] / 255) * 64)),
            Math.max(12, Math.round((dataArray[5] / 255) * 64)),
            Math.max(12, Math.round((dataArray[7] / 255) * 64)),
            Math.max(12, Math.round((dataArray[9] / 255) * 64)),
            Math.max(12, Math.round((dataArray[11] / 255) * 64)),
            Math.max(12, Math.round((dataArray[13] / 255) * 64)),
          ]);
          animFrameRef.current = requestAnimationFrame(updateBars);
        };
        updateBars();
      }).catch(() => {});

      const recognition = new SpeechRecognition();
      recognition.lang = currentLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setState('listening');
      };

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; ++i) {
          text += event.results[i][0].transcript + ' ';
        }
        const clean = text.trim();
        currentTranscriptRef.current = clean;
        setLiveTranscript(clean);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && !isProcessingRef.current) {
          setErrorMessage(`Microphone error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        const recorded = currentTranscriptRef.current.trim();
        if (!isProcessingRef.current && recorded) {
          handleUserSpeech(recorded);
        } else if (!isProcessingRef.current) {
          stopAudioStreams();
          setState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setErrorMessage('Microphone access was denied. Please check your browser permissions.');
      setState('idle');
    }
  }, [currentLang, handleUserSpeech, stopAudioStreams]);

  const handleDoneSpeaking = () => {
    const finalRecorded = currentTranscriptRef.current.trim();
    if (finalRecorded) {
      handleUserSpeech(finalRecorded);
    } else {
      stopAudioStreams();
      setState('idle');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopAudioStreams();
      setState('idle');
      setLiveTranscript('');
      setAgentSpokenText('');
      setErrorMessage(null);
      pendingContextRef.current = '';
      currentTranscriptRef.current = '';
      isProcessingRef.current = false;
      setIsLangDropdownOpen(false);
    }
  }, [isOpen, stopAudioStreams]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-[#FAF9F6] relative">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#708271] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#353535]">Bilingual Voice Assistant</h3>
                <p className="text-[10px] uppercase font-semibold text-[#708271] tracking-wider">
                  {state === 'listening' ? '● Listening...' : state === 'processing' ? '● Groq AI Reasoning...' : state === 'speaking' ? '● Responding...' : 'Ready'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Language Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#E2E8CE]/80 hover:bg-[#E2E8CE] text-[#353535] font-bold transition-all shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5 text-[#708271]" />
                  <span>{currentLang === 'en-IN' ? 'English (EN)' : 'हिन्दी (Hindi)'}</span>
                  <ChevronDown className="w-3 h-3 text-[#708271] opacity-70" />
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-black/5 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setCurrentLang('en-IN');
                        setIsLangDropdownOpen(false);
                        stopAudioStreams();
                        setState('idle');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#353535] hover:bg-[#FAF9F6] flex items-center justify-between"
                    >
                      <span>English (India)</span>
                      {currentLang === 'en-IN' && <Check className="w-3.5 h-3.5 text-[#708271]" />}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentLang('hi-IN');
                        setIsLangDropdownOpen(false);
                        stopAudioStreams();
                        setState('idle');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#353535] hover:bg-[#FAF9F6] flex items-center justify-between"
                    >
                      <span>हिन्दी (Hindi)</span>
                      {currentLang === 'hi-IN' && <Check className="w-3.5 h-3.5 text-[#708271]" />}
                    </button>
                  </div>
                )}
              </div>

              <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-500 hover:bg-black/5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Main Body */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-center">
            {state === 'idle' && (
              <div className="flex flex-col items-center text-center space-y-5 my-auto">
                <button 
                  onClick={startListening}
                  className="w-20 h-20 rounded-full bg-[#708271] hover:bg-[#5e705f] text-white flex items-center justify-center shadow-xl shadow-[#708271]/25 active:scale-95 transition-all"
                >
                  <Mic className="w-8 h-8" />
                </button>
                <div>
                  <h4 className="text-base font-serif italic text-[#353535]">
                    {currentLang === 'hi-IN' ? 'माइक दबाएँ और बोलें' : 'Tap mic to start speaking'}
                  </h4>
                  <p className="text-xs opacity-60 text-[#353535] mt-0.5">
                    {currentLang === 'hi-IN'
                      ? 'राशन का सामान, रेसिपी, या डील्स बोलें।'
                      : 'Say: "Add ingredients for Pav Bhaji" or "Add apple"'}
                  </p>
                </div>

                <div className="w-full text-left space-y-1.5 pt-2 border-t border-black/5">
                  {(currentLang === 'hi-IN' ? hindiPromptChips : englishPromptChips).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUserSpeech(chip)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#E2E8CE]/50 text-xs text-[#353535] border border-black/5 transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{chip}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#708271] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!textFallback.trim()) return;
                    handleUserSpeech(textFallback);
                    setTextFallback('');
                  }}
                  className="w-full flex items-center space-x-2 pt-2"
                >
                  <input
                    type="text"
                    value={textFallback}
                    onChange={(e) => setTextFallback(e.target.value)}
                    placeholder={currentLang === 'hi-IN' ? "या यहाँ लिखें..." : "Or type command..."}
                    className="flex-1 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl focus:outline-none focus:border-[#708271]"
                  />
                  <button type="submit" className="px-4 py-2 bg-[#708271] text-white text-xs font-semibold rounded-xl">
                    Send
                  </button>
                </form>
              </div>
            )}

            {state === 'listening' && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
                <div className="relative flex items-center justify-center h-28 w-28">
                  <motion.div
                    animate={{ 
                      scale: 1 + (audioLevel / 75), 
                      opacity: audioLevel > 5 ? 0.4 + (audioLevel / 200) : 0.15 
                    }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                    className="absolute w-28 h-28 rounded-full bg-[#708271]"
                  />
                  <div className="relative w-16 h-16 rounded-full bg-[#708271] flex items-center justify-center text-white shadow-lg">
                    <Mic className="w-7 h-7" />
                  </div>
                </div>

                <div className="flex items-end justify-center gap-1.5 h-12 py-1">
                  {frequencyBars.map((height, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: `${height}px` }}
                      transition={{ duration: 0.08, ease: 'easeOut' }}
                      className={`w-1.5 rounded-full transition-colors ${
                        audioLevel > 5 ? 'bg-[#708271]' : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="min-h-[56px] p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/5 flex items-center justify-center w-full max-w-sm">
                  <p className="text-sm font-medium text-[#353535] text-center leading-relaxed">
                    {liveTranscript ? `"${liveTranscript}"` : (
                      <span className="opacity-50 italic">Listening... speak now</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDoneSpeaking}
                    className="px-6 py-2.5 rounded-xl bg-[#708271] text-white text-xs font-bold hover:bg-[#5e705f] shadow-md transition-all active:scale-95"
                  >
                    Done Speaking
                  </button>
                  <button
                    onClick={() => {
                      stopAudioStreams();
                      setState('idle');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-neutral-200 text-[#353535] text-xs font-medium hover:bg-neutral-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {state === 'processing' && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <Sparkles className="w-8 h-8 text-[#708271] animate-spin" />
                <p className="text-xs font-semibold text-[#353535]">Groq AI analyzing query...</p>
              </div>
            )}

            {state === 'speaking' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 my-auto">
                <Volume2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                  {agentSpokenText}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};