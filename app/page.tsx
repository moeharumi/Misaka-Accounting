"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { parseToBill } from "@/lib/parse";
import { loadBills, saveBills, loadBudget, saveBudget } from "@/lib/storage";
import type { Bill, CategoryKey } from "@/types/bill";
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
  RefreshCcw
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, X } from "lucide-react";

const categoryIcon: Record<CategoryKey, React.ComponentType<any>> = {
  餐饮: Utensils,
  交通: Bus,
  购物: ShoppingBag,
  娱乐: Film,
  居家: Home,
  其他: MoreHorizontal
};

export default function Page() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState<number>(2000);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filter, setFilter] = useState<"全部" | CategoryKey>("全部");
  const categories: CategoryKey[] = ["餐饮", "交通", "购物", "娱乐", "居家", "其他"];
  const [selectedCategory, setSelectedCategory] = useState<"自动" | CategoryKey>("自动");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [editCategory, setEditCategory] = useState<CategoryKey>("其他");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [bgSeed, setBgSeed] = useState<number>(Date.now());

  useEffect(() => {
    setBills(loadBills());
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

  const monthTotal = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return bills
      .filter((b) => {
        const d = new Date(b.date);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((acc, b) => acc + b.amount, 0);
  }, [bills]);

  const leftover = useMemo(() => Math.max(budget - monthTotal, 0), [budget, monthTotal]);

  const filteredBills = useMemo(() => {
    const list = bills
      .slice()
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    if (filter === "全部") return list;
    return list.filter((b) => b.category === filter);
  }, [bills, filter]);

  function addBillFromInput() {
    if (!input.trim()) return;
    const parsed = parseToBill(input);
    if (!parsed) {
      alert("未识别到金额，请尝试如：中午吃面25元");
      return;
    }
    const bill: Bill = {
      id: crypto.randomUUID(),
      ...parsed,
      category: selectedCategory === "自动" ? parsed.category : selectedCategory
    };
    const next = [bill, ...bills].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setBills(next);
    saveBills(next);
    setInput("");
  }

  function deleteBill(id: string) {
    const next = bills.filter((b) => b.id !== id);
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
      .map((b) =>
        b.id === editingId
          ? { ...b, amount: Math.round(n * 100) / 100, note: editNote, category: editCategory }
          : b
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBills(next);
    saveBills(next);
    setEditingId(null);
  }

  function exportData() {
    const data = { version: 1, budget, bills };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyImport() {
    try {
      const obj = JSON.parse(importText) as { version?: number; budget?: number; bills?: Bill[] };
      if (!obj || !Array.isArray(obj.bills)) {
        alert("格式不正确");
        return;
      }
      const cleaned = obj.bills
        .filter((b) => b && typeof b.id === "string" && typeof b.amount === "number" && typeof b.category === "string" && typeof b.date === "string")
        .map((b) => ({ ...b, note: typeof b.note === "string" ? b.note : "" })) as Bill[];
      const sorted = cleaned.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBills(sorted);
      saveBills(sorted);
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
            backgroundImage: `url(https://acg.yaohud.cn/dm/adaptive.php?t=${bgSeed})`
          }}
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold tracking-tight">御坂记账</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={exportData}>
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
      <header className="grid grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent>
            <div className="text-xs text-muted-foreground">本月总支出</div>
            <div className="mt-2 text-3xl font-semibold">
              ￥{monthTotal.toFixed(2)}
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
            <div className={`mt-2 text-3xl font-semibold ${monthTotal > budget ? "text-red-500" : ""}`}>￥{leftover.toFixed(2)}</div>
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

      <section>
        <div className="flex items-center gap-2">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="w-28"
          >
            <option value="自动">自动</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入：中午吃面25元"
            onKeyDown={(e) => {
              if (e.key === "Enter") addBillFromInput();
            }}
          />
          <Button onClick={addBillFromInput}>保存</Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          支持自然语言记账：如“晚上电影票60元”、“地铁5元”
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          最近账单
        </div>
        <div className="flex flex-wrap gap-2">
          {(["全部", "餐饮", "交通", "购物", "娱乐", "居家", "其他"] as const).map((c) => (
            <Button
              key={c}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(c as any)}
              className={filter === c ? "bg-muted" : ""}
            >
              {c}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          {filteredBills.length === 0 ? (
            <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
              暂无数据，试试在输入框按回车
            </div>
          ) : (
            filteredBills.map((b) => {
              const Icon = categoryIcon[b.category];
              const date = new Date(b.date);
              const dateStr = date.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
              });
              return (
                <Card key={b.id}>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{b.category}</div>
                        {editingId === b.id ? (
                          <div className="mt-2 flex items-center gap-2">
                            <Select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as CategoryKey)}
                              className="w-24"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </Select>
                            <Input
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="备注"
                              className="w-40"
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">{b.note}</div>
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
                          <div className="text-sm font-semibold">￥{b.amount.toFixed(2)}</div>
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
        <div className="text-sm text-muted-foreground">分类汇总（本月）</div>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => {
            const total = bills
              .filter((b) => {
                const d = new Date(b.date);
                const now = new Date();
                return (
                  d.getFullYear() === now.getFullYear() &&
                  d.getMonth() === now.getMonth() &&
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
                      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
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
