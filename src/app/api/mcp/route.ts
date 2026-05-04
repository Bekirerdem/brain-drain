import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/mcp/server";

export const dynamic = "force-dynamic";

let cached: WebStandardStreamableHTTPServerTransport | null = null;

async function getTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
  if (cached) return cached;
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  cached = transport;
  return transport;
}

export async function POST(request: Request): Promise<Response> {
  const transport = await getTransport();
  return transport.handleRequest(request);
}

export async function GET(request: Request): Promise<Response> {
  const transport = await getTransport();
  return transport.handleRequest(request);
}
