export type CategoryKey =
  | "餐饮"
  | "交通"
  | "购物"
  | "娱乐"
  | "居家"
  | "其他";

export interface Bill {
  id: string;
  amount: number;
  category: CategoryKey;
  note: string;
  date: string; // ISO date string
}
