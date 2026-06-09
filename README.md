# OctoHealth MCP

> AI-powered personal health coach that scores your Swiggy eating habits and helps you order better.

OctoHealth connects to all three Swiggy MCP servers (Food, Instamart, Dineout), analyses your complete order history, computes a multi-dimensional health score, and uses Claude AI to generate personalised, actionable recommendations — with direct links back to healthier alternatives on Swiggy.

---

## How it works

```
User ──► Express API ──► Swiggy OAuth 2.0
                    │
         ┌──────────┼────────────┐
      Food MCP  Instamart MCP  Dineout MCP
         └──────────┼────────────┘
                    ▼
          Health Scoring Engine
          (nutrition · variety · portion · timing)
                    ▼
          Claude Sonnet — agentic tool-use loop
          (calls MCP live to find real alternatives)
                    ▼
          Personalised recommendations
          + direct Swiggy order suggestions
```

### Health Score (0–100, grade A+ → F)

| Dimension | Weight | What it measures |
|---|---|---|
| Nutrition | 45% | Protein, vegetables, fibre, processed-food & sugar penalties |
| Variety | 20% | Restaurant and cuisine diversity |
| Portion Control | 20% | Average calories per order |
| Meal Timing | 15% | Late-night ordering penalty |

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Agent | Claude Sonnet (`claude-sonnet-4-6`) via Anthropic SDK |
| MCP Integration | `@modelcontextprotocol/sdk` — StreamableHTTP transport |
| Swiggy Servers | Food MCP · Instamart MCP · Dineout MCP |
| Backend | Node.js + TypeScript + Express |
| Auth | Swiggy OAuth 2.0 |

---

## Quickstart

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Fill in ANTHROPIC_API_KEY, SWIGGY_CLIENT_ID, SWIGGY_CLIENT_SECRET

# 3. Run server
npm run dev

# 4. Or run interactive CLI agent
npm run agent
```

Visit `http://localhost:3000` to see all endpoints.

---

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/swiggy` | Start OAuth login |
| `GET` | `/auth/swiggy/callback` | OAuth callback (redirect URI) |
| `GET` | `/health/score` | Health score from order history |
| `GET` | `/health/summary` | AI health summary + recommendations |
| `GET` | `/health/trend?period=month` | Score trend over time |
| `POST` | `/chat` | Conversational agent |

**Chat body:**
```json
{
  "message": "What should I order tonight that's high in protein?",
  "profile": { "goal": "muscle_gain", "dietaryRestrictions": ["vegetarian"] }
}
```

---

## Project structure

```
src/
├── agent/        health-agent.ts · prompts.ts · cli.ts
├── auth/         swiggy-oauth.ts
├── health/       scorer.ts · classifier.ts · trends.ts
├── mcp/          client.ts · tools.ts
├── server/       index.ts · routes/{auth,health,chat}.ts
└── types/        index.ts
```

---

## Roadmap

- [ ] Persistent user profiles (PostgreSQL / Supabase)
- [ ] Weekly health digest via WhatsApp/email
- [ ] Group order health optimiser
- [ ] Real-time restaurant filter by nutritional thresholds
- [ ] Wearable integration (Apple Health, Google Fit)
- [ ] Streak + badge gamification

---

Built for **Swiggy Builders Club**
