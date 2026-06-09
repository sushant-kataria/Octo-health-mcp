import type { SwiggyMCPClient } from "./client.js";
import type { SwiggyOrder } from "../types/index.js";

function parseOrders(raw: string): SwiggyOrder[] {
  try {
    return JSON.parse(raw) as SwiggyOrder[];
  } catch {
    return [];
  }
}

// ─── Food MCP ────────────────────────────────────────────────────────────────

export async function getFoodOrderHistory(
  client: SwiggyMCPClient,
  limit = 50
): Promise<SwiggyOrder[]> {
  const result = await client.callTool("food", "get_order_history", { limit });
  const text = result.content[0]?.text ?? "[]";
  return parseOrders(text).map((o) => ({ ...o, source: "food" as const }));
}

export async function searchFoodRestaurants(
  client: SwiggyMCPClient,
  query: string,
  filters?: { cuisines?: string[]; maxCalories?: number }
) {
  return client.callTool("food", "search_restaurants", { query, filters });
}

export async function getRecommendedFoodItems(
  client: SwiggyMCPClient,
  healthGoal: string,
  maxCalories?: number
) {
  return client.callTool("food", "get_healthy_recommendations", {
    health_goal: healthGoal,
    max_calories: maxCalories,
  });
}

// ─── Instamart MCP ───────────────────────────────────────────────────────────

export async function getInstamartOrderHistory(
  client: SwiggyMCPClient,
  limit = 50
): Promise<SwiggyOrder[]> {
  const result = await client.callTool("instamart", "get_order_history", { limit });
  const text = result.content[0]?.text ?? "[]";
  return parseOrders(text).map((o) => ({ ...o, source: "instamart" as const }));
}

export async function searchGroceryItems(
  client: SwiggyMCPClient,
  query: string,
  category?: string
) {
  return client.callTool("instamart", "search_products", { query, category });
}

export async function getHealthyGroceryAlternatives(
  client: SwiggyMCPClient,
  productName: string
) {
  return client.callTool("instamart", "get_healthy_alternatives", {
    product_name: productName,
  });
}

// ─── Dineout MCP ─────────────────────────────────────────────────────────────

export async function getDineoutOrderHistory(
  client: SwiggyMCPClient,
  limit = 50
): Promise<SwiggyOrder[]> {
  const result = await client.callTool("dineout", "get_booking_history", { limit });
  const text = result.content[0]?.text ?? "[]";
  return parseOrders(text).map((o) => ({ ...o, source: "dineout" as const }));
}

export async function searchHealthyRestaurants(
  client: SwiggyMCPClient,
  location: string,
  preferences?: { cuisine?: string; dietType?: string }
) {
  return client.callTool("dineout", "search_restaurants", {
    location,
    ...preferences,
    health_focused: true,
  });
}
