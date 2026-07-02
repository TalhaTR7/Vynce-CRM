import { z } from "zod";
import { authToken, BASE, setAuthToken } from "./config.js";

export function tools(server, api) {

    // ─── AUTH ─────────────────────────────────────────────────────────────────────

    server.registerTool(
        "login",
        {
            description: "Logs in user with the given credentials and stores the JWT for the session.",
            inputSchema: z.object({
                email: z.string(),
                password: z.string()
            })
        },
        async ({ email, password }) => {
            const res = await fetch(`${BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.token) setAuthToken(data.token);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }]
            };
        }
    );

    server.registerTool(
        "signup",
        {
            description: "Creates an account for the user using the given credentials and stores the JWT for the session.",
            inputSchema: z.object({
                email: z.string(),
                firstname: z.string(),
                lastname: z.string(),
                password: z.string()
            })
        },
        async ({ email, firstname, lastname, password }) => {
            const res = await fetch(`${BASE}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, firstname, lastname, password })
            });
            const data = await res.json();
            if (data.token) setAuthToken(data.token);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }]
            };
        }
    );

    // ─── USER ─────────────────────────────────────────────────────────────────────

    server.registerTool(
        "get-me",
        {
            description: "Gets the currently logged in user.",
            inputSchema: z.object({})
        },
        async () => api("GET", "/users/user")
    );

    server.registerTool(
        "get-user-by-id",
        {
            description: "Gets user by id.",
            inputSchema: z.object({
                userId: z.string()
            })
        },
        async ({ userId }) => api("GET", `/users/id/${userId}`)
    );

    server.registerTool(
        "get-user-by-email",
        {
            description: "Gets user by email.",
            inputSchema: z.object({
                email: z.string()
            })
        },
        async ({ email }) => api("GET", `/users/email/${email}`)
    );

    server.registerTool(
        "edit-user",
        {
            description: "Edits user's firstname, lastname, or profile image.",
            inputSchema: z.object({
                firstname: z.string().optional(),
                lastname: z.string().optional(),
                image: z.object({
                    mimeType: z.string(),
                    data: z.string(),
                }).optional()
            })
        },
        async ({ firstname, lastname, image }) => {
            const form = new FormData();

            if (firstname) form.append("firstname", firstname);
            if (lastname) form.append("lastname", lastname);
            if (image) {
                const buffer = Buffer.from(image.data, "base64");
                const blob = new Blob([buffer], { type: image.mimeType });
                form.append("image", blob, "profile.png");
            }

            const res = await fetch(`${BASE}/users/user`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${authToken}` },
                body: form
            });

            const data = await res.json();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }]
            };
        }
    );

    server.registerTool(
        "update-mood",
        {
            description: "Updates the current mood of the user. Can be ANGRY, CRYING, SAD, NORMAL, OKAY, HAPPY and ECSTATIC.",
            inputSchema: z.object({
                mood: z.enum(["ANGRY", "CRYING", "SAD", "NORMAL", "OKAY", "HAPPY", "ECSTATIC"])
            })
        },
        async ({ mood }) => api("PATCH", "/users/user/mood", { mood })
    );

    server.registerTool(
        "update-password",
        {
            description: "Updates user password. The users gives two passwords, his current and a newer one.",
            inputSchema: z.object({
                currentPassword: z.string().describe("If this is wrong, no need to continue"),
                newPassword: z.string()
            })
        },
        async ({ currentPassword, newPassword }) => api("PATCH", "/users/user/change-password", { currentPassword, newPassword })
    );

    server.registerTool(
        "delete-user",
        {
            description: "Deletes the current user. If it can't, explain the reason briefly.",
            inputSchema: z.object({})
        },
        async () => api("DELETE", "/users/user")
    );

    // ─── PROJECTS ─────────────────────────────────────────────────────────────────

    server.registerTool(
        "create-project",
        {
            description: "Creates a new project.",
            inputSchema: z.object({
                name: z.string(),
                image: z.object({
                    mimeType: z.string(),
                    data: z.string(),
                }).optional()
            })
        },
        async ({ name, image }) => {
            const form = new FormData();

            if (name) form.append("name", name);
            if (image) {
                const buffer = Buffer.from(image.data, "base64");
                const blob = new Blob([buffer], { type: image.mimeType });
                form.append("image", blob, "profile.png");
            }

            const res = await fetch(`${BASE}/projects`, {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
                body: form
            });

            const data = await res.json();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }]
            };
        }

    );

    server.registerTool(
        "get-all-projects",
        {
            description: "Gets all the projects in the database.",
            inputSchema: z.object({})
        },
        async () => api("GET", "/projects/")
    );

    server.registerTool(
        "get-user-projects",
        {
            description: "Gets the projects the current user is enrolled in.",
            inputSchema: z.object({})
        },
        async () => api("GET", "/projects/user")
    );

    server.registerTool(
        "get-project-by-id",
        {
            description: "Gets a project by id.",
            inputSchema: z.object({
                projectId: z.string()
            })
        },
        async ({ projectId }) => api("GET", `/projects/project/${projectId}`)
    );

    server.registerTool(
        "edit-project",
        {
            description: "Edits the project name or project image.",
            inputSchema: z.object({
                projectId: z.string(),
                name: z.string().optional(),
                image: z.object({
                    mimeType: z.string(),
                    data: z.string(),
                }).optional()
            })
        },
        async ({ projectId, name, image }) => {
            const form = new FormData();

            if (name) form.append("name", name);
            if (image) {
                const buffer = Buffer.from(image.data, "base64");
                const blob = new Blob([buffer], { type: image.mimeType });
                form.append("image", blob, "project.png");
            }

            const res = await fetch(`${BASE}/projects/project/${projectId}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${authToken}` },
                body: form
            });

            const data = await res.json();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }]
            };
        }
    );

    server.registerTool(
        "delete-project",
        {
            description: "Deletes a project (owner only, must have no other members).",
            inputSchema: z.object({
                projectId: z.string()
            })
        },
        async ({ projectId }) => api("DELETE", `/projects/project/${projectId}`)
    );

    // ─── MEMBERSHIPS ──────────────────────────────────────────────────────────────

    server.registerTool(
        "leave-project",
        {
            description: "Leaves the project for current user.",
            inputSchema: z.object({
                projectId: z.string()
            })
        },
        async ({ projectId }) => api("DELETE", "/memberships/leave", { projectId })
    );

    server.registerTool(
        "remove-from-project",
        {
            description: "Removes user/users from the project (only OWNER is capable).",
            inputSchema: z.object({
                projectId: z.string(),
                memberIds: z.array(z.string())
            })
        },
        async ({ projectId, memberIds }) => api("DELETE", "/memberships/remove", { projectId, memberIds })
    );

    server.registerTool(
        "get-user-projects-with-roles",
        {
            description: "Gets only current user projects with role.",
            inputSchema: z.object({})
        },
        async () => api("GET", "/memberships/user")
    );

    server.registerTool(
        "get-the-team",
        {
            description: "Gets the members of the project with roles.",
            inputSchema: z.object({
                projectId: z.string()
            })
        },
        async ({ projectId }) => api("GET", `/memberships/project/${projectId}`)
    );

    server.registerTool(
        "request-ownership-transfer",
        {
            description: "Ask an admin to take over the project ownership (only OWNER is capable).",
            inputSchema: z.object({
                projectId: z.string(),
                adminId: z.string()
            })
        },
        async ({ projectId, adminId }) => api("POST", "/memberships/transfer-ownership/offer", { projectId, adminId })
    );

    server.registerTool(
        "respond-ownership-transfer",
        {
            description: "Gets the ownership transfer offer details by offer id (only targeted ADMIN is capable).",
            inputSchema: z.object({
                offerId: z.string()
            })
        },
        async ({ offerId }) => api("GET", `/memberships/transfer-ownership/${offerId}`)
    );

    server.registerTool(
        "accept-ownership",
        {
            description: "Accept ownership of the project (only targeted ADMIN is capable).",
            inputSchema: z.object({
                offerId: z.string()
            })
        },
        async ({ offerId }) => api("PATCH", "/memberships/transfer-ownership/accept", { offerId })
    );

    server.registerTool(
        "decline-ownership",
        {
            description: "Decline ownership of the project (only targeted ADMIN is capable).",
            inputSchema: z.object({
                offerId: z.string()
            })
        },
        async ({ offerId }) => api("PATCH", "/memberships/transfer-ownership/decline", { offerId })
    );

    server.registerTool(
        "promote-member",
        {
            description: "Promotes a member to an admin.",
            inputSchema: z.object({
                membershipId: z.string()
            })
        },
        async ({ membershipId }) => api("PATCH", "/memberships/change-role/promote", { membershipId })
    );

    server.registerTool(
        "demote-admin",
        {
            description: "Demotes an admin to a member.",
            inputSchema: z.object({
                membershipId: z.string()
            })
        },
        async ({ membershipId }) => api("PATCH", "/memberships/change-role/demote", { membershipId })
    );

    // ─── INVITATIONS ──────────────────────────────────────────────────────────────

    server.registerTool(
        "invite-user",
        {
            description: "Invites a user to a project via his email.",
            inputSchema: z.object({
                email: z.string(),
                projectId: z.string(),
            })
        },
        async ({ email, projectId }) => api("POST", "/invitations/invite", { email, projectId })
    );

    server.registerTool(
        "get-invite-data",
        {
            description: "Gets the invitation data.",
            inputSchema: z.object({
                inviteId: z.string()
            })
        },
        async ({ inviteId }) => api("GET", `/invitations/${inviteId}`)
    );

    server.registerTool(
        "accept-invitation",
        {
            description: "Accepts the invitation to the project.",
            inputSchema: z.object({
                invitationId: z.string()
            })
        },
        async ({ invitationId }) => api("PATCH", "/invitations/accept", { invitationId })
    );

    server.registerTool(
        "decline-invitation",
        {
            description: "Declines the invitation to the project.",
            inputSchema: z.object({
                invitationId: z.string()
            })
        },
        async ({ invitationId }) => api("PATCH", "/invitations/decline", { invitationId })
    );

    // ─── BOARDS ───────────────────────────────────────────────────────────────────

    server.registerTool(
        "create-board",
        {
            description: "Creates a board in the project with a name and an optional hex value for its color.",
            inputSchema: z.object({
                projectId: z.string(),
                name: z.string(),
                color: z.string().optional()
            })
        },
        async ({ projectId, name, color }) => api("POST", "/boards/board", { projectId, name, color })
    );

    server.registerTool(
        "get-boards",
        {
            description: "Gets all the boards of the project.",
            inputSchema: z.object({
                projectId: z.string(),
            })
        },
        async ({ projectId }) => api("GET", `/boards/project/${projectId}`)
    );

    server.registerTool(
        "edit-board",
        {
            description: "Edits the attributes of a board.",
            inputSchema: z.object({
                projectId: z.string(),
                boardId: z.string(),
                name: z.string().optional(),
                color: z.string().optional()
            })
        },
        async ({ projectId, boardId, name, color }) => api("PATCH", `/boards/board/${boardId}`, { projectId, name, color })
    );

    server.registerTool(
        "move-board",
        {
            description: "Moves a board left or right.",
            inputSchema: z.object({
                projectId: z.string(),
                boardId: z.string(),
                newPosition: z.number().min(0)
            })
        },
        async ({ projectId, boardId, newPosition }) => api("PATCH", `/boards/move/${boardId}`, { projectId, newPosition })
    );

    server.registerTool(
        "delete-board",
        {
            description: "Deletes a board of the project.",
            inputSchema: z.object({
                boardId: z.string(),
            })
        },
        async ({ boardId }) => api("DELETE", `/boards/board/${boardId}`)
    );

    // ─── TASKS ────────────────────────────────────────────────────────────────────

    server.registerTool(
        "create-task",
        {
            description: "Creates a task inside a project under a board.",
            inputSchema: z.object({
                projectId: z.string(),
                boardId: z.string(),
                title: z.string(),
                description: z.string().optional(),
                assigneeId: z.string(),
                dueDate: z.string().optional(),
                ethereum: z.number().min(1).describe("User can put a minimum of 1 ETH and a maximum of how much he has."),
                difficulty: z.number().min(1).max(5)
            })
        },
        async ({
            projectId, boardId, title,
            description, assigneeId, dueDate,
            ethereum, difficulty
        }) => api("POST", "/tasks/create", {
            projectId, boardId, title,
            description, assigneeId, dueDate,
            ethereum, difficulty
        })
    );

    server.registerTool(
        "get-tasks",
        {
            description: "Gets tasks of a board.",
            inputSchema: z.object({
                boardId: z.string(),
            })
        },
        async ({ boardId }) => api("GET", `/tasks/board/${boardId}`)
    );

    server.registerTool(
        "get-task",
        {
            description: "Gets full details of a task by id.",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("GET", `/tasks/task/${taskId}`)
    );

    server.registerTool(
        "edit-task-title",
        {
            description: "Edits task title.",
            inputSchema: z.object({
                taskId: z.string(),
                title: z.string()
            })
        },
        async ({ taskId, title }) => api("PATCH", `/tasks/task/${taskId}/editTitle`, { title })
    );

    server.registerTool(
        "reassign-task",
        {
            description: "Reassigns the task to someone who's in the project.",
            inputSchema: z.object({
                taskId: z.string(),
                assigneeId: z.string()
            })
        },
        async ({ taskId, assigneeId }) => api("PATCH", `/tasks/task/${taskId}/reassign`, { assigneeId })
    );

    server.registerTool(
        "edit-task-duedate",
        {
            description: "Edits the due date of the task.",
            inputSchema: z.object({
                taskId: z.string(),
                dueDate: z.string().optional().describe("This must be greater than today or remove the due date.")
            })
        },
        async ({ taskId, dueDate }) => api("PATCH", `/tasks/task/${taskId}/editDueDate`, { dueDate })
    );

    server.registerTool(
        "move-task",
        {
            description: "Changes the status of the task (moves from one board to another).",
            inputSchema: z.object({
                taskId: z.string(),
                boardId: z.string()
            })
        },
        async ({ taskId, boardId }) => api("PATCH", `/tasks/task/${taskId}/changeStatus`, { boardId })
    );

    server.registerTool(
        "start-task-timer",
        {
            description: "Starts the task timer (only assignee is capable).",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("PATCH", `/tasks/task/${taskId}/startTimer`)
    );

    server.registerTool(
        "stop-task-timer",
        {
            description: "Stops the task timer (only assignee is capable).",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("PATCH", `/tasks/task/${taskId}/stopTimer`)
    );

    server.registerTool(
        "edit-task-reward",
        {
            description: "Update the amount of ETH in the task (only creator is capable).",
            inputSchema: z.object({
                taskId: z.string(),
                bounty: z.number().min(1).describe("Make sure the creator doesn't put a higher amount of ETH than in his balance."),
                mood: z.enum(["ANGRY", "CRYING", "SAD", "NORMAL", "OKAY", "HAPPY", "ECSTATIC"]).describe("The current mood of the assignee, used to calculate the new reward multiplier.")
            })
        },
        async ({ taskId, bounty, mood }) => api("PATCH", `/tasks/task/${taskId}/changeBounty`, { bounty, mood })
    );

    server.registerTool(
        "change-task-difficulty",
        {
            description: "Changes task difficulty (only creator is capable).",
            inputSchema: z.object({
                taskId: z.string(),
                difficulty: z.number().min(1).max(5)
            })
        },
        async ({ taskId, difficulty }) => api("PATCH", `/tasks/task/${taskId}/changeDifficulty`, { difficulty })
    );

    server.registerTool(
        "update-task-description",
        {
            description: "Changes task description (only creator is capable).",
            inputSchema: z.object({
                taskId: z.string(),
                description: z.string().optional()
            })
        },
        async ({ taskId, description }) => api("PATCH", `/tasks/task/${taskId}/editDescription`, { description })
    );

    server.registerTool(
        "add-comment",
        {
            description: "Adds a comment to a task.",
            inputSchema: z.object({
                taskId: z.string(),
                comment: z.string()
            })
        },
        async ({ taskId, comment }) => api("PATCH", `/tasks/task/${taskId}/addComment`, { comment })
    );

    server.registerTool(
        "submit-task",
        {
            description: "Submits the task to the creator (only assignee is capable).",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("PATCH", "/tasks/task/submit", { taskId })
    );

    server.registerTool(
        "return-task",
        {
            description: "Returns the task back to the assignee (only creator is capable after submission).",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("PATCH", "/tasks/task/return", { taskId })
    );

    // ─── ARCHIVES ─────────────────────────────────────────────────────────────────

    server.registerTool(
        "get-archives",
        {
            description: "Gets all the archived tasks of a project.",
            inputSchema: z.object({
                projectId: z.string(),
            })
        },
        async ({ projectId }) => api("GET", `/archives/project/${projectId}`)
    );

    server.registerTool(
        "close-task",
        {
            description: "Closes a task and rewards the assignee (only creator is capable after submission). Moves it to archives.",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("PATCH", "/archives/task/close", { taskId })
    );

    server.registerTool(
        "delete-task",
        {
            description: "Archives the task without rewarding — does NOT delete permanently.",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("PATCH", "/archives/task/archive", { taskId })
    );

    server.registerTool(
        "restore-task",
        {
            description: "Restores an archived task as a new task.",
            inputSchema: z.object({
                taskId: z.string(),
                boardId: z.string(),
                title: z.string(),
                assigneeId: z.string(),
                dueDate: z.string().optional(),
                ethereum: z.number().min(1).describe("User can put a minimum of 1 ETH and a maximum of how much he has."),
                difficulty: z.number().min(1).max(5),
                description: z.string().optional()
            })
        },
        async ({
            taskId, boardId, title,
            assigneeId, dueDate, ethereum,
            difficulty, description
        }) => api("POST", `/archives/restore/${taskId}`, {
            boardId, title,
            assigneeId, dueDate, ethereum,
            difficulty, description
        })
    );

    server.registerTool(
        "delete-task-permanently",
        {
            description: "Deletes the archived task permanently.",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("DELETE", `/archives/task/${taskId}`)
    );

    server.registerTool(
        "delete-tasks-permanently",
        {
            description: "Deletes archived tasks in bulk permanently.",
            inputSchema: z.object({
                projectId: z.string(),
                taskIds: z.array(z.string()),
            })
        },
        async ({ projectId, taskIds }) => api("DELETE", "/archives/tasks", { projectId, taskIds })
    );

    // ─── MARKETS ──────────────────────────────────────────────────────────────────

    server.registerTool(
        "open-bidding",
        {
            description: "Puts the task on auction and opens bidding.",
            inputSchema: z.object({
                taskId: z.string(),
                endsAt: z.string()
            })
        },
        async ({ taskId, endsAt }) => api("POST", `/auction/task/${taskId}`, { endsAt })
    );

    server.registerTool(
        "get-auction-data",
        {
            description: "Gets auction details for a specific task.",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("GET", `/auction/task/${taskId}`)
    );

    server.registerTool(
        "get-tasks-auction",
        {
            description: "Get all tasks currently on the auction market for a project.",
            inputSchema: z.object({
                projectId: z.string(),
            })
        },
        async ({ projectId }) => api("GET", `/auction/project/${projectId}`)
    );

    server.registerTool(
        "place-bid",
        {
            description: "Places a bid on task in a project marketplace.",
            inputSchema: z.object({
                taskId: z.string(),
                amount: z.number().min(1)
            })
        },
        async ({ taskId, amount }) => api("PATCH", `/auction/task/${taskId}`, { amount })
    );

    server.registerTool(
        "choose-your-winner",
        {
            description: "Manually choose a winner from the users who bid on your task.",
            inputSchema: z.object({
                taskId: z.string(),
                winnerId: z.string()
            })
        },
        async ({ taskId, winnerId }) => api("PATCH", `/auction/task/${taskId}/close`, { winnerId })
    );

    server.registerTool(
        "close-auction",
        {
            description: "Take the task off the marketplace and remain assignee to it.",
            inputSchema: z.object({
                taskId: z.string(),
            })
        },
        async ({ taskId }) => api("DELETE", `/auction/task/${taskId}`)
    );

    // ─── LEADERBOARDS ─────────────────────────────────────────────────────────────

    server.registerTool(
        "get-leaderboard",
        {
            description: "Gets the weekly XP leaderboard for a project. Specify a limit to get top N users, or omit for all members.",
            inputSchema: z.object({
                projectId: z.string(),
                limit: z.number().min(1).optional()
            })
        },
        async ({ projectId, limit }) => {
            const query = limit ? `?limit=${limit}` : "";
            return api("GET", `/leaderboards/project/${projectId}${query}`)
        }
    );

    // ─── INBOX ────────────────────────────────────────────────────────────────────

    server.registerTool(
        "get-inbox",
        {
            description: "Gets all notifications/mails for the logged-in user.",
            inputSchema: z.object({})
        },
        async () => api("GET", "/inbox/user")
    );

    server.registerTool(
        "mark-notification-read",
        {
            description: "Marks a single notification as read.",
            inputSchema: z.object({
                mailId: z.string()
            })
        },
        async ({ mailId }) => api("PATCH", "/inbox/read", { mailId })
    );

    server.registerTool(
        "mark-multiple-read",
        {
            description: "Marks multiple notifications as read at once.",
            inputSchema: z.object({
                selected: z.array(z.string()).describe("Array of notification IDs to mark as read.")
            })
        },
        async ({ selected }) => api("PATCH", "/inbox/read-multiple", { selected })
    );

    server.registerTool(
        "delete-notifications",
        {
            description: "Deletes selected notifications permanently.",
            inputSchema: z.object({
                selected: z.array(z.string()).describe("Array of notification IDs to delete.")
            })
        },
        async ({ selected }) => api("PATCH", "/inbox/delete", { selected })
    );

    // ─── CHATS ────────────────────────────────────────────────────────────────────

    server.registerTool(
        "get-chats",
        {
            description: "Gets all chats for the logged-in user.",
            inputSchema: z.object({})
        },
        async () => api("GET", "/messages/user")
    );

    server.registerTool(
        "send-message",
        {
            description: "Starts or continues a chat with a user. Optionally sends a message.",
            inputSchema: z.object({
                userId: z.string().describe("The ID of the user to chat with."),
                content: z.string().optional().describe("The message content to send.")
            })
        },
        async ({ userId, content }) => api("POST", `/messages/user/${userId}`, { content })
    );

    server.registerTool(
        "get-chat",
        {
            description: "Gets full chat details including all messages by chat ID.",
            inputSchema: z.object({
                chatId: z.string()
            })
        },
        async ({ chatId }) => api("GET", `/messages/chat/${chatId}`)
    );

    server.registerTool(
        "hide-chat",
        {
            description: "Hides a chat from the logged-in user's chat list.",
            inputSchema: z.object({
                chatId: z.string()
            })
        },
        async ({ chatId }) => api("PATCH", `/messages/chat/${chatId}`)
    );
    
}
