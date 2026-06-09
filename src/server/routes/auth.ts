import { Router, type Request, type Response } from "express";
import {
  buildAuthorizationURL,
  exchangeCodeForTokens,
  generateState,
} from "../../auth/swiggy-oauth.js";

const router = Router();

router.get("/swiggy", (req: Request, res: Response) => {
  const state = generateState();
  (req.session as unknown as Record<string, unknown>).oauthState = state;
  res.redirect(buildAuthorizationURL(state));
});

router.get("/swiggy/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.status(400).json({ error, description: req.query.error_description });
    return;
  }

  const storedState = (req.session as unknown as Record<string, unknown>).oauthState;
  if (!state || state !== storedState) {
    res.status(403).json({ error: "state_mismatch" });
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    (req.session as unknown as Record<string, unknown>).accessToken = tokens.access_token;
    (req.session as unknown as Record<string, unknown>).refreshToken = tokens.refresh_token;
    res.redirect("/");
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
