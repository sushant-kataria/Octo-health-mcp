import "dotenv/config";
import * as readline from "readline";
import { SwiggyMCPClient } from "../mcp/client.js";
import { runHealthAgent, quickHealthSummary } from "./health-agent.js";
import type { UserHealthProfile } from "../types/index.js";

const DEMO_PROFILE: UserHealthProfile = {
  userId: "demo-user",
  age: 28,
  weight: 72,
  height: 175,
  goal: "general_wellness",
  dietaryRestrictions: [],
  allergies: [],
};

async function main() {
  const token = process.env.DEMO_ACCESS_TOKEN ?? "demo-token";
  const client = new SwiggyMCPClient(token);

  console.log("Connecting to Swiggy MCP servers...");
  await client.connectAll();
  console.log("Connected!\n");
  console.log("OctoHealth — type 'summary' for a health overview, or ask anything. ('exit' to quit)\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = () => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) { ask(); return; }
      if (trimmed.toLowerCase() === "exit") {
        await client.disconnectAll();
        rl.close();
        return;
      }
      try {
        if (trimmed.toLowerCase() === "summary") {
          const result = await quickHealthSummary(client, DEMO_PROFILE);
          console.log(`\nOctoHealth:\n${result.summary}`);
          console.log(`\nHealth Score: ${result.healthScore.overall}/100 (${result.healthScore.grade})\n`);
        } else {
          const result = await runHealthAgent(client, DEMO_PROFILE, trimmed);
          console.log(`\nOctoHealth:\n${result.summary}\n`);
        }
      } catch (err) {
        console.error("Error:", err);
      }
      ask();
    });
  };

  ask();
}

main().catch(console.error);
