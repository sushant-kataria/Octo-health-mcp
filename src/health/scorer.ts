import type {
  SwiggyOrder,
  HealthScore,
  HealthGrade,
  ScoreBreakdown,
  FoodCategory,
} from "../types/index.js";
import { classifyFoodItem, isLateNightOrder } from "./classifier.js";

const CATEGORY_SCORE: Record<FoodCategory, number> = {
  vegetable: 10,
  fruit: 8,
  protein: 7,
  dairy: 4,
  grain: 3,
  snack_healthy: 5,
  beverage_healthy: 4,
  snack_unhealthy: -4,
  beverage_unhealthy: -5,
  junk: -8,
  processed: -6,
  unknown: 0,
};

function gradeFromScore(score: number): HealthGrade {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function scoreOrders(orders: SwiggyOrder[]): HealthScore {
  if (orders.length === 0) return emptyScore();

  let totalItems = 0;
  let vegetableCount = 0;
  let proteinCount = 0;
  let junkCount = 0;
  let processedCount = 0;
  let lateNightOrders = 0;
  let totalCalories = 0;
  let totalFiber = 0;
  let totalSugar = 0;
  const restaurantSet = new Set<string>();

  for (const order of orders) {
    if (isLateNightOrder(order.orderTime)) lateNightOrders++;
    restaurantSet.add(order.restaurantName);

    for (const item of order.items) {
      const category = item.category ?? classifyFoodItem(item.name);
      totalItems += item.quantity;

      if (category === "vegetable") vegetableCount += item.quantity;
      if (category === "protein") proteinCount += item.quantity;
      if (category === "junk") junkCount += item.quantity;
      if (category === "processed") processedCount += item.quantity;

      if (item.calories) totalCalories += item.calories * item.quantity;
      if (item.fiber) totalFiber += item.fiber * item.quantity;
      if (item.carbs && category === "junk") totalSugar += item.carbs * 0.4 * item.quantity;
    }
  }

  const safeItems = Math.max(totalItems, 1);
  const safeOrders = Math.max(orders.length, 1);
  const safeCal = Math.max(totalCalories, 1);

  const proteinAdequacy      = clamp(Math.round((proteinCount / safeItems) * 200));
  const vegetableIntake      = clamp(Math.round((vegetableCount / safeItems) * 200));
  const processedFoodPenalty = clamp(100 - Math.round(((junkCount + processedCount) / safeItems) * 200));
  const sugarPenalty         = clamp(100 - Math.round((totalSugar / safeCal) * 1000));
  const fiberBonus           = clamp(Math.round((totalFiber / safeOrders) * 10));
  const lateNightPenalty     = clamp(100 - Math.round((lateNightOrders / safeOrders) * 150));
  const orderVariety         = clamp(Math.round((restaurantSet.size / safeOrders) * 200));

  const breakdown: ScoreBreakdown = {
    proteinAdequacy,
    vegetableIntake,
    processedFoodPenalty,
    sugarPenalty,
    fiberBonus,
    lateNightPenalty,
    orderVariety,
  };

  const nutrition = clamp(Math.round(
    proteinAdequacy * 0.25 +
    vegetableIntake * 0.25 +
    processedFoodPenalty * 0.20 +
    sugarPenalty * 0.15 +
    fiberBonus * 0.15
  ));
  const variety        = orderVariety;
  const portionControl = clamp(100 - Math.round((totalCalories / safeOrders / 600) * 10));
  const mealTiming     = lateNightPenalty;

  const overall = clamp(Math.round(
    nutrition * 0.45 +
    variety * 0.20 +
    portionControl * 0.20 +
    mealTiming * 0.15
  ));

  return { overall, nutrition, variety, portionControl, mealTiming, grade: gradeFromScore(overall), breakdown };
}

function emptyScore(): HealthScore {
  return {
    overall: 0, nutrition: 0, variety: 0, portionControl: 0, mealTiming: 0,
    grade: "F",
    breakdown: {
      proteinAdequacy: 0, vegetableIntake: 0, processedFoodPenalty: 0,
      sugarPenalty: 0, fiberBonus: 0, lateNightPenalty: 0, orderVariety: 0,
    },
  };
}
