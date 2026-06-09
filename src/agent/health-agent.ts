import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages.js";
import type { SwiggyMCPClient } from "../mcp/client.js";
import {
  getFoodOrderHistory,
  getInstamartOrderHistory,
  getDineoutOrderHistory,
  searchFoodRestaurants,
  getRecommendedFoodItems,
  getHealthyGroceryAlternatives,
  searchHealthyRestaurants,
} from "../mcp/tools.js";
import { scoreOrders } from "../health/scorer.js";
import { buildTrend } from "../health/trends.js";
import { buildSystemPrompt, buildAnalysisPrompt } from "./prompts.js";
import type {
  SwiggyOrder,
  AgentResponse,
  UserHealthProfile,
  HealthRecommendation,
} from "../types/index.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AGENT_TOOLS: Tool[] = [
  {
    name: "get_all_order_history",
    description:
      "Fetch the user's complete order history across Food, Instamart, and Dineout.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max orders per source (default 50)" },
      },
    },
  },
  {
    name: "search_healthy_food",
    description: "Search for healthy food options on Swiggy Food.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
        health_goal: { type: "string" },
        max_calories: { type: "number" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_grocery_alternative",
    description: "Suggest a healthier Instamart alternative to a frequently ordered item.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_name: { type: "string" },
      },
      required: ["product_name"],
    },
  },
  {
    name: "find_healthy_dineout",
    description: "Find healthy dine-in restaurant options.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: { type: "string" },
        cuisine_preference: { type: "string" },
      },
      required: ["location"],
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  mcpClient: SwiggyMCPClient,
  orderCache: { orders: SwiggyOrder[] | null }
): Promise<string> {
  try {
    switch (name) {
      case "get_all_order_history": {
        const limit = (input.limit as number) ?? 50;
        const [food, instamart, dineout] = await Promise.all([
          getFoodOrderHistory(mcpClient, limit),
          getInstamartOrderHistory(mcpClient, limit),
          getDineoutOrderHistory(mcpClient, limit),
        ]);
        const all = [...food, ...instamart, ...dineout];
        orderCache.orders = all;
        return JSON.stringify({
          total: all.length,
          breakdown: { food: food.length, instamart: instamart.length, dineout: dineout.length },
          orders: all,
        });
      }
      case "search_healthy_food": {
        const result = await searchFoodRestaurants(mcpClient, input.query as string, {
          maxCalories: input.max_calories as number | undefined,
        });
        if (input.health_goal) {
          const recs = await getRecommendedFoodItems(
            mcpClient,
            input.health_goal as string,
            input.max_calories as number | undefined
          );
          return JSON.stringify({ search: result, recommendations: recs });
        }
        return JSON.stringify(result);
      }
      case "get_grocery_alternative":
        return JSON.stringify(
          await getHealthyGroceryAlternatives(mcpClient, input.product_name as string)
        );
      case "find_healthy_dineout":
        return JSON.stringify(
          await searchHealthyRestaurants(mcpClient, input.location as string, {
            cuisine: input.cuisine_preference as string | undefined,
          })
        );
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}

export async function runHealthAgent(
  mcpClient: SwiggyMCPClient,
  userProfile: UserHealthProfile,
  userMessage: string
): Promise<AgentResponse> {
  const orderCache: { orders: SwiggyOrder[] | null } = { orders: null };
  const messages: MessageParam[] = [{ role: "user", content: userMessage }];
  let finalText = "";

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: buildSystemPrompt(userProfile),
      tools: AGENT_TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      finalText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("\n");
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const output = await executeTool(
          block.name,
          block.input as Record<string, unknown>,
          mcpClient,
          orderCache
        );
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: output });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  const orders = orderCache.orders ?? [];
  const healthScore = scoreOrders(orders);
  const trends = buildTrend(orders, "month");

  return {
    summary: finalText,
    healthScore,
    trends,
    recommendations: extractRecommendations(finalText),
  };
}

export async function quickHealthSummary(
  mcpClient: SwiggyMCPClient,
  userProfile: UserHealthProfile
): Promise<AgentResponse> {
  const [food, instamart, dineout] = await Promise.all([
    getFoodOrderHistory(mcpClient),
    getInstamartOrderHistory(mcpClient),
    getDineoutOrderHistory(mcpClient),
  ]);
  const orders = [...food, ...instamart, ...dineout];
  const healthScore = scoreOrders(orders);
  const trends = buildTrend(orders, "month");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: buildSystemPrompt(userProfile),
    messages: [{ role: "user", content: buildAnalysisPrompt(healthScore) }],
  });

  const summary = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  return { summary, healthScore, trends, recommendations: extractRecommendations(summary) };
}

function extractRecommendations(text: string): HealthRecommendation[] {
  const lines = text.split("\n").filter((l) => /^[\d\-\*•]/.test(l.trim()));
  return lines.slice(0, 5).map((line, i) => ({
    type: i < 2 ? ("prefer" as const) : ("avoid" as const),
    title: line.replace(/^[\d\-\*•\.]+\s*/, "").substring(0, 80),
    description: line.replace(/^[\d\-\*•\.]+\s*/, ""),
    priority: i === 0 ? ("high" as const) : ("medium" as const),
  }));
}
