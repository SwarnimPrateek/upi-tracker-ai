import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransactionCategory = 'Food' | 'Shopping' | 'Bills' | 'Travel' | 'Others';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: TransactionCategory;
  transaction_date: string; // YYYY-MM-DD
  reference_number: string | null;
  screenshot_url?: string; // Base64 data url
  created_at: string;
}

interface ExpenseStore {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => { success: boolean; error?: string; transaction?: Transaction };
  deleteTransaction: (id: string) => void;
  clearAllData: () => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (tx) => {
        const transactions = get().transactions;

        // Graceful deduplication check if reference_number is provided
        if (tx.reference_number) {
          const isDuplicate = transactions.some(
            (t) => t.reference_number?.trim() === tx.reference_number?.trim()
          );
          if (isDuplicate) {
            return {
              success: false,
              error: `Transaction with Reference No. ${tx.reference_number} already exists.`,
            };
          }
        }

        const newTx: Transaction = {
          ...tx,
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
        };

        set({
          transactions: [newTx, ...transactions], // Prepend to show most recent first
        });

        return { success: true, transaction: newTx };
      },
      deleteTransaction: (id) => {
        set({
          transactions: get().transactions.filter((t) => t.id !== id),
        });
      },
      clearAllData: () => {
        set({ transactions: [] });
      },
    }),
    {
      name: 'upi-tracker-expenses', // Name of the storage key in localStorage
    }
  )
);
