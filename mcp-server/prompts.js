import { z } from "zod";
import { PORT } from "./config.js";


const dedent = (str) => str.replace(/^\s+/gm, "").trim();

export function prompts(server) {

    server.registerPrompt(
        "create-project",
        {
            description: "Creates a project with a given name with the current user as owner.",
            argsSchema: {
                name: z.string()
            }
        },
        async ({ name }) => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: dedent(`
                    I want to create a new project called "${name}". Call the \`create-project\` tool with this name.
                    After it's created, confirm with the project name and its ID. Also provide me with a clickable
                    markdown link to visit it:
                        [Visit ${name}](\`http://localhost:${PORT}/project/{projectId}\`).
                `)
                }
            }]
        })
    );

    server.registerPrompt(
        "add-board",
        {
            description: "Adds a board with a given name and color to the project.",
            argsSchema: {
                project: z.string(),
                name: z.string(),
                color: z.string().optional()
            }
        },
        async ({ project, name, color }) => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: dedent(`
                    I want to add a board to one of my projects. Start by calling \`get-user-projects\` to find the
                    project named "${project}" and extract its ID. Make sure I am an OWNER or ADMIN of that project
                    before proceeding — if I'm not, stop and let me know.
                
                    Create a board named "${name}" inside that project. ${color
                            ? `Use "${color}" as the board color in hex.`
                            : `Use #CCCCCC as the default color.`
                        }
                
                    Confirm the board was created and provide me with a clickable markdown link to visit the project:
                        [Visit ${project}](\`http://localhost:${PORT}/project/{projectId}\`).
                `)
                }
            }]
        })
    );

    server.registerPrompt(
        "create-task",
        {
            description: "Creates a task in a given project under a given board.",
            argsSchema: {
                project: z.string(),
                board: z.string(),
                description: z.string(),
                ethereum: z.number().min(1).optional(),
                difficulty: z.number().min(1).max(5).optional(),
                duedate: z.string().optional(),
                assignee: z.string()
            }
        },
        async ({ project, board, description, ethereum, difficulty, duedate, assignee }) => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: dedent(`
                    I want to create a task in my Vynce project. Start by calling \`get-user-projects\` to get all my
                    projects, then find the one named "${project}" and extract its ID. Make sure I am an OWNER or ADMIN
                    of that project before proceeding — if I'm not, stop and let me know.
                
                    Next, get the boards for that project and find the board named "${board}" to get its board ID. Then
                    call \`get-the-team\` to get all project members and find the one whose full name matches
                    "${assignee}" — that person is the assignee. Once you have their ID, call \`get-user-by-id\` on
                    them to check their current mood, which affects the ETH bounty multiplier.
                
                    Now prepare the task details. Come up with a concise and appropriate title based on my description:
                        "${description}"
                
                    If my provided description is not clear or is vague, ask me questions. Write a clear and detailed
                    task description expanding on what I provided.
                    
                    ${duedate
                            ? `Set the due date to ${duedate}.`
                            : `Leave the due date empty or calculate based on my provided description.`
                        }
                    ${ethereum
                            ? `Set the ETH bounty to ${ethereum}.`
                            : `Choose an appropriate ETH bounty based on the complexity of the task.`
                        }
                    ${difficulty
                            ? `Set the difficulty to ${difficulty}.`
                            : `Pick an appropriate difficulty between 1 and 5 based on the task.`
                        }
                    
                    Finally, call \`create-task\` with all the collected IDs and values. Confirm to me that the task
                    was created, including its title and ID. Also provide me with a clickable markdown link to visit
                    the task page:
                        [Visit "{task title}"](\`http://localhost:${PORT}/task/{taskId}\`).
                `)
                }
            }]
        })
    );

    server.registerPrompt(
        "chat",
        {
            description: "Start or continue a chat with a user",
            argsSchema: {
                user: z.string(),
                content: z.string()
            }
        },
        async ({ user, content }) => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: dedent(`
                    I want to send a message to ${user}. Start by calling \`get-chats\` to get all my existing chats.
                    Look through the chat list and check if any chat has an otherUser whose name matches "${user}". If
                    found, extract their user ID from \`otherUser._id\`.
                
                    If "${user}" is not found in my chat list, ask me to provide their Vynce email address. Once I
                    provide it, call \`get-user-by-email\` to look them up. If the user exists, extract their ID. If no
                    user is found, inform me that they don't have a Vynce account and stop.
                
                    Now that you have the user's ID, compose a message based on my content below and show it to me
                    before sending. Ask me to confirm before dispatching:
                        "${content}"
                
                    Once I confirm, call \`send-message\` with the user's ID and the composed message. Also provide me
                    with an option to see it for myself:
                        [View here](\`http://localhost:${PORT}/chat/{chatId}\`).
                `)
                }
            }]
        })
    );

    server.registerPrompt(
        "learn",
        {
            description: "Answers the user query by looking it up in Vynce resources.",
            argsSchema: {
                query: z.string()
            }
        },
        async ({ query }) => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: dedent(`
                    I have a question about how Vynce works: "${query}"
                
                    From the following resources, pick whichever fits the best to answer my query and read it using the
                    \`read-resource\` tool:
                        - role-permissions
                        - xp-and-gamification-rules
                        - mood-values
                        - auction-rules
                
                    Answer my question based on what you find. If it's not covered, answer from general knowledge and
                    let me know. Also give me an option to go to the full resource page:
                        [Read the full resource] (\`http://localhost:${PORT}/resources/{resource}\`)
                `)
                }
            }]
        })
    );

}