import { Router, type Request, type Response, type NextFunction } from "express";
import { SwiggyMCPClient } from "../../mcp/client.js";
import { runHealthAgent } from "../../agent/health-agent.js";
import type { UserHealthProfile } from "../../types/index.js";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req.session as unknown as Record<string, unknown>).accessToken) {
    res.status(401).json({ error: "Not authenticated. Visit /auth/swiggy to login." });
    return;
  }
  next();
}

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { message, profile: profileOverrides } = req.body as {
    message: string;
    profile?: Partial<UserHealthProfile>;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const token = (req.session as unknown as Record<string, unknown>).accessToken as string;
  const client = new SwiggyMCPClient(token);
  const profile: UserHealthProfile = { userId: "user", goal: "general_wellness", ...profileOverrides };

  try {
    await client.connectAll();
    res.json(await runHealthAgent(client, profile, message));
  } finally {
    await client.disconnectAll();
  }
});

export default router;
