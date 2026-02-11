"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { parseToBill } from "@/lib/parse";
import {
  loadBills,
  saveBills,
  loadBudget,
  saveBudget,
  loadAccounts,
  saveAccounts,
  loadRecurring,
  saveRecurring,
  type Account,
  type RecurringBill
} from "@/lib/storage";
import type { Bill, BillType, CategoryKey } from "@/types/bill";
import {
  Utensils,
  Bus,
  ShoppingBag,
  Film,
  Home,
  MoreHorizontal,
  CalendarDays,
  Sun,
  Moon,
  Trash2,
  Cog,
  Pencil,
  RefreshCcw,
  ArrowLeftRight,
  BadgeDollarSign,
  Wallet
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, X } from "lucide-react";

const categoryIcon: Record<CategoryKey, ComponentType<any>> = {
  餐饮: Utensils,
  交通: Bus,
  购物: ShoppingBag,
  娱乐: Film,
  居家: Home,
  其他: MoreHorizontal,
  工资: BadgeDollarSign,
  奖金: BadgeDollarSign,
  理财: BadgeDollarSign,
  其他收入: BadgeDollarSign,
  转账: ArrowLeftRight
};

const expenseCategories: CategoryKey[] = ["餐饮", "交通", "购物", "娱乐", "居家", "其他"];
const incomeCategories: CategoryKey[] = ["工资", "奖金", "理财", "其他收入"];
const allCategories: CategoryKey[] = [...expenseCategories, ...incomeCategories, "转账"];

export default function Page() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState<number>(2000);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filterType, setFilterType] = useState<"全部" | BillType>("全部");
  const [filterCategory, setFilterCategory] = useState<"全部" | CategoryKey>("全部");
  const [billType, setBillType] = useState<BillType>("expense");
  const [selectedCategory, setSelectedCategory] = useState<"自动" | CategoryKey>("自动");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [editCategory, setEditCategory] = useState<CategoryKey>("其他");
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importText, setImportText] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [bgSeed, setBgSeed] = useState<number>(Date.now());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [recurring, setRecurring] = useState<RecurringBill[]>([]);
  const [recurringType, setRecurringType] = useState<BillType>("expense");
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringNote, setRecurringNote] = useState("");
  const [recurringCategory, setRecurringCategory] = useState<CategoryKey>("餐饮");
  const [recurringDay, setRecurringDay] = useState("1");
  const [recurringAccountId, setRecurringAccountId] = useState("");
  const [exportType, setExportType] = useState<"全部" | BillType>("全部");
  const [exportCategory, setExportCategory] = useState<"全部" | CategoryKey>("全部");
  const [exportAccount, setExportAccount] = useState<"全部" | string>("全部");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");

  const accountMap = useMemo(
    () => new Map(accounts.map((a: Account) => [a.id, a] as [string, Account])),
    [accounts]
  );

  function isValidCategory(value: string): value is CategoryKey {
    return allCategories.includes(value as CategoryKey);
  }

  function normalizeBills(list: Bill[], defaultAccountId: string) {
    return list
      .filter((b: Bill) => b && typeof b.amount === "number")
      .map((b: Bill) => {
        const raw = b as Bill & {
          type?: BillType;
          accountId?: string;
          toAccountId?: string;
          category?: string;
          note?: string;
          date?: string;
        };
        const type: BillType =
          raw.type === "income" || raw.type === "transfer" ? raw.type : "expense";
        const category = raw.category && isValidCategory(raw.category) ? raw.category : "其他";
        const accountId = raw.accountId || defaultAccountId;
        const toAccountId =
          type === "transfer" ? raw.toAccountId || defaultAccountId : undefined;
        return {
          id: raw.id || crypto.randomUUID(),
          amount: Math.round(raw.amount * 100) / 100,
          category,
          note: typeof raw.note === "string" ? raw.note : "",
          date: typeof raw.date === "string" ? raw.date : new Date().toISOString(),
          type,
          accountId,
          toAccountId
        };
      })
      .filter((b: Bill) => Number.isFinite(b.amount) && b.amount > 0);
  }

  function applyRecurringForMonth(
    items: RecurringBill[],
    baseBills: Bill[],
    defaultAccountId: string
  ) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let updated = false;
    let billsNext = baseBills.slice();
    const recurringNext = items.map((item: RecurringBill) => {
      if (item.type === "transfer" || item.lastAppliedMonth === monthKey) return item;
      const day = Math.min(Math.max(1, item.dayOfMonth), daysInMonth);
      const date = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0).toISOString();
      const bill: Bill = {
        id: crypto.randomUUID(),
        amount: item.amount,
        category: item.category,
        note: item.note,
        date,
        type: item.type,
        accountId: item.accountId || defaultAccountId
      };
      billsNext = [bill, ...billsNext];
      updated = true;
      return { ...item, accountId: item.accountId || defaultAccountId, lastAppliedMonth: monthKey };
    });
    return { billsNext, recurringNext, updated };
  }

  useEffect(() => {
    const loadedAccounts = loadAccounts();
    const initialAccounts =
      loadedAccounts.length > 0
        ? loadedAccounts
        : [{ id: crypto.randomUUID(), name: "现金" }];
    if (loadedAccounts.length === 0) saveAccounts(initialAccounts);
    setAccounts(initialAccounts);
    const defaultAccountId = initialAccounts[0]?.id ?? "";
    setAccountId(defaultAccountId);
    setToAccountId(initialAccounts[1]?.id ?? defaultAccountId);
    setRecurringAccountId(defaultAccountId);

    const normalized = normalizeBills(loadBills(), defaultAccountId);
    const loadedRecurring = loadRecurring();
    const { billsNext, recurringNext, updated } = applyRecurringForMonth(
      loadedRecurring,
      normalized,
      defaultAccountId
    );
    const sorted = billsNext.sort(
      (a: Bill, b: Bill) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setBills(sorted);
    saveBills(sorted);
    setRecurring(recurringNext);
    if (updated) saveRecurring(recurringNext);

    setBudget(loadBudget());
    const t =
      (typeof window !== "undefined" &&
        (window.localStorage.getItem("theme") as "light" | "dark" | null)) ||
      null;
    const initial = t ?? "light";
    setTheme(initial);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", initial === "dark");
    }
  }, []);

  useEffect(() => {
    if (billType === "expense") {
      if (selectedCategory !== "自动" && !expenseCategories.includes(selectedCategory as CategoryKey)) {
        setSelectedCategory("自动");
      }
    } else if (billType === "income") {
      if (!incomeCategories.includes(selectedCategory as CategoryKey)) {
        setSelectedCategory("工资");
      }
    } else {
      setSelectedCategory("转账");
    }
  }, [billType, selectedCategory]);

  useEffect(() => {
    if (recurringType === "expense" && !expenseCategories.includes(recurringCategory)) {
      setRecurringCategory("餐饮");
    }
    if (recurringType === "income" && !incomeCategories.includes(recurringCategory)) {
      setRecurringCategory("工资");
    }
  }, [recurringType, recurringCategory]);

  const monthExpenseTotal = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return bills
      .filter((b: Bill) => {
        const d = new Date(b.date);
        return b.type === "expense" && d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((acc: number, b: Bill) => acc + b.amount, 0);
  }, [bills]);

  const monthIncomeTotal = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return bills
      .filter((b: Bill) => {
        const d = new Date(b.date);
        return b.type === "income" && d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((acc: number, b: Bill) => acc + b.amount, 0);
  }, [bills]);

  const leftover = useMemo(
    () => Math.max(budget - monthExpenseTotal, 0),
    [budget, monthExpenseTotal]
  );

  const filteredBills = useMemo(() => {
    const list = bills
      .slice()
      .sort((a: Bill, b: Bill) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list.filter((b: Bill) => {
      if (filterType !== "全部" && b.type !== filterType) return false;
      if (filterCategory !== "全部" && b.category !== filterCategory) return false;
      return true;
    });
  }, [bills, filterType, filterCategory]);

  const visibleBills = useMemo(
    () => filteredBills.slice(0, visibleCount),
    [filteredBills, visibleCount]
  );

  const accountBalances = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a: Account) => map.set(a.id, 0));
    bills.forEach((b: Bill) => {
      if (b.type === "expense") {
        map.set(b.accountId, (map.get(b.accountId) || 0) - b.amount);
      } else if (b.type === "income") {
        map.set(b.accountId, (map.get(b.accountId) || 0) + b.amount);
      } else {
        map.set(b.accountId, (map.get(b.accountId) || 0) - b.amount);
        if (b.toAccountId) {
          map.set(b.toAccountId, (map.get(b.toAccountId) || 0) + b.amount);
        }
      }
    });
    return map;
  }, [accounts, bills]);

  useEffect(() => {
    setFilterCategory("全部");
  }, [filterType]);

  const filterCategoryOptions = useMemo(() => {
    if (filterType === "income") return incomeCategories;
    if (filterType === "expense") return expenseCategories;
    if (filterType === "transfer") return ["转账"] as CategoryKey[];
    return allCategories;
  }, [filterType]);

  const exportCategoryOptions = useMemo(() => {
    if (exportType === "income") return incomeCategories;
    if (exportType === "expense") return expenseCategories;
    if (exportType === "transfer") return ["转账"] as CategoryKey[];
    return allCategories;
  }, [exportType]);

  function addBillFromInput() {
    if (!input.trim()) return;
    const parsed = parseToBill(input);
    if (!parsed) {
      alert("未识别到金额，请尝试如：中午吃面25元");
      return;
    }
    if (!accountId) {
      alert("请先选择账户");
      return;
    }
    if (billType === "transfer") {
      if (!toAccountId || toAccountId === accountId) {
        alert("请选择不同的转入账户");
        return;
      }
    }
    const category =
      billType === "expense"
        ? selectedCategory === "自动"
          ? parsed.category
          : selectedCategory
        : billType === "income"
          ? (selectedCategory as CategoryKey)
          : "转账";
    const bill: Bill = {
      id: crypto.randomUUID(),
      amount: parsed.amount,
      category,
      note: parsed.note,
      date: parsed.date,
      type: billType,
      accountId,
      toAccountId: billType === "transfer" ? toAccountId : undefined
    };
    const next = [bill, ...bills].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setBills(next);
    saveBills(next);
    setInput("");
  }

  function addAccount() {
    const name = newAccountName.trim();
    if (!name) return;
    if (accounts.some((a: Account) => a.name === name)) {
      alert("账户已存在");
      return;
    }
    const next = [...accounts, { id: crypto.randomUUID(), name }];
    setAccounts(next);
    saveAccounts(next);
    if (!accountId) setAccountId(next[0].id);
    setNewAccountName("");
  }

  function removeAccount(id: string) {
    if (bills.some((b: Bill) => b.accountId === id || b.toAccountId === id)) {
      alert("该账户已有账单或转账记录，无法删除");
      return;
    }
    const next = accounts.filter((a: Account) => a.id !== id);
    setAccounts(next);
    saveAccounts(next);
    if (accountId === id) setAccountId(next[0]?.id ?? "");
    if (toAccountId === id) setToAccountId(next[0]?.id ?? "");
    if (recurringAccountId === id) setRecurringAccountId(next[0]?.id ?? "");
  }

  function addRecurring() {
    const n = Number(recurringAmount);
    if (!Number.isFinite(n) || n <= 0) {
      alert("请输入有效金额");
      return;
    }
    const day = Number(recurringDay);
    if (!Number.isFinite(day) || day <= 0) {
      alert("请输入有效日期");
      return;
    }
    if (!recurringAccountId) {
      alert("请选择账户");
      return;
    }
    const type = recurringType === "transfer" ? "expense" : recurringType;
    const item: RecurringBill = {
      id: crypto.randomUUID(),
      type,
      amount: Math.round(n * 100) / 100,
      category: recurringCategory,
      note: recurringNote.trim(),
      dayOfMonth: Math.min(Math.max(1, Math.floor(day)), 31),
      accountId: recurringAccountId
    };
    const next = [item, ...recurring];
    setRecurring(next);
    saveRecurring(next);
    setRecurringAmount("");
    setRecurringNote("");
  }

  function removeRecurring(id: string) {
    const next = recurring.filter((r: RecurringBill) => r.id !== id);
    setRecurring(next);
    saveRecurring(next);
  }

  function deleteBill(id: string) {
    const next = bills.filter((b: Bill) => b.id !== id);
    setBills(next);
    saveBills(next);
  }

  function startEdit(b: Bill) {
    setEditingId(b.id);
    setEditAmount(String(b.amount));
    setEditNote(b.note);
    setEditCategory(b.category);
  }
  function cancelEdit() {
    setEditingId(null);
  }
  function saveEdit() {
    if (!editingId) return;
    const n = Number(editAmount);
    if (!Number.isFinite(n) || n <= 0) {
      alert("请输入有效的金额");
      return;
    }
    const next = bills
      .map((b: Bill) =>
        b.id === editingId
          ? {
              ...b,
              amount: Math.round(n * 100) / 100,
              note: editNote,
              category: b.type === "transfer" ? "转账" : editCategory
            }
          : b
      )
      .sort((a: Bill, b: Bill) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBills(next);
    saveBills(next);
    setEditingId(null);
  }

  function getExportBills() {
    const start = exportStart ? new Date(`${exportStart}T00:00:00`) : null;
    const end = exportEnd ? new Date(`${exportEnd}T23:59:59`) : null;
    return bills.filter((b: Bill) => {
      if (exportType !== "全部" && b.type !== exportType) return false;
      if (exportCategory !== "全部" && b.category !== exportCategory) return false;
      if (exportAccount !== "全部") {
        if (b.type === "transfer") {
          if (b.accountId !== exportAccount && b.toAccountId !== exportAccount) return false;
        } else if (b.accountId !== exportAccount) {
          return false;
        }
      }
      const d = new Date(b.date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }

  function exportJson() {
    const exportBills = getExportBills();
    const usedAccountIds = new Set<string>();
    exportBills.forEach((b: Bill) => {
      usedAccountIds.add(b.accountId);
      if (b.toAccountId) usedAccountIds.add(b.toAccountId);
    });
    const exportAccounts = accounts.filter((a: Account) => usedAccountIds.has(a.id));
    const exportRecurring = recurring.filter((r: RecurringBill) => {
      if (exportType !== "全部" && r.type !== exportType) return false;
      if (exportCategory !== "全部" && r.category !== exportCategory) return false;
      if (exportAccount !== "全部" && r.accountId !== exportAccount) return false;
      return true;
    });
    const data = { version: 2, budget, bills: exportBills, accounts: exportAccounts, recurring: exportRecurring };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const exportBills = getExportBills();
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["日期", "类型", "金额", "分类", "账户", "转入账户", "备注"],
      ...exportBills.map((b: Bill) => {
        const date = new Date(b.date).toLocaleDateString("zh-CN");
        const typeLabel =
          b.type === "expense" ? "支出" : b.type === "income" ? "收入" : "转账";
        const accountName = accountMap.get(b.accountId)?.name || "";
        const toAccountName = b.toAccountId ? accountMap.get(b.toAccountId)?.name || "" : "";
        return [
          date,
          typeLabel,
          b.amount.toFixed(2),
          b.category,
          accountName,
          toAccountName,
          b.note
        ];
      })
    ]
      .map((row) => row.map((cell: string) => escape(String(cell))).join(","))
      .join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    const exportBills = getExportBills();
    const escape = (value: string) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const rows = exportBills
      .map((b: Bill) => {
        const date = new Date(b.date).toLocaleDateString("zh-CN");
        const typeLabel =
          b.type === "expense" ? "支出" : b.type === "income" ? "收入" : "转账";
        const accountName = accountMap.get(b.accountId)?.name || "";
        const toAccountName = b.toAccountId ? accountMap.get(b.toAccountId)?.name || "" : "";
        return [
          date,
          typeLabel,
          b.amount.toFixed(2),
          b.category,
          accountName,
          toAccountName,
          b.note
        ];
      })
      .map((row: string[]) => `<tr>${row.map((cell: string) => `<td>${escape(cell)}</td>`).join("")}</tr>`)
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr>${[
      "日期",
      "类型",
      "金额",
      "分类",
      "账户",
      "转入账户",
      "备注"
    ]
      .map((h) => `<th>${h}</th>`)
      .join("")}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyImport() {
    try {
      const obj = JSON.parse(importText) as {
        version?: number;
        budget?: number;
        bills?: Bill[];
        accounts?: Account[];
        recurring?: RecurringBill[];
      };
      if (!obj || !Array.isArray(obj.bills)) {
        alert("格式不正确");
        return;
      }
      const incomingAccounts = Array.isArray(obj.accounts)
        ? obj.accounts.filter((a) => a && typeof a.id === "string" && typeof a.name === "string")
        : [];
      const accountsNext =
        incomingAccounts.length > 0
          ? incomingAccounts
          : accounts.length > 0
            ? accounts
            : [{ id: crypto.randomUUID(), name: "现金" }];
      setAccounts(accountsNext);
      saveAccounts(accountsNext);
      setAccountId(accountsNext[0]?.id ?? "");
      setToAccountId(accountsNext[1]?.id ?? accountsNext[0]?.id ?? "");
      setRecurringAccountId(accountsNext[0]?.id ?? "");

      const normalized = normalizeBills(obj.bills, accountsNext[0]?.id ?? "");
      const sorted = normalized.sort((a: Bill, b: Bill) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBills(sorted);
      saveBills(sorted);
      if (Array.isArray(obj.recurring)) {
        const recurringNext = obj.recurring
          .filter((r: RecurringBill) => r && typeof r.id === "string" && typeof r.amount === "number")
          .map((r: RecurringBill) => ({
            id: r.id,
            type: r.type === "income" ? "income" : "expense",
            amount: Math.round(r.amount * 100) / 100,
            category: r.category && isValidCategory(r.category) ? r.category : "其他",
            note: typeof r.note === "string" ? r.note : "",
            dayOfMonth: Math.min(Math.max(1, Math.floor(r.dayOfMonth || 1)), 31),
            accountId: r.accountId || accountsNext[0]?.id || ""
          })) as RecurringBill[];
        setRecurring(recurringNext);
        saveRecurring(recurringNext);
      }
      if (typeof obj.budget === "number" && obj.budget > 0) {
        setBudget(obj.budget);
        saveBudget(obj.budget);
      }
      setShowImport(false);
      setImportText("");
    } catch {
      alert("解析失败");
    }
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", next);
    }
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
  }

  function openBudgetEdit() {
    setEditingBudget(true);
    setBudgetInput(String(budget));
  }
  function confirmBudget() {
    const n = Number(budgetInput);
    if (!Number.isFinite(n) || n <= 0) {
      alert("请输入有效的预算数字");
      return;
    }
    setBudget(n);
    saveBudget(n);
    setEditingBudget(false);
  }

  return (
    <div className="space-y-6">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://www.loliapi.com/acg/?t=${bgSeed})`
          }}
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold tracking-tight">御坂记账</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowExport((v) => !v)}>
              <Download className="h-4 w-4" />
              <span className="ml-1">导出</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4" />
              <span className="ml-1">导入</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setBgSeed(Date.now())}>
              <RefreshCcw className="h-4 w-4" />
              <span className="ml-1">换背景</span>
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="切换主题">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
      {showExport && (
        <Card className="bg-card">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">导出数据</div>
              <Button variant="ghost" size="sm" onClick={() => setShowExport(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as any)}
              >
                <option value="全部">全部类型</option>
                <option value="expense">支出</option>
                <option value="income">收入</option>
                <option value="transfer">转账</option>
              </Select>
              <Select
                value={exportCategory}
                onChange={(e) => setExportCategory(e.target.value as any)}
              >
                <option value="全部">全部分类</option>
                {exportCategoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select
                value={exportAccount}
                onChange={(e) => setExportAccount(e.target.value)}
              >
                <option value="全部">全部账户</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                />
                <Input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={exportJson}>
                导出 JSON
              </Button>
              <Button size="sm" variant="ghost" onClick={exportCsv}>
                导出 CSV
              </Button>
              <Button size="sm" variant="ghost" onClick={exportExcel}>
                导出 Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {showImport && (
        <Card className="bg-card">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">导入数据</div>
              <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3">
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='粘贴导出的 JSON'
              />
            </div>
            <div className="mt-3">
              <Button size="sm" onClick={applyImport}>
                应用
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <header className="grid grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent>
            <div className="text-xs text-muted-foreground">本月总支出</div>
            <div className="mt-2 text-3xl font-semibold">
              ￥{monthExpenseTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent>
            <div className="text-xs text-muted-foreground">本月总收入</div>
            <div className="mt-2 text-3xl font-semibold">
              ￥{monthIncomeTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">剩余预算</div>
              <Button variant="ghost" size="sm" onClick={openBudgetEdit} aria-label="设置预算">
                <Cog className="h-4 w-4" />
              </Button>
            </div>
            <div className={`mt-2 text-3xl font-semibold ${monthExpenseTotal > budget ? "text-red-500" : ""}`}>￥{leftover.toFixed(2)}</div>
            {editingBudget && (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="输入月预算，如 2000"
                />
                <Button size="sm" onClick={confirmBudget}>
                  保存
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4" />
          账户
        </div>
        <div className="grid grid-cols-2 gap-3">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="text-sm">{a.name}</div>
                  <div className="text-xs text-muted-foreground">余额</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">￥{(accountBalances.get(a.id) || 0).toFixed(2)}</div>
                  <Button variant="ghost" size="sm" onClick={() => removeAccount(a.id)}>
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="新增账户名称"
          />
          <Button size="sm" onClick={addAccount}>
            添加
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={billType === "expense" ? "default" : "ghost"}
              onClick={() => setBillType("expense")}
            >
              支出
            </Button>
            <Button
              size="sm"
              variant={billType === "income" ? "default" : "ghost"}
              onClick={() => setBillType("income")}
            >
              收入
            </Button>
            <Button
              size="sm"
              variant={billType === "transfer" ? "default" : "ghost"}
              onClick={() => setBillType("transfer")}
            >
              转账
            </Button>
          </div>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-28">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          {billType === "transfer" && (
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-28">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  转入 {a.name}
                </option>
              ))}
            </Select>
          )}
          {billType !== "transfer" && (
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-28"
            >
              {billType === "expense" && <option value="自动">自动</option>}
              {(billType === "expense" ? expenseCategories : incomeCategories).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={billType === "transfer" ? "输入转账金额" : "输入：中午吃面25元"}
            onKeyDown={(e) => {
              if (e.key === "Enter") addBillFromInput();
            }}
          />
          <Button onClick={addBillFromInput}>保存</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          支持自然语言金额识别，收入与转账也可直接输入金额与备注
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-sm text-muted-foreground">周期账单</div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={recurringType}
            onChange={(e) => setRecurringType(e.target.value as any)}
            className="w-24"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </Select>
          <Select
            value={recurringCategory}
            onChange={(e) => setRecurringCategory(e.target.value as CategoryKey)}
            className="w-28"
          >
            {(recurringType === "expense" ? expenseCategories : incomeCategories).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={recurringAccountId}
            onChange={(e) => setRecurringAccountId(e.target.value)}
            className="w-28"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            step="0.01"
            value={recurringAmount}
            onChange={(e) => setRecurringAmount(e.target.value)}
            placeholder="金额"
            className="w-24"
          />
          <Input
            type="number"
            value={recurringDay}
            onChange={(e) => setRecurringDay(e.target.value)}
            placeholder="每月几号"
            className="w-24"
          />
          <Input
            value={recurringNote}
            onChange={(e) => setRecurringNote(e.target.value)}
            placeholder="备注"
            className="w-32"
          />
          <Button size="sm" onClick={addRecurring}>
            添加
          </Button>
        </div>
        <div className="space-y-2">
          {recurring.length === 0 ? (
            <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
              暂无周期账单
            </div>
          ) : (
            recurring.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm">
                    {r.type === "income" ? "收入" : "支出"} · {r.category} · 每月{r.dayOfMonth}号 ·{" "}
                    {accountMap.get(r.accountId)?.name || "账户"}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">￥{r.amount.toFixed(2)}</div>
                    <Button variant="ghost" size="sm" onClick={() => removeRecurring(r.id)}>
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          最近账单
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { label: "全部", value: "全部" },
            { label: "支出", value: "expense" },
            { label: "收入", value: "income" },
            { label: "转账", value: "transfer" }
          ] as const).map((t) => (
            <Button
              key={t.label}
              variant="ghost"
              size="sm"
              onClick={() => setFilterType(t.value as any)}
              className={filterType === t.value ? "bg-muted" : ""}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterCategory("全部")}
            className={filterCategory === "全部" ? "bg-muted" : ""}
          >
            全部
          </Button>
          {filterCategoryOptions.map((c) => (
            <Button
              key={c}
              variant="ghost"
              size="sm"
              onClick={() => setFilterCategory(c)}
              className={filterCategory === c ? "bg-muted" : ""}
            >
              {c}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          {visibleBills.length === 0 ? (
            <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
              暂无数据，试试在输入框按回车
            </div>
          ) : (
            visibleBills.map((b) => {
              const Icon = categoryIcon[b.category];
              const date = new Date(b.date);
              const dateStr = date.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
              });
              const amountText =
                b.type === "income"
                  ? `+￥${b.amount.toFixed(2)}`
                  : b.type === "expense"
                    ? `-￥${b.amount.toFixed(2)}`
                    : `￥${b.amount.toFixed(2)}`;
              const amountClass =
                b.type === "income" ? "text-emerald-600" : b.type === "transfer" ? "text-muted-foreground" : "";
              const fromName = accountMap.get(b.accountId)?.name || "账户";
              const toName = b.toAccountId ? accountMap.get(b.toAccountId)?.name || "账户" : "";
              const accountInfo = b.type === "transfer" ? `${fromName} → ${toName}` : fromName;
              const editCategories = b.type === "income" ? incomeCategories : expenseCategories;
              return (
                <Card key={b.id}>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{b.type === "transfer" ? "转账" : b.category}</div>
                        {editingId === b.id ? (
                          <div className="mt-2 flex items-center gap-2">
                            {b.type !== "transfer" && (
                              <Select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as CategoryKey)}
                                className="w-24"
                              >
                                {editCategories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </Select>
                            )}
                            <Input
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="备注"
                              className="w-40"
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {b.note ? b.note : accountInfo}
                            {b.note && <div className="text-xs text-muted-foreground">{accountInfo}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    {editingId === b.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24"
                        />
                        <Button size="sm" onClick={saveEdit}>
                          保存
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                          取消
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${amountClass}`}>{amountText}</div>
                          <div className="text-xs text-muted-foreground">{dateStr}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="编辑账单"
                          onClick={() => startEdit(b)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="删除账单"
                          onClick={() => deleteBill(b.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>
      <section className="space-y-3">
        <div className="text-sm text-muted-foreground">分类汇总（本月支出）</div>
        <div className="grid grid-cols-2 gap-3">
          {expenseCategories.map((c) => {
            const total = bills
              .filter((b) => {
                const d = new Date(b.date);
                const now = new Date();
                return (
                  d.getFullYear() === now.getFullYear() &&
                  d.getMonth() === now.getMonth() &&
                  b.type === "expense" &&
                  b.category === c
                );
              })
              .reduce((acc, b) => acc + b.amount, 0);
            return (
              <Card key={c}>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm">{c}</div>
                  <div className="text-sm font-semibold">￥{total.toFixed(2)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
      <section className="space-y-3">
        <div className="text-sm text-muted-foreground">月度趋势</div>
        <Card>
          <CardContent>
            <div className="flex items-end gap-1 h-24">
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const days = new Date(year, month + 1, 0).getDate();
                const totals: number[] = Array.from({ length: days }, (_, i) => {
                  const day = i + 1;
                  return bills
                    .filter((b) => {
                      const d = new Date(b.date);
                      return (
                        d.getFullYear() === year &&
                        d.getMonth() === month &&
                        d.getDate() === day &&
                        b.type === "expense"
                      );
                    })
                    .reduce((acc, b) => acc + b.amount, 0);
                });
                const max = Math.max(0, ...totals);
                return totals.map((v, i) => (
                  <div
                    key={i}
                    className="w-2 rounded bg-muted"
                    style={{ height: max ? `${(v / max) * 100}%` : "2px" }}
                    title={`${i + 1}日 ￥${v.toFixed(2)}`}
                  />
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </section>
      <div className="flex justify-center">
        {filteredBills.length > visibleCount && (
          <Button variant="ghost" size="sm" onClick={() => setVisibleCount((c) => c + 10)}>
            加载更多
          </Button>
        )}
      </div>
    </div>
  );
}
