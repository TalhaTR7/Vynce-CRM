import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";


const transport = new StdioClientTransport({
    command: "node",
    args: ["../mcp-server.js"]
});

const client = new Client({ name: "vynce-client", version: "1.0.0" });
await client.connect(transport);

export async function read(uri) {
    const result = await client.readResource({ uri });
    return result.contents[0].text;
}

export async function list() {
    const result = await client.listResources();
    return result.resources;
}
