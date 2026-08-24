'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useShoppingStore } from './useShoppingStore';
import { Category } from '@/types';

export function useVoiceAssistant() {
  const {
    items,
    pantryItems,
    addItem,
    removeItem,
    updateQuantityById,
    setBudgetLimit,
    shoppingLists,
    activeListId
  } = useShoppingStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedLanguage]);

  const processTranscript = useCallback(async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setIsProcessing(true);
    setFeedbackMessage('Groq AI is reasoning...');

    try {
      const activeList = shoppingLists.find((l) => l.id === activeListId) || shoppingLists[0];
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: cleanText,
          currentCart: activeList?.items || items,
          purchaseHistory: pantryItems,
          language: selectedLanguage,
        }),
      });

      const data = await res.json();

      // Guarded Cart Additions
      if ((data.action === 'ADD' || data.action === 'ADD_BUNDLE') && Array.isArray(data.items) && data.items.length > 0) {
        data.items.forEach((item: any) => {
          if (item && item.name && item.name.trim()) {
            addItem({
              name: item.name,
              quantity: Number(item.quantity) || 1,
              unit: item.unit || 'pack',
              category: (item.category || 'Pantry') as Category,
              price: Number(item.price) || 60,
              image: item.image || '🛒',
              brand: item.brand || undefined,
              substituteSuggestion: item.substituteSuggestion || undefined,
            });
          }
        });
      } else if (data.action === 'REMOVE' && data.update_target?.name) {
        const targetName = data.update_target.name.toLowerCase();
        const targetItem = items.find((i) => i.name.toLowerCase().includes(targetName));
        if (targetItem) {
          removeItem(targetItem.id);
        }
      } else if (data.action === 'UPDATE_QUANTITY' && data.update_target?.name) {
        const targetName = data.update_target.name.toLowerCase();
        const targetItem = items.find((i) => i.name.toLowerCase().includes(targetName));
        if (targetItem && typeof data.update_target.quantity === 'number') {
          const delta = data.update_target.quantity - targetItem.quantity;
          updateQuantityById(targetItem.id, delta);
        }
      } else if (data.action === 'SET_BUDGET' && data.budget_limit) {
        setBudgetLimit(Number(data.budget_limit));
      }

      // Voice and text loopback confirmation
      if (data.ai_response_text || data.feedbackMessage) {
        const spoken = data.ai_response_text || data.feedbackMessage;
        setFeedbackMessage(spoken);
        speak(spoken);
      }
    } catch (err: any) {
      console.error('Voice assistant error:', err);
      setFeedbackMessage("Couldn't process that command. Try again!");
    } finally {
      setIsProcessing(false);
    }
  }, [items, pantryItems, selectedLanguage, shoppingLists, activeListId, addItem, removeItem, updateQuantityById, setBudgetLimit, speak]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const toggleListening = useCallback(async () => {
    if (recognitionRef.current) {
      const finalRecorded = accumulatedTranscriptRef.current;
      stopListening();
      if (finalRecorded) {
        processTranscript(finalRecorded);
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is supported in Google Chrome, Microsoft Edge, and Safari.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());

      accumulatedTranscriptRef.current = '';
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setFeedbackMessage('Listening... Speak naturally (tap mic when done) 🎙️');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript + ' ';
        }

        const trimmed = currentText.trim();
        accumulatedTranscriptRef.current = trimmed;

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
          if (accumulatedTranscriptRef.current) {
            processTranscript(accumulatedTranscriptRef.current);
          }
        }, 2500);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setFeedbackMessage(`Voice error: ${event.error}`);
          stopListening();
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setFeedbackMessage('Microphone permission denied.');
      stopListening();
    }
  }, [selectedLanguage, processTranscript, stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    toggleListening,
    processTranscript,
    isProcessing,
    feedbackMessage,
  };
}