import type { SwiggyOrder, HealthTrend } from "../types/index.js";
import { scoreOrders } from "./scorer.js";

export function buildTrend(
  orders: SwiggyOrder[],
  period: "week" | "month" | "quarter" = "month"
): HealthTrend {
  const sorted = [...orders].sort(
    (a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime()
  );

  const buckets =
    period === "week"
      ? groupByWeek(sorted)
      : groupByCalendarPeriod(sorted, period === "quarter" ? 3 : 1);

  const dataPoints = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucketOrders]) => ({ date, score: scoreOrders(bucketOrders).overall }));

  const scores = dataPoints.map((d) => d.score);
  const direction = computeDirection(scores);
  const percentageChange =
    scores.length >= 2
      ? Math.round(((scores[scores.length - 1] - scores[0]) / Math.max(scores[0], 1)) * 100)
      : 0;

  return { period, scores: dataPoints, direction, percentageChange };
}

function groupByWeek(orders: SwiggyOrder[]): Map<string, SwiggyOrder[]> {
  const map = new Map<string, SwiggyOrder[]>();
  for (const order of orders) {
    const d = new Date(order.orderTime);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(order);
  }
  return map;
}

function groupByCalendarPeriod(
  orders: SwiggyOrder[],
  monthsPerBucket: number
): Map<string, SwiggyOrder[]> {
  const map = new Map<string, SwiggyOrder[]>();
  for (const order of orders) {
    const d = new Date(order.orderTime);
    const bucket = Math.floor(d.getMonth() / monthsPerBucket);
    const key = `${d.getFullYear()}-Q${bucket + 1}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(order);
  }
  return map;
}

function computeDirection(scores: number[]): "improving" | "declining" | "stable" {
  if (scores.length < 2) return "stable";
  const n = scores.length;
  const xMean = (n - 1) / 2;
  const yMean = scores.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (scores[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  if (Math.abs(slope) < 1) return "stable";
  return slope > 0 ? "improving" : "declining";
}
