import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let client = null;

async function getClient() {
    if (client) return client;

    const transport = new StdioClientTransport({
        command: "node",
        args: [path.join(__dirname, "../mcp-server.js")]
    });

    client = new Client({ name: "vynce-client", version: "1.0.0" });
    await client.connect(transport);
    return client;
}


export async function read(uri) {
    const _client = await getClient();
    const result = await _client.readResource({ uri });
    return result.contents[0].text;
}

export async function list() {
    const _client = await getClient();
    const result = await _client.listResources();
    return result.resources;
}
