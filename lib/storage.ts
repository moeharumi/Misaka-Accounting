import type { Bill } from "@/types/bill";

const KEY = "minimal-ledger:bills";
const BUDGET_KEY = "minimal-ledger:budget";
const ACCOUNTS_KEY = "minimal-ledger:accounts";
const RECURRING_KEY = "minimal-ledger:recurring";

export function loadBills(): Bill[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as Bill[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveBills(bills: Bill[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(bills));
}

export function loadBudget(): number {
  if (typeof window === "undefined") return 2000;
  const raw = window.localStorage.getItem(BUDGET_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

export function saveBudget(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUDGET_KEY, String(n));
}

export interface Account {
  id: string;
  name: string;
}

export interface RecurringBill {
  id: string;
  type: Bill["type"];
  amount: number;
  category: Bill["category"];
  note: string;
  dayOfMonth: number;
  accountId: string;
  lastAppliedMonth?: string;
}

export function loadAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as Account[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: Account[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadRecurring(): RecurringBill[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(RECURRING_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as RecurringBill[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveRecurring(items: RecurringBill[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECURRING_KEY, JSON.stringify(items));
}
