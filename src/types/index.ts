export interface SwiggyOrder {
  orderId: string;
  restaurantName: string;
  items: OrderItem[];
  orderTime: string; // ISO timestamp
  totalAmount: number;
  source: "food" | "instamart" | "dineout";
}

export interface OrderItem {
  name: string;
  quantity: number;
  calories?: number;
  protein?: number;   // grams
  carbs?: number;     // grams
  fat?: number;       // grams
  fiber?: number;     // grams
  sodium?: number;    // mg
  category?: FoodCategory;
}

export type FoodCategory =
  | "vegetable"
  | "fruit"
  | "protein"
  | "dairy"
  | "grain"
  | "junk"
  | "beverage_healthy"
  | "beverage_unhealthy"
  | "snack_healthy"
  | "snack_unhealthy"
  | "processed"
  | "unknown";

export interface HealthScore {
  overall: number;          // 0-100
  nutrition: number;        // 0-100
  variety: number;          // 0-100
  portionControl: number;   // 0-100
  mealTiming: number;       // 0-100
  grade: HealthGrade;
  breakdown: ScoreBreakdown;
}

export type HealthGrade = "A+" | "A" | "B+" | "B" | "C" | "D" | "F";

export interface ScoreBreakdown {
  proteinAdequacy: number;
  vegetableIntake: number;
  processedFoodPenalty: number;
  sugarPenalty: number;
  fiberBonus: number;
  lateNightPenalty: number;
  orderVariety: number;
}

export interface HealthTrend {
  period: "week" | "month" | "quarter";
  scores: Array<{ date: string; score: number }>;
  direction: "improving" | "declining" | "stable";
  percentageChange: number;
}

export interface UserHealthProfile {
  userId: string;
  age?: number;
  weight?: number;    // kg
  height?: number;    // cm
  goal?: HealthGoal;
  dietaryRestrictions?: string[];
  allergies?: string[];
}

export type HealthGoal =
  | "weight_loss"
  | "muscle_gain"
  | "maintenance"
  | "heart_health"
  | "diabetes_management"
  | "general_wellness";

export interface HealthRecommendation {
  type: "avoid" | "prefer" | "habit" | "swap";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  swiggyAction?: SwiggyAction;
}

export interface SwiggyAction {
  label: string;
  mcpTool: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  summary: string;
  healthScore: HealthScore;
  trends: HealthTrend;
  recommendations: HealthRecommendation[];
  suggestedOrders?: SuggestedOrder[];
}

export interface SuggestedOrder {
  source: "food" | "instamart" | "dineout";
  restaurantOrStore: string;
  items: string[];
  healthReason: string;
  estimatedCalories: number;
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
