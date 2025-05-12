import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import {z} from "zod";
import {getMessageCount, receiveAllMessagesWithMessageIdFromSqs} from "./aws/sqs-client.js";
import {search} from "./aws/os-client.js";
import {run as generateDlqSummary} from "./aws/dlq-summary.js";
import {getQueueUrl} from "./aws/common.js";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

// Map to store transports by session ID
let transport;

const setupTools = async (server) => {
    // Tool definitions remain unchanged
    server.tool("fetchDlqMessages", {
        queueUrl: z.string().describe("The URL of the SQS DLQ"),
        visibilityTimeout: z.string().optional().default("30").describe("Visibility timeout for the messages in seconds"),
    }, async ({ queueUrl, visibilityTimeout }) => {
        try {
            const messages = await receiveAllMessagesWithMessageIdFromSqs(queueUrl, parseInt(visibilityTimeout));
            return { content: [{ type: "text", text: JSON.stringify(messages, null, 2) }] };
        } catch (error) {
            console.error("Error fetching DLQ messages:", error);
            return { success: false, error: error.message };
        }
    });

    server.tool("fetchDlqMessagesByQueueName", {
        queueName: z.string().describe("The name of the SQS DLQ"),
        visibilityTimeout: z.string().optional().default("30").describe("Visibility timeout for the messages in seconds"),
    }, async ({ queueName, visibilityTimeout }) => {
        try {
            const queueUrl = getQueueUrl(queueName);
            const messages = await receiveAllMessagesWithMessageIdFromSqs(queueUrl, parseInt(visibilityTimeout));
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, queueUrl, messages, count: messages.length }, null, 2),
                }],
            };
        } catch (error) {
            console.error(`Error fetching messages from DLQ ${queueName}:`, error);
            return { success: false, error: error.message };
        }
    });

    server.tool("getQueueMessageCount", {
        queueName: z.string().describe("The name of the SQS queue"),
    }, async ({ queueName }) => {
        try {
            const queueUrl = getQueueUrl(queueName);
            const count = await getMessageCount(queueUrl);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, queueName, queueUrl, count }, null, 2),
                }],
            };
        } catch (error) {
            console.error(`Error getting message count for queue ${queueName}:`, error);
            return { success: false, error: error.message };
        }
    });

    server.tool("fetchErrorLogs", {
        eventId: z.string().describe("The event ID to search for"),
        // size: z.number().optional().default(50).describe("The maximum number of logs to return"),
    }, async ({ eventId }) => {
        try {
            const index = "cwl*";
            const size=10;
            const query = {
                bool: {
                    must: [{ match_phrase: { eventId } }, { match_phrase: { level: "ERROR" } }],
                },
            };
            const logs = await search(index, query, size);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, eventId, logs, count: logs.length }, null, 2),
                }],
            };
        } catch (error) {
            console.error(`Error fetching logs for eventId ${eventId}:`, error);
            return { success: false, error: error.message };
        }
    });

    server.tool("listAvailableDlqs", {}, async () => {
        try {
            const dlqs = JSON.parse(fs.readFileSync("./dlqs.json", "utf-8"));
            return { content: [{ type: "text", text: JSON.stringify({ success: true, dlqs }, null, 2) }] };
        } catch (error) {
            console.error("Error listing DLQs:", error);
            return { success: false, error: error.message };
        }
    });

    server.tool("generateDlqSummary", {
        maxMessagesToFetch: z.string().optional().default("10").describe("Maximum number of messages to fetch per queue"),
        visibilityTimeout: z.string().optional().default("30").describe("Visibility timeout for the messages in seconds"),
    }, async ({ maxMessagesToFetch, visibilityTimeout }) => {
        try {
            const data = await generateDlqSummary(parseInt(maxMessagesToFetch), parseInt(visibilityTimeout));
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, messages: data, count: data.length }, null, 2),
                }],
            };
        } catch (error) {
            console.error("Error generating DLQ summary:", error);
            return { success: false, error: error.message };
        }
    });
};

const createServerAndTools = async (req, res) => {
    const transport = new SSEServerTransport("/mcp", res);
    const server = new McpServer({
        name: "OPs Automation MCP Server",
        version: "1.0.0",
    });
    try {
        await setupTools(server);
        await server.connect(transport);
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Internal server error' },
                id: null,
            });
        }
    }
    return transport;
};

app.get('/sse', async (req, res) => {
    transport = await createServerAndTools(req, res);
});

app.post('/mcp', async (req, res) => {
    console.log("POST received ");
    await transport.handlePostMessage(req, res, req.body);
});

app.listen(3001, () => {
    console.log("MCP server is running on port 3001");
});

console.log("MCP server is running with HTTP transport on port 3001");