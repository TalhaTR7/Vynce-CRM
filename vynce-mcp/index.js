import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "http://localhost:5000/api";
let AUTH_TOKEN = process.env.VYNCE_TOKEN || "";

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
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

server.tool(
    "login",
    "Login to Vynce and store the JWT for subsequent calls",
    { email: z.string(), password: z.string() },
    async ({ email, password }) => {
        const res = await fetch(`${BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.token) AUTH_TOKEN = data.token;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
);

// ─── USERS ───────────────────────────────────────────────────────────────────

server.tool("get_me", "Get the currently logged-in user", {}, async () =>
    api("GET", "/users/user")
);

server.tool(
    "get_user_by_id",
    "Get a user by their ID",
    { userId: z.string() },
    async ({ userId }) => api("GET", `/users/id/${userId}`)
);

server.tool(
    "get_user_by_email",
    "Get a user by their email",
    { email: z.string() },
    async ({ email }) => api("GET", `/users/email/${email}`)
);

server.tool(
    "update_mood",
    "Update the logged-in user's mood (ANGRY | CRYING | SAD | NORMAL | OKAY | HAPPY | ECSTATIC)",
    { mood: z.enum(["ANGRY", "CRYING", "SAD", "NORMAL", "OKAY", "HAPPY", "ECSTATIC"]) },
    async ({ mood }) => api("PATCH", "/users/user/mood", { mood })
);

// ─── PROJECTS ────────────────────────────────────────────────────────────────

server.tool("get_my_projects", "Get all projects the logged-in user is a member of", {}, async () =>
    api("GET", "/projects/user")
);

server.tool(
    "get_project",
    "Get full project details including boards and members",
    { projectId: z.string() },
    async ({ projectId }) => api("GET", `/projects/project/${projectId}`)
);

server.tool(
    "create_project",
    "Create a new project",
    { name: z.string() },
    async ({ name }) => api("POST", "/projects", { name })
);

server.tool(
    "delete_project",
    "Delete a project (owner only, must have no other members)",
    { projectId: z.string() },
    async ({ projectId }) => api("DELETE", `/projects/project/${projectId}`)
);

// ─── MEMBERSHIPS ─────────────────────────────────────────────────────────────

server.tool(
    "get_project_members",
    "Get all members of a project with their roles",
    { projectId: z.string() },
    async ({ projectId }) => api("GET", `/memberships/project/${projectId}`)
);

server.tool(
    "invite_user",
    "Invite a user to a project by email",
    { email: z.string(), projectId: z.string() },
    async ({ email, projectId }) => api("POST", "/invitations/invite", { email, projectId })
);

server.tool(
    "promote_member",
    "Promote a member to ADMIN (owner only)",
    { membershipId: z.string() },
    async ({ membershipId }) => api("PATCH", "/memberships/change-role/promote", { membershipId })
);

server.tool(
    "demote_admin",
    "Demote an ADMIN to MEMBER (owner only)",
    { membershipId: z.string() },
    async ({ membershipId }) => api("PATCH", "/memberships/change-role/demote", { membershipId })
);

server.tool(
    "remove_members",
    "Remove one or more members from a project",
    { projectId: z.string(), memberIds: z.array(z.string()) },
    async ({ projectId, memberIds }) =>
        api("DELETE", "/memberships/remove", { projectId, memberIds })
);

server.tool(
    "leave_project",
    "Leave a project",
    { projectId: z.string() },
    async ({ projectId }) => api("DELETE", "/memberships/leave", { projectId })
);

// ─── BOARDS ──────────────────────────────────────────────────────────────────

server.tool(
    "get_boards",
    "Get all boards for a project",
    { projectId: z.string() },
    async ({ projectId }) => api("GET", `/boards/project/${projectId}`)
);

server.tool(
    "create_board",
    "Create a new board in a project",
    { projectId: z.string(), name: z.string(), color: z.string().optional() },
    async ({ projectId, name, color }) =>
        api("POST", "/boards/board", { projectId, name, color })
);

server.tool(
    "edit_board",
    "Edit a board's name or color",
    { boardId: z.string(), projectId: z.string(), name: z.string(), color: z.string().optional() },
    async ({ boardId, projectId, name, color }) =>
        api("PATCH", `/boards/board/${boardId}`, { projectId, name, color })
);

server.tool(
    "delete_board",
    "Delete an empty board",
    { boardId: z.string() },
    async ({ boardId }) => api("DELETE", `/boards/board/${boardId}`)
);

// ─── TASKS ───────────────────────────────────────────────────────────────────

server.tool(
    "get_tasks_on_board",
    "Get all tasks on a board",
    { boardId: z.string() },
    async ({ boardId }) => api("GET", `/tasks/board/${boardId}`)
);

server.tool(
    "get_task",
    "Get full details of a task including activity and comments",
    { taskId: z.string() },
    async ({ taskId }) => api("GET", `/tasks/task/${taskId}`)
);

server.tool(
    "create_task",
    "Create a new task (OWNER or ADMIN only)",
    {
        projectId: z.string(),
        boardId: z.string(),
        title: z.string(),
        assigneeId: z.string(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        ethereum: z.number().optional(),
        difficulty: z.number().min(1).max(5).optional(),
    },
    async (body) => api("POST", "/tasks/create", body)
);

server.tool(
    "edit_task_title",
    "Edit a task's title",
    { taskId: z.string(), title: z.string() },
    async ({ taskId, title }) => api("PATCH", `/tasks/task/${taskId}/editTitle`, { title })
);

server.tool(
    "edit_task_description",
    "Edit a task's description",
    { taskId: z.string(), description: z.string() },
    async ({ taskId, description }) =>
        api("PATCH", `/tasks/task/${taskId}/editDescription`, { description })
);

server.tool(
    "edit_task_due_date",
    "Set or update a task's due date (ISO string or null to remove)",
    { taskId: z.string(), dueDate: z.string().nullable() },
    async ({ taskId, dueDate }) =>
        api("PATCH", `/tasks/task/${taskId}/editDueDate`, { dueDate })
);

server.tool(
    "change_task_difficulty",
    "Change a task's difficulty (1–5)",
    { taskId: z.string(), difficulty: z.number().min(1).max(5) },
    async ({ taskId, difficulty }) =>
        api("PATCH", `/tasks/task/${taskId}/changeDifficulty`, { difficulty })
);

server.tool(
    "change_task_bounty",
    "Change a task's ETH bounty",
    { taskId: z.string(), bounty: z.number(), mood: z.string().optional() },
    async ({ taskId, bounty, mood }) =>
        api("PATCH", `/tasks/task/${taskId}/changeBounty`, { bounty, mood })
);

server.tool(
    "reassign_task",
    "Change the assignee of a task",
    { taskId: z.string(), assigneeId: z.string() },
    async ({ taskId, assigneeId }) =>
        api("PATCH", `/tasks/task/${taskId}/reassign`, { assigneeId })
);

server.tool(
    "change_task_status",
    "Move a task to a different board (change status)",
    { taskId: z.string(), boardId: z.string() },
    async ({ taskId, boardId }) =>
        api("PATCH", `/tasks/task/${taskId}/changeStatus`, { boardId })
);

server.tool(
    "submit_task",
    "Submit a task for review (assignee only)",
    { taskId: z.string() },
    async ({ taskId }) => api("PATCH", "/tasks/task/submit", { taskId })
);

server.tool(
    "return_task",
    "Return a submitted task back to the assignee (creator only)",
    { taskId: z.string() },
    async ({ taskId }) => api("PATCH", "/tasks/task/return", { taskId })
);

server.tool(
    "add_comment",
    "Add a comment to a task",
    { taskId: z.string(), comment: z.string() },
    async ({ taskId, comment }) =>
        api("PATCH", `/tasks/task/${taskId}/addComment`, { comment })
);

server.tool(
    "start_timer",
    "Start the work timer on a task",
    { taskId: z.string() },
    async ({ taskId }) => api("PATCH", `/tasks/task/${taskId}/startTimer`, {})
);

server.tool(
    "stop_timer",
    "Stop the work timer on a task",
    { taskId: z.string() },
    async ({ taskId }) => api("PATCH", `/tasks/task/${taskId}/stopTimer`, {})
);

// ─── ARCHIVES ────────────────────────────────────────────────────────────────

server.tool(
    "get_archives",
    "Get archived tasks for a project (ADMIN/OWNER only)",
    { projectId: z.string() },
    async ({ projectId }) => api("GET", `/archives/project/${projectId}`)
);

server.tool(
    "close_task",
    "Close and reward a submitted task, moving it to archives",
    { taskId: z.string() },
    async ({ taskId }) => api("PATCH", "/archives/task/close", { taskId })
);

server.tool(
    "archive_task",
    "Archive (delete without reward) a task",
    { taskId: z.string() },
    async ({ taskId }) => api("PATCH", "/archives/task/archive", { taskId })
);

server.tool(
    "restore_task",
    "Restore an archived task as a new task",
    {
        taskId: z.string(),
        boardId: z.string(),
        title: z.string(),
        assigneeId: z.string(),
        dueDate: z.string().optional(),
        ethereum: z.number().optional(),
        difficulty: z.number().optional(),
        description: z.string().optional(),
    },
    async ({ taskId, ...body }) => api("POST", `/archives/restore/${taskId}`, body)
);

server.tool(
    "delete_archived_task",
    "Permanently delete a task from archives",
    { taskId: z.string() },
    async ({ taskId }) => api("DELETE", `/archives/task/${taskId}`)
);

// ─── MARKETS (AUCTIONS) ──────────────────────────────────────────────────────

server.tool(
    "get_market_tasks",
    "Get all tasks currently on the auction market for a project",
    { projectId: z.string() },
    async ({ projectId }) => api("GET", `/auction/project/${projectId}`)
);

server.tool(
    "get_auction",
    "Get auction details for a specific task",
    { taskId: z.string() },
    async ({ taskId }) => api("GET", `/auction/task/${taskId}`)
);

server.tool(
    "place_bid",
    "Place a bid on an auctioned task",
    { taskId: z.string(), amount: z.number() },
    async ({ taskId, amount }) => api("PATCH", `/auction/task/${taskId}`, { amount })
);

// ─── INBOX ───────────────────────────────────────────────────────────────────

server.tool("get_inbox", "Get all notifications for the logged-in user", {}, async () =>
    api("GET", "/inbox/user")
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