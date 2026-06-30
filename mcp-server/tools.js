import { email, z } from "zod";
import { authToken, BASE, setAuthToken } from "./config";

export function tools(server, api) {

    // ─── AUTH ─────────────────────────────────────────────────────────────────────

    server.registerTool(
        "login",
        {
            description: "Logs in user with the given credentials and stores the JWT for the session.",
            inputSchema: {
                email: z.string(),
                password: z.string()
            }
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
            inputSchema: {
                email: z.string(),
                firstname: z.string(),
                lastname: z.string(),
                password: z.string()
            }
        },
        async ({ email, firstname, lastname, password }) => {
            const res = await fetch(`${BASE}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, firstname, lastname, password })
            })
            const data = await res.json();
            if (data.token) setAuthToken(data.token);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }]
            };
        }
    )

    // ─── USER ─────────────────────────────────────────────────────────────────────

    server.registerTool(
        "get-me",
        {
            description: "Gets the currently logged in user.",
            inputSchema: {}
        },
        async () => api("GET", "/users/user")
    )

    server.registerTool(
        "get-user-by-id",
        {
            description: "Gets user by id.",
            inputSchema: {
                userId: z.string()
            }
        },
        async ({ userId }) => api("GET", `/users/id/${userId}`)
    )

    server.registerTool(
        "get-user-by-email",
        {
            description: "Gets user by email.",
            inputSchema: {
                email: z.string()
            }
        },
        async ({ email }) => api("GET", `/users/email/${email}`)
    )

    server.registerTool(
        "edit-user",
        {
            description: "Edits user's firstname, lastname, or profile image.",
            inputSchema: {
                firstname: z.string().optional(),
                lastname: z.string().optional(),
                image: z.object({
                    mimeType: z.string(),
                    data: z.string(),
                }).optional()
            }
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
    )

    server.registerTool(
        "update-mood",
        {
            description: "Updates the current mood of the user. Can be ANGRY, CRYING, SAD, NORMAL, OKAY, HAPPY and ECSTATIC.",
            inputSchema: {
                mood: z.enum(["ANGRY", "CRYING", "SAD", "NORMAL", "OKAY", "HAPPY", "ECSTATIC"])
            }
        },
        async ({ mood }) => api("PATCH", "/users/user/mood", { mood })
    )

    server.registerTool(
        "update-password",
        {
            description: "Updates user password. The users gives two passwords, his current and a newer one.",
            inputSchema: {
                currentPassword: z.string().describe("If this is wrong, no need to continue"),
                newPassword: z.string()
            }
        },
        async ({ currentPassword, newPassword }) => api("PATCH", "/users/user/change-password", { currentPassword, newPassword })
    )

    server.registerTool(
        "delete-user",
        {
            description: "Deletes the current user. If it can't, explain the reason briefly.",
            inputSchema: {}
        },
        async () => api("DELETE", "/users/user")
    )

    // ─── PROJECTS ─────────────────────────────────────────────────────────────────

    server.registerTool(
        "create-project",
        {
            description: "Creates a new project.",
            inputSchema: {
                name: z.string(),
                image: z.object({
                    mimeType: z.string(),
                    data: z.string(),
                }).optional()
            }
        },
        async ({ name, image }) => api("POST", "/projects", { name, image })
    )

    server.registerTool(
        "get-all-projects",
        {
            description: "Gets all the projects in the database.",
            inputSchema: {}
        },
        async () => api("GET", "/projects/")
    )

    server.registerTool(
        "get-user-projects",
        {
            description: "Gets the projects the current user is enrolled in.",
            inputSchema: {}
        },
        async () => api("GET", "/projects/user")
    )

    server.registerTool(
        "get-project-by-id",
        {
            description: "Gets a project by id.",
            inputSchema: {
                projectId: z.string()
            }
        },
        async ({ projectId }) => api("GET", `/projects/project/${projectId}`)
    )

    server.registerTool(
        "edit-project",
        {
            description: "Edits the project name or project image.",
            inputSchema: {
                projectId: z.string(),
                name: z.string().optional(),
                image: z.object({
                    mimeType: z.string(),
                    data: z.string(),
                }).optional()
            }
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
    )

    server.registerTool(
        "delete-project",
        {
            description: "Deletes a project (owner only, must have no other members).",
            inputSchema: {
                projectId: z.string()
            }
        },
        async ({ projectId }) => api("DELETE", `/projects/project/${projectId}`)
    )

    // ─── MEMBERSHIPS ──────────────────────────────────────────────────────────────

    server.registerTool(
        "leave-project",
        {
            description: "Leaves the project for current user.",
            inputSchema: {
                projectId: z.string()
            }
        },
        async ({ projectId }) => api("DELETE", "/memberships/leave", { projectId })
    )

    server.registerTool(
        "remove-from-project",
        {
            description: "Removes user/users from the project (only OWNER is capable).",
            inputSchema: {
                projectId: z.string(),
                memberIds: z.array(z.string())
            }
        },
        async ({ projectId, memberIds }) => api("DELETE", "/memberships/remove", { projectId, memberIds })
    )

    server.registerTool(
        "get-user-projects-with-roles",
        {
            description: "Gets only current user projects with role.",
            inputSchema: {}
        },
        async () => api("GET", "/memberships/user")
    )

    server.registerTool(
        "get-the-team",
        {
            description: "Gets the members of the project with roles.",
            inputSchema: {
                projectId: z.string()
            }
        },
        async ({ projectId }) => api("GET", `/memberships/project/${projectId}`)
    )

    server.registerTool(
        "request-ownership-transfer",
        {
            description: "Ask an admin to take over the project ownership (only OWNER is capable).",
            inputSchema: {
                projectId: z.string(),
                adminId: z.string()
            }
        },
        async ({ projectId, adminId }) => api("POST", "/memberships/transfer-ownership/offer", { projectId, adminId })
    )

    server.registerTool(
        "respond-ownership-transfer",
        {
            description: "Respond to ownership transfer request (only targeted ADMIN is capable).",
            inputSchema: {
                offerId: z.string()
            }
        },
        async ({ offerId }) => api("GET", `/memberships/transfer-ownership/${offerId}`)
    )

    server.registerTool(
        "accept-ownership",
        {
            description: "Accept ownership of the project (only targeted ADMIN is capable).",
            inputSchema: {
                offerId: z.string()
            }
        },
        async ({ offerId }) => api("PATCH", "/memberships/transfer-ownership/accept", { offerId })
    )

    server.registerTool(
        "decline-ownership",
        {
            description: "Decline ownership of the project (only targeted ADMIN is capable).",
            inputSchema: {
                offerId: z.string()
            }
        },
        async ({ offerId }) => api("PATCH", "/memberships/transfer-ownership/decline", { offerId })
    )

    server.registerTool(
        "promote-member",
        {
            description: "Promotes a member to an admin.",
            inputSchema: {
                membershipId: z.string()
            }
        },
        async ({ membershipId }) => api("PATCH", "/memberships/change-role/promote", { membershipId })
    )

    server.registerTool(
        "demote-admin",
        {
            description: "Demotes an admin to a member.",
            inputSchema: {
                membershipId: z.string()
            }
        },
        async ({ membershipId }) => api("PATCH", "/memberships/change-role/demote", { membershipId })
    )

    // ─── INVITATIONS ──────────────────────────────────────────────────────────────

    server.registerTool(
        "invite-user",
        {
            description: "Invites a user to a project via his email.",
            inputSchema: {
                email: z.string(),
                projectId: z.string(),
            }
        },
        async ({ email, projectId }) => api("POST", "/invitations/invite", { email, projectId })
    )

    server.registerTool(
        "get-invite-data",
        {
            description: "Gets the invitation data.",
            inputSchema: {
                inviteId: z.string()
            }
        },
        async ({ inviteId }) => api("GET", `/invitations/${inviteId}`)
    )

    server.registerTool(
        "accept-invitation",
        {
            description: "Accepts the invitation to the project.",
            inputSchema: {
                invitationId: z.string()
            }
        },
        async ({ invitationId }) => api("PATCH", "/invitations/accept", { invitationId })
    )

    server.registerTool(
        "decline-invitation",
        {
            description: "Declines the invitation to the project.",
            inputSchema: {
                invitationId: z.string()
            }
        },
        async ({ invitationId }) => api("PATCH", "/invitations/decline", { invitationId })
    )

    // ─── BOARDS ───────────────────────────────────────────────────────────────────

    server.registerTool(
        "create-board",
        {
            description: "Creates a board in the project with a name and an optional hex value for its color.",
            inputSchema: {
                projectId: z.string(),
                name: z.string(),
                color: z.string().optional()
            }
        },
        async ({ projectId, name, color }) => api("POST", "/boards/board", { projectId, name, color })
    )

    server.registerTool(
        "get-boards",
        {
            description: "Gets all the boards of the project.",
            inputSchema: {
                projectId: z.string(),
            }
        },
        async ({ projectId }) => api("GET", `/boards/project/${projectId}`, { projectId })
    )

    server.registerTool(
        "edit-board",
        {
            description: "Edits the attributes of a board.",
            inputSchema: {
                projectId: z.string(),
                boardId: z.string(),
                name: z.string().optional(),
                color: z.string().optional()
            }
        },
        async ({ projectId, boardId, name, color }) => api("PATCH", `/boards/board/${boardId}`, { projectId, name, color })
    )

    server.registerTool(
        "move-board",
        {
            description: "Moves a board left or right.",
            inputSchema: {
                projectId: z.string(),
                boardId: z.string(),
                newPosition: z.number().min(0)
            }
        },
        async ({ projectId, boardId, newPosition }) => api("PATCH", `/boards/move/${boardId}`, { projectId, newPosition })
    )

    server.registerTool(
        "delete-board",
        {
            description: "Deletes a board of the project.",
            inputSchema: {
                boardId: z.string(),
            }
        },
        async ({ boardId }) => api("DELETE", `/boards/board/${boardId}`)
    )

    // ─── TASKS ────────────────────────────────────────────────────────────────────

    server.registerTool(
        "create-task",
        {
            description: "Creates a task inside a project under a board.",
            inputSchema: {
                projectId: z.string(),
                boardId,
                title,
                description = "",
                assigneeId,
                dueDate = null,
                ethereum = 1,
                difficulty = 1
                    }
        },
        async ({ boardId }) => api("DELETE", `/tasks/board/${boardId}`)
    )
}
