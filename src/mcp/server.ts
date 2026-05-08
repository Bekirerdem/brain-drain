import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListVaults } from "./tools/list-vaults";
import { registerQueryVault } from "./tools/query-vault";
import { registerSubmitFeedback } from "./tools/submit-feedback";
import { registerVaultPayouts } from "./tools/vault-payouts";

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "brain-drain", version: "0.3.0" });
  registerListVaults(server);
  registerQueryVault(server);
  registerVaultPayouts(server);
  registerSubmitFeedback(server);
  return server;
}
