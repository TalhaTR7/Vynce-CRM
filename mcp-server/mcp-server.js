import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BASE, authToken } from "./config.js";
import { tools } from "./tools.js";
import { resources } from "./resources.js";
import { prompts } from "./prompts.js";


// ─── INIT ─────────────────────────────────────────────────────────────────────

const server = new McpServer({ name: "vynce-crm", version: "1.0.0" });

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function headers() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
    }
}

async function api(method, path, body) {
    let res = await fetch(`${BASE}${path}`, {
        method,
        headers: headers(),
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    return {
        content: [{
            type: "text",
            text: JSON.stringify(data, null, 2)
        }]
    };
}

// ─── TOOLS, RESOURCES, PROMPTS ────────────────────────────────────────────────

tools(server, api);
resources(server);
prompts(server);

// ─── TRANSPORT ────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
