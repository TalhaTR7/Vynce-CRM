import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "http://localhost:5000/api";
let AUTH_TOKEN = process.env.AUTH_TOKEN || "";

const server = new McpServer({ name: "vynce-crm", version: "1.0.0" });

// ─── helpers ────────────────────────────────────────────────────────────────

function headers() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
    };
}

async function api(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: headers(),
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return {
        content: [{
            type: "text",
            text: JSON.stringify(data, null, 2)
        }]
    };
}

// ─── AUTH ────────────────────────────────────────────────────────────────────



// ─── USERS ───────────────────────────────────────────────────────────────────



// ─── PROJECTS ────────────────────────────────────────────────────────────────



// ─── MEMBERSHIPS ─────────────────────────────────────────────────────────────



// ─── BOARDS ──────────────────────────────────────────────────────────────────



// ─── TASKS ───────────────────────────────────────────────────────────────────



// ─── ARCHIVES ────────────────────────────────────────────────────────────────



// ─── MARKETS (AUCTIONS) ──────────────────────────────────────────────────────



// ─── INBOX ───────────────────────────────────────────────────────────────────

server.tool(
    "get_inbox",
    "Get all notifications for the logged-in user",
    {},
    async () => api("GET", "/inbox/user")
);

server.tool(
    "mark_notification_read",
    "Mark a single notification as read",
    { mailId: z.string() },
    async ({ mailId }) => api("PATCH", "/inbox/read", { mailId })
);

// ─── LEADERBOARDS ────────────────────────────────────────────────────────────

server.tool(
    "get_leaderboard",
    "Get the weekly XP leaderboard for a project (top 7)",
    { projectId: z.string() },
    async ({ projectId }) => api("GET", `/leaderboards/project/${projectId}`)
);

// ─── CONNECT ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);