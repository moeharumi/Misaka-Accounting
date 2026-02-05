import type { Bill } from "@/types/bill";

const KEY = "minimal-ledger:bills";
const BUDGET_KEY = "minimal-ledger:budget";

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
