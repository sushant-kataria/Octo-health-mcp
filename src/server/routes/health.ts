import { Router, type Request, type Response, type NextFunction } from "express";
import { SwiggyMCPClient } from "../../mcp/client.js";
import {
  getFoodOrderHistory,
  getInstamartOrderHistory,
  getDineoutOrderHistory,
} from "../../mcp/tools.js";
import { scoreOrders } from "../../health/scorer.js";
import { buildTrend } from "../../health/trends.js";
import { quickHealthSummary } from "../../agent/health-agent.js";
import type { UserHealthProfile } from "../../types/index.js";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req.session as unknown as Record<string, unknown>).accessToken) {
    res.status(401).json({ error: "Not authenticated. Visit /auth/swiggy to login." });
    return;
  }
  next();
}

router.get("/score", requireAuth, async (req: Request, res: Response) => {
  const token = (req.session as unknown as Record<string, unknown>).accessToken as string;
  const client = new SwiggyMCPClient(token);
  try {
    await client.connectAll();
    const [food, instamart, dineout] = await Promise.all([
      getFoodOrderHistory(client),
      getInstamartOrderHistory(client),
      getDineoutOrderHistory(client),
    ]);
    const orders = [...food, ...instamart, ...dineout];
    res.json({ score: scoreOrders(orders), trend: buildTrend(orders, "month"), orderCount: orders.length });
  } finally {
    await client.disconnectAll();
  }
});

router.get("/summary", requireAuth, async (req: Request, res: Response) => {
  const token = (req.session as unknown as Record<string, unknown>).accessToken as string;
  const client = new SwiggyMCPClient(token);
  const profile: UserHealthProfile = {
    userId: "user",
    goal: (req.query.goal as UserHealthProfile["goal"]) ?? "general_wellness",
    dietaryRestrictions: req.query.restrictions ? String(req.query.restrictions).split(",") : [],
    allergies: req.query.allergies ? String(req.query.allergies).split(",") : [],
  };
  try {
    await client.connectAll();
    res.json(await quickHealthSummary(client, profile));
  } finally {
    await client.disconnectAll();
  }
});

router.get("/trend", requireAuth, async (req: Request, res: Response) => {
  const token = (req.session as unknown as Record<string, unknown>).accessToken as string;
  const period = (req.query.period as "week" | "month" | "quarter") ?? "month";
  const client = new SwiggyMCPClient(token);
  try {
    await client.connectAll();
    const [food, instamart, dineout] = await Promise.all([
      getFoodOrderHistory(client, 200),
      getInstamartOrderHistory(client, 200),
      getDineoutOrderHistory(client, 200),
    ]);
    res.json(buildTrend([...food, ...instamart, ...dineout], period));
  } finally {
    await client.disconnectAll();
  }
});

export default router;
