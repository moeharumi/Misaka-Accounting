import type { Bill, CategoryKey } from "@/types/bill";

const categoryKeywords: Record<CategoryKey, string[]> = {
    餐饮: ["吃", "餐", "饭", "面", "早餐", "午餐", "晚餐", "奶茶", "咖啡"],
    交通: ["公交", "地铁", "打车", "滴滴", "车票", "出行", "出租"],
    购物: ["买", "购物", "京东", "淘宝", "拼多多", "衣服", "鞋"],
    娱乐: ["电影", "游戏", "会员", "KTV", "娱乐", "音乐"],
    居家: ["家", "水电", "燃气", "超市", "日用品", "物业", "维修"],
    其他: ["其他", "杂项", "未知"]
};

function detectCategory(text: string): CategoryKey {
    const t = text.toLowerCase();
    for (const [cat, keys] of Object.entries(categoryKeywords) as [
        CategoryKey,
        string[]
    ][]) {
        if (keys.some((k) => t.includes(k))) return cat;
    }
    return "其他";
}

function extractAmount(text: string): number | null {
    // 支持：25、25.5、￥25、25元
    const m =
        text.match(/([￥¥]?\s*\d+(?:[.,]\d{1,2})?)(?:\s*元)?/) ||
        text.match(/(?:金额|价|付)\s*(\d+(?:[.,]\d{1,2})?)/);
    if (!m) return null;
    const num = m[1].replace(/[￥¥\s]/g, "").replace(",", ".");
    const n = Number(num);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export function parseToBill(input: string): Omit<Bill, "id"> | null {
    const amount = extractAmount(input);
    if (amount === null) return null;
    const category = detectCategory(input);
    const note = input.trim();
    const date = new Date().toISOString();
    return { amount, category, note, date };
}
