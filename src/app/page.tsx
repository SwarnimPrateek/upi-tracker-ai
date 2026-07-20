"use client";

import React, { useState, useEffect } from "react";
import { useExpenseStore, Transaction, TransactionCategory } from "@/lib/store";
import UploadZone from "@/components/UploadZone";
import DashboardCharts from "@/components/DashboardCharts";
import VoiceAssistantModal from "@/components/VoiceAssistantModal";
import {
  Utensils,
  ShoppingBag,
  Receipt,
  Car,
  HelpCircle,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  Copy,
  Check,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { transactions, deleteTransaction, clearAllData, addTransaction } = useExpenseStore();
  const [mounted, setMounted] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="text-sm text-neutral-500 animate-pulse">Initializing Dashboard...</div>
      </div>
    );
  }

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const txDate = new Date(t.transaction_date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const totalSpentThisMonth = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by category for statistics
  const categoryTotals = transactions.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    },
    {} as Record<TransactionCategory, number>
  );

  const categoriesList: { category: TransactionCategory; label: string; icon: any; color: string; bg: string }[] = [
    { category: "Food", label: "Food & Dining", icon: Utensils, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { category: "Shopping", label: "Shopping", icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { category: "Bills", label: "Utilities & Bills", icon: Receipt, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    { category: "Travel", label: "Travel & Transport", icon: Car, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { category: "Others", label: "Others", icon: HelpCircle, color: "text-neutral-400", bg: "bg-neutral-500/10 border-neutral-500/20" },
  ];

  const handleCopyRef = (refNum: string, id: string) => {
    navigator.clipboard.writeText(refNum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadDemoData = () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split("T")[0];
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split("T")[0];

    const demoItems = [
      { amount: 150.0, merchant: "Zomato Restaurant", category: "Food" as const, transaction_date: today, reference_number: "TXN918237912837" },
      { amount: 2499.0, merchant: "Nike Store", category: "Shopping" as const, transaction_date: yesterday, reference_number: "TXN738192837492" },
      { amount: 560.5, merchant: "Uber Cab", category: "Travel" as const, transaction_date: yesterday, reference_number: "TXN483920192837" },
      { amount: 1240.0, merchant: "Airtel Fiber Bill", category: "Bills" as const, transaction_date: twoDaysAgo, reference_number: "TXN291038102938" },
      { amount: 80.0, merchant: "Chai Point", category: "Food" as const, transaction_date: threeDaysAgo, reference_number: "TXN102938471928" },
    ];

    demoItems.forEach((item) => addTransaction(item));
  };

  return (
    <div className="flex-1 w-full max-w-full min-h-screen bg-[#070709] relative pb-20 overflow-x-hidden">
      {/* Dynamic background highlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* Header section */}
      <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#070709]/70 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-wider bg-clip-text">
                APEX
              </span>
              <span className="text-[10px] text-purple-400 font-semibold block tracking-widest mt-[-2px] uppercase">
                Expense Tracker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {transactions.length === 0 && (
              <button
                onClick={handleLoadDemoData}
                className="text-xs px-3.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Load Demo Data
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear all local transaction data?")) {
                  clearAllData();
                }
              }}
              className="text-xs px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 text-neutral-400 font-medium transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Stats & Upload */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Hero Spending Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full rounded-3xl p-6 overflow-hidden glass-card glow-purple"
          >
            <div className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/[0.04] border border-white/5">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>

            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest block">
              Spent This Month
            </span>
            <h1 className="text-4xl font-extrabold text-white mt-2 tracking-tight text-glow">
              ₹{totalSpentThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h1>
            <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              For {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>

            {/* Quick breakdown metrics */}
            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-white/5">
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase font-medium">All-Time</span>
                <span className="text-sm font-semibold text-neutral-200 block mt-0.5">
                  ₹{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase font-medium">Total Items</span>
                <span className="text-sm font-semibold text-neutral-200 block mt-0.5">
                  {transactions.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase font-medium">Month Items</span>
                <span className="text-sm font-semibold text-neutral-200 block mt-0.5">
                  {monthTransactions.length}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Upload Screenshot Dropzone */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <UploadZone />
          </motion.div>

          {/* Categories Grid Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 space-y-4"
          >
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
              Category Breakdown
            </h3>
            <div className="space-y-3">
              {categoriesList.map((catObj) => {
                const total = categoryTotals[catObj.category] || 0;
                const percentage = transactions.length > 0 
                  ? (total / transactions.reduce((sum, t) => sum + t.amount, 0)) * 100 
                  : 0;

                return (
                  <div key={catObj.category} className="flex items-center justify-between gap-4 p-2 rounded-2xl bg-white/[0.01] border border-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${catObj.bg}`}>
                        <catObj.icon className={`w-4 h-4 ${catObj.color}`} />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-neutral-200 block">{catObj.label}</span>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {percentage.toFixed(0)}% of total
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-neutral-100">
                      ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Charts & List */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Spending Charts */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <DashboardCharts />
          </motion.div>

          {/* Recent Transactions List */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-3xl border border-white/5 bg-white/[0.01] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                Recent Transactions
              </h3>
              <span className="text-[10px] text-neutral-500 font-semibold px-2 py-0.5 bg-neutral-900 rounded border border-white/5">
                Local Database
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {transactions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <FolderOpen className="w-10 h-10 text-neutral-600 mb-2" />
                    <p className="text-sm text-neutral-500 max-w-xs">
                      No transactions recorded. Generate demo data or drop a screenshot above to begin!
                    </p>
                  </motion.div>
                ) : (
                  transactions.map((tx, idx) => {
                    const catInfo = categoriesList.find((c) => c.category === tx.category) || categoriesList[4];

                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Category Icon */}
                          <div className={`p-3 rounded-xl border shrink-0 ${catInfo.bg}`}>
                            <catInfo.icon className={`w-4 h-4 ${catInfo.color}`} />
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-neutral-200 truncate pr-2">
                              {tx.merchant}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-neutral-500">
                              <span>
                                {new Date(tx.transaction_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              {tx.reference_number && (
                                <>
                                  <span className="text-neutral-700">•</span>
                                  <span className="flex items-center gap-1 font-mono text-[10px] tracking-tight bg-neutral-950 px-1.5 py-0.2 rounded border border-white/5">
                                    Ref: {tx.reference_number.substring(0, 8)}...
                                    <button
                                      onClick={() => handleCopyRef(tx.reference_number!, tx.id)}
                                      className="text-neutral-500 hover:text-white p-0.5 transition-colors"
                                    >
                                      {copiedId === tx.id ? (
                                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5" />
                                      )}
                                    </button>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-white block">
                              ₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            {tx.screenshot_url && (
                              <button
                                onClick={() => setSelectedScreenshot(tx.screenshot_url!)}
                                className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold mt-0.5 flex items-center gap-1 transition-colors"
                              >
                                <ImageIcon className="w-3 h-3" /> View receipt
                              </button>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Voice Assistant FAB & Modal Overlay */}
      <VoiceAssistantModal />

      {/* Lightbox for screenshots */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedScreenshot(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg max-h-[85vh] w-full rounded-2xl overflow-hidden border border-white/10"
            >
              {/* Close receipt button */}
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white font-medium hover:bg-black/80 transition-colors"
              >
                Close Receipt
              </button>
              
              {/* Embedded Base64 Image */}
              <img
                src={selectedScreenshot}
                alt="UPI Receipt Screenshot"
                className="w-full h-auto object-contain max-h-[80vh]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
