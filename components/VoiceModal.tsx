import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  X, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  Volume2, 
  Settings2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { PantryItem, ShoppingList, ShoppingPlan } from '../types';
import { parseIntentWithAI, ExtendedIntentResponse } from '../lib/nlp';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pantry: PantryItem[];
  activeList: ShoppingList | null;
  existingLists?: ShoppingList[];
  onApplyIntent: (response: ExtendedIntentResponse, plan?: ShoppingPlan, targetListId?: string) => void;
  language?: 'en-IN' | 'hi-IN';
}

type VoiceState = 'idle' | 'listening' | 'speaking' | 'confirmation' | 'processing';

interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

interface PendingConfirmationState {
  action: 'DELETE_PANTRY_ITEM' | 'DELETE_LIST_ITEM';
  targetId: string;
  targetName: string;
  targetListId?: string;
}

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
  const [state, setState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [agentSpokenText, setAgentSpokenText] = useState('');
  const [textFallback, setTextFallback] = useState('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>([12, 18, 10, 24, 15, 20, 14]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmationState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [audioDevices, setAudioDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const englishPromptChips = [
    "I want to make Pav Bhaji for 4 people",
    "What is running low in my pantry?",
    "Show me today's top deals and discounts",
    "Add 2 bottles of milk and 1 bread"
  ];

  const hindiPromptChips = [
    "Pav bhaji bnani hai 4 logo ke liye",
    "Pantry me kya bacha hai?",
    "Aaj ke saste deals aur offers dikhao",
    "Do packet doodh aur bread add kardo"
  ];

  const loadAudioDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(d => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`
        }));

      setAudioDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate audio devices:', err);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (isOpen) {
      loadAudioDevices();
    }
  }, [isOpen, loadAudioDevices]);

  const speakVoice = useCallback((text: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEndCallback?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLang;
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find(v => v.lang.toLowerCase().includes(currentLang === 'hi-IN' ? 'hi' : 'en'));
      if (matchVoice) utterance.voice = matchVoice;

      utterance.onstart = () => setState('speaking');
      utterance.onend = () => onEndCallback?.();
      utterance.onerror = () => onEndCallback?.();

      window.speechSynthesis.speak(utterance);
    } catch {
      onEndCallback?.();
    }
  }, [currentLang]);

  const stopAudioStreams = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
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

  const handleConversationalIntent = useCallback(async (rawInput: string) => {
    const cleanInput = rawInput.trim();
    if (!cleanInput) {
      setState('idle');
      return;
    }

    stopAudioStreams();
    const inputLower = cleanInput.toLowerCase();
    const currentList = activeList || existingLists[0];

    if (pendingConfirm) {
      const isAffirmative = /^(yes|yeah|sure|confirm|do it|yep|delete it|haan|kardo|ha|theek hai|bilkul)/i.test(inputLower);
      const isNegative = /^(no|cancel|stop|nah|don't|mat karo|nahi|rehnedo)/i.test(inputLower);

      if (isAffirmative) {
        if (pendingConfirm.action === 'DELETE_PANTRY_ITEM') {
          const response: ExtendedIntentResponse = {
            intent: 'REMOVE_ITEMS',
            confidence: 0.98,
            clarificationRequired: false,
            feedbackMessage: currentLang === 'hi-IN'
              ? `पैंट्री से ${pendingConfirm.targetName} हटा दिया गया है।`
              : `Deleted ${pendingConfirm.targetName} from your pantry.`,
            responseMessage: currentLang === 'hi-IN'
              ? `पैंट्री से ${pendingConfirm.targetName} हटा दिया गया है।`
              : `Deleted ${pendingConfirm.targetName} from your pantry.`,
            items: [{ name: pendingConfirm.targetName, normalizedName: null, quantity: 1, unit: 'pack', brand: null, category: 'Produce', maxPrice: null }],
            entities: {},
            searchFilters: null,
            planRequest: null
          };
          setAgentSpokenText(response.feedbackMessage!);
          setPendingConfirm(null);
          speakVoice(response.feedbackMessage!, () => {
            onApplyIntent(response);
            setTimeout(() => onClose(), 1200);
          });
          return;
        }

        if (pendingConfirm.action === 'DELETE_LIST_ITEM') {
          const response: ExtendedIntentResponse = {
            intent: 'REMOVE_ITEMS',
            confidence: 0.98,
            clarificationRequired: false,
            feedbackMessage: currentLang === 'hi-IN'
              ? `${currentList?.title || 'लिस्ट'} से ${pendingConfirm.targetName} निकाल दिया गया है।`
              : `Removed ${pendingConfirm.targetName} from ${currentList?.title || 'your list'}.`,
            responseMessage: currentLang === 'hi-IN'
              ? `${currentList?.title || 'लिस्ट'} से ${pendingConfirm.targetName} निकाल दिया गया है।`
              : `Removed ${pendingConfirm.targetName} from ${currentList?.title || 'your list'}.`,
            items: [{ name: pendingConfirm.targetName, normalizedName: null, quantity: 1, unit: 'pack', brand: null, category: 'Produce', maxPrice: null }],
            entities: {},
            searchFilters: null,
            planRequest: null
          };
          setAgentSpokenText(response.feedbackMessage!);
          setPendingConfirm(null);
          speakVoice(response.feedbackMessage!, () => {
            onApplyIntent(response, undefined, currentList?.id);
            setTimeout(() => onClose(), 1200);
          });
          return;
        }
      }

      if (isNegative) {
        const cancelMsg = currentLang === 'hi-IN'
          ? `कैंसिल कर दिया गया। ${pendingConfirm.targetName} को नहीं हटाया गया।`
          : `Understood. Cancelled removal of ${pendingConfirm.targetName}.`;

        setAgentSpokenText(cancelMsg);
        setPendingConfirm(null);
        speakVoice(cancelMsg, () => setState('idle'));
        return;
      }
    }

    if (inputLower.includes('delete') || inputLower.includes('remove') || inputLower.includes('hatao') || inputLower.includes('nikaalo') || inputLower.includes('mat lo')) {
      const targetPantry = pantry.find(p => inputLower.includes(p.name.toLowerCase()));
      if (targetPantry) {
        const prompt = currentLang === 'hi-IN'
          ? `पैंट्री में ${targetPantry.name} लगभग ${targetPantry.estimatedRemaining ?? 0}% बचा है। क्या आप इसे हटाना चाहते हैं?`
          : `I found ${targetPantry.name} in your pantry with ${targetPantry.estimatedRemaining ?? 0}% remaining. Are you sure you want to delete it?`;

        setAgentSpokenText(prompt);
        setPendingConfirm({
          action: 'DELETE_PANTRY_ITEM',
          targetId: targetPantry.id,
          targetName: targetPantry.name
        });
        speakVoice(prompt, () => setState('confirmation'));
        return;
      }

      if (currentList) {
        const targetListItem = currentList.items.find(i => inputLower.includes(i.name.toLowerCase()));
        if (targetListItem) {
          const prompt = currentLang === 'hi-IN'
            ? `${currentList.title} पर ${targetListItem.name} मिला। क्या इसे लिस्ट से निकाल दूँ?`
            : `Found ${targetListItem.name} on ${currentList.title}. Should I remove it?`;

          setAgentSpokenText(prompt);
          setPendingConfirm({
            action: 'DELETE_LIST_ITEM',
            targetId: targetListItem.id,
            targetName: targetListItem.name,
            targetListId: currentList.id
          });
          speakVoice(prompt, () => setState('confirmation'));
          return;
        }
      }
    }

    setState('processing');
    const result = await parseIntentWithAI(cleanInput, {
      language: currentLang,
      pantry,
      activeListId: currentList?.id,
      existingLists
    });

    const feedback = result.feedbackMessage || result.responseMessage || 'Action completed.';
    setAgentSpokenText(feedback);

    speakVoice(feedback, () => {
      onApplyIntent(result, undefined, currentList?.id);
      if (result.intent !== 'UNKNOWN' && !result.clarificationRequired) {
        setTimeout(() => onClose(), 1200);
      } else {
        setState('idle');
      }
    });
  }, [activeList, currentLang, existingLists, onApplyIntent, onClose, pantry, pendingConfirm, speakVoice, stopAudioStreams]);

  const startListening = useCallback(async () => {
    stopAudioStreams();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setErrorMessage(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    try {
      const constraints: MediaTrackConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : {};

      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
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

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLang;

        recognition.onstart = () => setState('listening');
        recognition.onresult = (e: any) => {
          let text = '';
          for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
          setLiveTranscript(text);
        };
        recognition.onend = () => {
          if (liveTranscript.trim()) handleConversationalIntent(liveTranscript);
          else setState('idle');
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      }

      setErrorMessage('Speech recognition is not supported in this browser.');
      setState('idle');
    } catch {
      setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
      setState('idle');
    }
  }, [currentLang, handleConversationalIntent, liveTranscript, selectedDeviceId, stopAudioStreams]);

  const handleDoneSpeaking = () => {
    stopAudioStreams();
    if (liveTranscript.trim()) handleConversationalIntent(liveTranscript);
    else setState('idle');
  };

  useEffect(() => {
    if (!isOpen) {
      stopAudioStreams();
      setState('idle');
      setLiveTranscript('');
      setAgentSpokenText('');
      setErrorMessage(null);
      setPendingConfirm(null);
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
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-[#FAF9F6]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#708271] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#353535]">Bilingual Voice Assistant</h3>
                <p className="text-[10px] uppercase font-semibold text-[#708271] tracking-wider">
                  {state === 'listening' ? '● Recording Voice' : state === 'processing' ? '● Transcribing & AI' : state === 'speaking' ? '● Speaking Response' : 'Ready'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const nextLang = currentLang === 'en-IN' ? 'hi-IN' : 'en-IN';
                  setCurrentLang(nextLang);
                  stopAudioStreams();
                  setState('idle');
                }}
                className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-xl bg-[#E2E8CE]/80 hover:bg-[#E2E8CE] text-[#353535] font-bold transition-colors shadow-xs"
              >
                <Globe className="w-3.5 h-3.5 text-[#708271]" />
                <span>{currentLang === 'en-IN' ? 'English (EN)' : 'हिन्दी (Hindi)'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#353535]/60 hover:text-[#353535] hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-2 bg-[#FAF9F6]/80 border-b border-black/5 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-[#353535]/70 flex items-center gap-1 shrink-0">
              <Settings2 className="w-3.5 h-3.5 text-[#708271]" />
              Input Mic:
            </span>
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                stopAudioStreams();
                setState('idle');
              }}
              className="flex-1 max-w-[280px] px-2 py-1 bg-white border border-black/10 rounded-lg text-xs font-semibold text-[#353535] truncate focus:outline-none focus:border-[#708271]"
            >
              {audioDevices.length > 0 ? (
                audioDevices.map((dev) => (
                  <option key={dev.deviceId} value={dev.deviceId}>{dev.label}</option>
                ))
              ) : (
                <option value="">Default System Microphone</option>
              )}
            </select>
          </div>

          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

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
                      ? 'रेसिपी, पैंट्री चेक, डिस्काउंट डील्स, या राशन का सामान बोलें।'
                      : 'Ask for meal recipes, pantry status, discounts, or grocery items.'}
                  </p>
                </div>

                <div className="w-full text-left space-y-1.5 pt-2 border-t border-black/5">
                  {(currentLang === 'hi-IN' ? hindiPromptChips : englishPromptChips).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleConversationalIntent(chip)}
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
                    handleConversationalIntent(textFallback);
                    setTextFallback('');
                  }}
                  className="w-full flex items-center space-x-2 pt-2"
                >
                  <input
                    type="text"
                    value={textFallback}
                    onChange={(e) => setTextFallback(e.target.value)}
                    placeholder={currentLang === 'hi-IN' ? "या यहाँ लिखें (उदा. 'पाव भाजी बनानी है')..." : "Or type here (e.g. 'I want to make Pav Bhaji')..."}
                    className="flex-1 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl focus:outline-none focus:border-[#708271]"
                  />
                  <button
                    type="submit"
                    disabled={!textFallback.trim()}
                    className="px-4 py-2 bg-[#708271] disabled:bg-neutral-300 text-white text-xs font-semibold rounded-xl"
                  >
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

                <div className="space-y-3 w-full max-w-sm">
                  <div className="min-h-[56px] p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/5 flex items-center justify-center">
                    <p className="text-sm font-medium text-[#353535] text-center leading-relaxed">
                      {liveTranscript ? (
                        <span>"{liveTranscript}"</span>
                      ) : (
                        <span className="opacity-50 italic">
                          {currentLang === 'hi-IN' ? "आपकी आवाज़ रिकॉर्ड हो रही है... बोलिए" : "Recording voice... speak now"}
                        </span>
                      )}
                    </p>
                  </div>
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
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="w-12 h-12 rounded-2xl bg-[#E2E8CE] text-[#708271] flex items-center justify-center shadow-xs"
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <div>
                  <h4 className="font-bold text-sm text-[#353535]">Processing Voice Request</h4>
                  <p className="text-xs text-neutral-500 mt-0.5 font-serif italic">
                    "{liveTranscript || textFallback || 'Audio Sample'}"
                  </p>
                </div>
              </div>
            )}

            {(state === 'speaking' || state === 'confirmation') && (
              <div className="space-y-5 my-auto">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                  <Volume2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                    {agentSpokenText}
                  </p>
                </div>

                {state === 'confirmation' && pendingConfirm && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleConversationalIntent('Yes')}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      {currentLang === 'hi-IN' ? 'हाँ, डिलीट करो' : 'Yes, Delete It'}
                    </button>
                    <button
                      onClick={() => handleConversationalIntent('No')}
                      className="flex-1 py-3 bg-neutral-200 hover:bg-neutral-300 text-[#353535] rounded-xl text-xs font-semibold"
                    >
                      {currentLang === 'hi-IN' ? 'कैंसिल' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};