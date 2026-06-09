import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { MCPToolResult } from "../types/index.js";

export type SwiggyMCPServer = "food" | "instamart" | "dineout";

const MCP_URLS: Record<SwiggyMCPServer, string> = {
  food: process.env.SWIGGY_FOOD_MCP_URL ?? "https://mcp.swiggy.com/food",
  instamart: process.env.SWIGGY_INSTAMART_MCP_URL ?? "https://mcp.swiggy.com/instamart",
  dineout: process.env.SWIGGY_DINEOUT_MCP_URL ?? "https://mcp.swiggy.com/dineout",
};

export class SwiggyMCPClient {
  private clients: Map<SwiggyMCPServer, Client> = new Map();
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async connect(server: SwiggyMCPServer): Promise<void> {
    if (this.clients.has(server)) return;

    const client = new Client({ name: "octo-health", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URLS[server]), {
      requestInit: {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      },
    });
    await client.connect(transport);
    this.clients.set(server, client);
  }

  async connectAll(): Promise<void> {
    await Promise.all(
      (["food", "instamart", "dineout"] as SwiggyMCPServer[]).map((s) => this.connect(s))
    );
  }

  async callTool(
    server: SwiggyMCPServer,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const client = this.clients.get(server);
    if (!client) throw new Error(`MCP client for '${server}' not connected`);
    const result = await client.callTool({ name: toolName, arguments: args });
    return result as MCPToolResult;
  }

  async listTools(server: SwiggyMCPServer): Promise<string[]> {
    const client = this.clients.get(server);
    if (!client) throw new Error(`MCP client for '${server}' not connected`);
    const { tools } = await client.listTools();
    return tools.map((t) => t.name);
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([...this.clients.values()].map((c) => c.close()));
    this.clients.clear();
  }
}
