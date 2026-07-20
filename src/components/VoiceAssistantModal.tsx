"use client";

import React, { useState, useEffect, useRef } from "react";
import { useExpenseStore } from "@/lib/store";
import { processVoiceQuery } from "@/actions/gemini";
import { Mic, MicOff, X, Volume2, Sparkles, Send, Keyboard, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceAssistantModal() {
  const transactions = useExpenseStore((state) => state.transactions);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [textMode, setTextMode] = useState(false);
  const [textQuery, setTextQuery] = useState("");

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSpeechSupported(false);
        setTextMode(true); // Default to text input if SpeechRecognition is missing
      } else {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-IN"; // Set language to Indian English for UPI context

        rec.onstart = () => {
          setIsListening(true);
          setTranscript("");
          setResponse("");
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setTranscript(resultText);
          handleSubmitQuery(resultText);
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsListening(false);
          if (event.error !== "no-speech") {
            setResponse(`Error: ${event.error}. Please try typing or try again.`);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [transactions]);

  // Handle Text-to-Speech Speak
  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop any currently speaking voice
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to pick a premium/natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("en-US") || v.lang.includes("en-GB"));
      if (engVoice) {
        utterance.voice = engVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Submit transcript to Server Action
  const handleSubmitQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResponse("");

    try {
      // Strip out the massive base64 screenshot_url payloads to avoid payload size limit errors
      const lightweightTransactions = transactions.map((t) => ({
        amount: t.amount,
        merchant: t.merchant,
        category: t.category,
        date: t.transaction_date,
      }));

      const result = await processVoiceQuery(query, lightweightTransactions);
      if (result.success && result.text) {
        setResponse(result.text);
        speak(result.text);
      } else {
        setResponse(result.error || "Sorry, I couldn't process that query.");
      }
    } catch (err: any) {
      console.error(err);
      setResponse("An error occurred while analyzing your query.");
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
        recognitionRef.current.stop();
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleModal = () => {
    setIsOpen(!isOpen);
    // Cleanup synthesis when opening/closing
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Reset state
    setTranscript("");
    setResponse("");
    setIsListening(false);
    setTextQuery("");
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={toggleModal}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 flex items-center justify-center border border-white/20 transition-transform active:scale-95"
        whileHover={{ scale: 1.1 }}
        animate={{
          boxShadow: [
            "0 4px 14px 0 rgba(168, 85, 247, 0.4)",
            "0 4px 24px 10px rgba(168, 85, 247, 0.2)",
            "0 4px 14px 0 rgba(168, 85, 247, 0.4)",
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
        }}
      >
        <Mic className="w-6 h-6" />
      </motion.button>

      {/* Voice Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950/80 p-6 md:p-8 shadow-2xl overflow-hidden glass-card"
            >
              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-600/10 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl" />

              {/* Close Button */}
              <button
                onClick={toggleModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  APEX Voice Assistant
                </h2>
              </div>

              {/* Voice Soundwaves Visualizer */}
              <div className="flex flex-col items-center justify-center min-h-[160px] py-4">
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div
                      key="listening-waves"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-end justify-center gap-1.5 h-16"
                    >
                      {[0.3, 0.8, 0.5, 0.9, 0.4, 0.7, 0.3].map((delay, index) => (
                        <motion.div
                          key={index}
                          className="w-1.5 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full"
                          animate={{
                            height: [16, 64, 16],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            delay: delay,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </motion.div>
                  ) : isLoading ? (
                    <motion.div
                      key="loading-spinner"
                      className="flex flex-col items-center justify-center gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="relative w-12 h-12">
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-purple-500/20"
                          style={{ borderTopColor: "#a855f7" }}
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                      </div>
                      <span className="text-xs text-purple-400 font-medium">Analyzing transactions...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle-assistant"
                      className="flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {!textMode ? (
                        <button
                          onClick={startListening}
                          className="p-6 rounded-full bg-white/[0.04] hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 transition-all duration-300 group flex items-center justify-center"
                        >
                          <Mic className="w-10 h-10 text-neutral-400 group-hover:text-purple-400 group-hover:scale-105 transition-all" />
                        </button>
                      ) : (
                        <MessageSquare className="w-12 h-12 text-neutral-600 mb-2" />
                      )}
                      <p className="text-xs text-neutral-500 mt-4 text-center max-w-xs">
                        {textMode
                          ? "Type your financial question below"
                          : "Tap the microphone and ask something like 'How much did I spend on food?'"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Transcript & Output Display */}
              <div className="space-y-4 my-6">
                {transcript && (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">You asked</span>
                    <p className="text-sm font-medium text-neutral-200">"{transcript}"</p>
                  </div>
                )}

                {response && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex gap-3 items-start"
                  >
                    <Volume2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-purple-400 uppercase tracking-wider block mb-1">Apex Assistant</span>
                      <p className="text-sm text-neutral-100 font-medium leading-relaxed">{response}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Keyboard Fallback / Toggle */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                {textMode ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setTranscript(textQuery);
                      handleSubmitQuery(textQuery);
                      setTextQuery("");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ask anything about your expenses..."
                      value={textQuery}
                      onChange={(e) => setTextQuery(e.target.value)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 text-sm rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !textQuery.trim()}
                      className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                ) : null}

                <div className="flex justify-between items-center text-xs">
                  <button
                    onClick={() => setTextMode(!textMode)}
                    className="text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                  >
                    {textMode ? (
                      <>
                        <Mic className="w-3.5 h-3.5" /> Use Voice
                      </>
                    ) : (
                      <>
                        <Keyboard className="w-3.5 h-3.5" /> Type question
                      </>
                    )}
                  </button>

                  {isListening && (
                    <button
                      onClick={stopListening}
                      className="text-red-400 hover:text-red-300 font-semibold"
                    >
                      Stop listening
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
