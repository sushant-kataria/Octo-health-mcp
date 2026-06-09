import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import authRouter from "./routes/auth.js";
import healthRouter from "./routes/health.js";
import chatRouter from "./routes/chat.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: process.env.APP_URL ?? "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 86400000,
    },
  })
);

app.use("/auth", authRouter);
app.use("/health", healthRouter);
app.use("/chat", chatRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "OctoHealth MCP",
    version: "1.0.0",
    description: "AI health agent powered by Swiggy MCP + Claude",
    endpoints: {
      auth: {
        "GET /auth/swiggy": "Start Swiggy OAuth login",
        "GET /auth/swiggy/callback": "OAuth callback (redirect URI)",
        "POST /auth/logout": "Logout",
      },
      health: {
        "GET /health/score": "Multi-dimensional health score from order history",
        "GET /health/summary": "AI-generated health summary + recommendations",
        "GET /health/trend?period=month": "Health score trend (week/month/quarter)",
      },
      chat: {
        "POST /chat": "Conversational health agent — body: { message, profile? }",
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`OctoHealth server running at http://localhost:${PORT}`);
});

export default app;
