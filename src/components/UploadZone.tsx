"use client";

import React, { useState, useRef } from "react";
import { useExpenseStore, TransactionCategory } from "@/lib/store";
import { extractTransactionFromImage } from "@/actions/gemini";
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export default function UploadZone() {
  const addTransaction = useExpenseStore((state) => state.addTransaction);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please upload an image file (PNG, JPG, JPEG).");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setExtractedResult(null);

    try {
      // 1. Convert to Base64
      const base64Data = await fileToBase64(file);

      // 2. Call Server Action
      const result = await extractTransactionFromImage(base64Data);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Gemini vision failed to extract details.");
      }

      const extractedList = result.data;
      if (!Array.isArray(extractedList) || extractedList.length === 0) {
        throw new Error("No transactions found in this screenshot.");
      }

      let addedCount = 0;
      let duplicateCount = 0;
      let lastSavedTx = null;

      for (const extracted of extractedList) {
        const amount = extracted.amount ? Number(extracted.amount) : 0;
        const merchant = extracted.merchant || "Unknown Merchant";
        const category = (extracted.category || "Others") as TransactionCategory;
        const transaction_date = extracted.date || new Date().toISOString().split("T")[0];
        const reference_number = extracted.reference_number || null;

        const storeResult = addTransaction({
          amount,
          merchant,
          category,
          transaction_date,
          reference_number,
          screenshot_url: base64Data, // Save base64 image in store for display
        });

        if (storeResult.success) {
          addedCount++;
          lastSavedTx = storeResult.transaction;
        } else {
          duplicateCount++;
        }
      }

      if (addedCount === 0) {
        throw new Error(
          duplicateCount > 0
            ? `All ${duplicateCount} transactions already exist (duplicates skipped).`
            : "Failed to save transactions."
        );
      }

      // Trigger Confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#a855f7", "#3b82f6", "#10b981"],
      });

      setExtractedResult({
        count: addedCount,
        duplicates: duplicateCount,
        lastSaved: lastSavedTx
      });
      setStatus("success");
      
      // Return to idle after a few seconds
      setTimeout(() => {
        setStatus("idle");
        setExtractedResult(null);
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 min-h-[220px] text-center ${
          isDragActive
            ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
            : status === "loading"
            ? "border-neutral-700 bg-neutral-900/20 cursor-wait"
            : status === "success"
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
          disabled={status === "loading"}
        />

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="p-4 rounded-full bg-white/[0.04] border border-white/5 mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-200 text-lg mb-1">
                Upload UPI Screenshot
              </h3>
              <p className="text-sm text-neutral-400 max-w-xs">
                Drag and drop your screenshot here, or click to browse files
              </p>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-4 bg-neutral-900 px-2 py-0.5 rounded border border-white/5">
                PNG, JPG or JPEG
              </span>
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
              <h3 className="font-semibold text-neutral-200 text-lg mb-1">
                Analyzing Screenshot...
              </h3>
              <p className="text-sm text-neutral-400 max-w-xs">
                Gemini Vision is parsing UPI receipt details on the server
              </p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-emerald-400 text-lg mb-1">
                Transaction Extracted!
              </h3>
              {extractedResult && (
                <div className="mt-2 text-sm text-neutral-300 bg-neutral-950/50 border border-white/5 px-4 py-2 rounded-xl backdrop-blur">
                  {extractedResult.count > 1 ? (
                    <div>
                      <div className="font-medium text-white">Extracted {extractedResult.count} Transactions</div>
                      {extractedResult.duplicates > 0 && (
                        <div className="text-neutral-400 text-xs mt-0.5">
                          ({extractedResult.duplicates} duplicates skipped)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-white">{extractedResult.lastSaved?.merchant}</div>
                      <div className="text-neutral-400 mt-0.5 text-xs">
                        ₹{extractedResult.lastSaved?.amount?.toFixed(2)} • {extractedResult.lastSaved?.category}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="font-semibold text-red-400 text-lg mb-1">
                Failed to process
              </h3>
              <p className="text-xs text-neutral-400 max-w-xs mb-3">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus("idle");
                }}
                className="text-xs px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white rounded-md"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
