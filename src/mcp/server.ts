import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListVaults } from "./tools/list-vaults";
import { registerQueryVault } from "./tools/query-vault";
import { registerVaultPayouts } from "./tools/vault-payouts";

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "brain-drain", version: "0.2.0" });
  registerListVaults(server);
  registerQueryVault(server);
  registerVaultPayouts(server);
  return server;
}
