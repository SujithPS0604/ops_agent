import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import {z} from "zod";
import {getMessageCount, receiveAllMessagesWithMessageIdFromSqs} from "./aws/sqs-client.js";
import {search} from "./aws/os-client.js";
import {run as generateDlqSummary} from "./aws/dlq-summary.js";
import {getQueueUrl} from "./aws/common.js";
import {getConfig} from "./config.js";
import {info, error, logToConsole} from "./utils/logger.js";
import fs from "fs";
import { getOrders, getOrderTableByOrderId } from "./aws/dynamodb.js";

const app = express();
app.use(express.json());
app.use(cors());

// Add logging middleware
app.use((req, res, next) => {
    info(`${req.method} ${req.url}`);
    next();
});

// Map to store transports by session ID
let transport;

const setupTools = async (server) => {
    // Tool definitions remain unchanged
    server.tool("fetchDlqMessages", "Retrieves messages from a Dead Letter Queue using its URL.", {
        queueUrl: z.string().describe("The URL of the SQS DLQ"),
        visibilityTimeout: z.string().optional().default("30").describe("Visibility timeout for the messages in seconds"),
    }, async ({ queueUrl, visibilityTimeout }) => {
        try {
            info(`Fetching messages from DLQ ${queueUrl}`);
            const messages = await receiveAllMessagesWithMessageIdFromSqs(queueUrl, parseInt(visibilityTimeout));
            info(`Fetched ${messages.length} messages from DLQ`);
            return { content: [{ type: "text", text: JSON.stringify(messages, null, 2) }] };
        } catch (err) {
            error("Error fetching DLQ messages:", err);
            return { success: false, error: err.message };
        }
    });

    server.tool("fetchDlqMessagesByQueueName", "Retrieves messages from a Dead Letter Queue using its name.", {
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
        } catch (err) {
            error(`Error fetching messages from DLQ ${queueName}:`, err);
            return { success: false, error: err.message };
        }
    });

    server.tool("getQueueMessageCount", "Gets the number of messages in an SQS queue.", {
        queueName: z.string().describe("The name of the SQS queue"),
    }, async ({ queueName }) => {
        try {
            const queueUrl = getQueueUrl(queueName);
            info(`Queue URL for ${queueName}: ${queueUrl}`);
            const count = await getMessageCount(queueUrl);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, queueName, queueUrl, count }, null, 2),
                }],
            };
        } catch (err) {
            error(`Error getting message count for queue ${queueName}:`, err);
            return { success: false, error: err.message };
        }
});

    server.tool("fetchErrorLogs", "Searches for error logs in OpenSearch, optionally filtered by trace ID and log level.", {
        traceId: z.string().optional().describe("The trace ID to search for (optional)"),
        level: z.string().optional().default("ERROR").describe("Log level to search for (default: ERROR)"),
        size: z.string().optional().default("10").describe("The maximum number of logs to return"),
    }, async ({ traceId, level, size }) => {
        try {
            const config = getConfig();
            const indexPattern = config.openSearch.indexId || "cwl*"; 
            const numSize = parseInt(size);
            
            info(`[fetchErrorLogs] Starting search for logs with level ${level} in index pattern: ${indexPattern}`);
            
            // Build the query based on provided parameters
            let queryObj = {
                bool: {
                    must: []
                }
            };
            
            // Add level filter if provided
            if (level) {
                queryObj.bool.must.push({ 
                    term: { 
                        level: level 
                    } 
                });
                info(`[fetchErrorLogs] Added level filter: ${level}`);
            }
            
            // Add traceId filter if provided
            if (traceId && traceId.trim()) {
                queryObj.bool.must.push({ 
                    match: { 
                        trace_id: traceId 
                    } 
                });
                info(`[fetchErrorLogs] Added trace_id filter: ${traceId}`);
            }
            
            // If no filters were added, search for all
            if (queryObj.bool.must.length === 0) {
                queryObj = { match_all: {} };
                info(`[fetchErrorLogs] No filters provided, using match_all query`);
            }
            
            info(`[fetchErrorLogs] Final search query:`, queryObj);
            
            const logs = await search(indexPattern, queryObj, numSize);
            info(`[fetchErrorLogs] Search results count: ${logs.length}`);
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ 
                        success: true, 
                        indexPattern,
                        query: queryObj,
                        traceId, 
                        logs, 
                        count: logs.length 
                    }, null, 2),
                }],
            };
        } catch (err) {
            error(`[fetchErrorLogs] Error fetching logs:`, err);
            return { 
                content: [{
                    type: "text",
                    text: JSON.stringify({ 
                        success: false, 
                        error: err.message,
                        stack: err.stack
                    }, null, 2),
                }],
            };
        }
    });

    server.tool("listAvailableDlqs", "Lists all available Dead Letter Queues configured in the system.", {}, async () => {
        try {
            const dlqs = JSON.parse(fs.readFileSync("./dlqs.json", "utf-8"));
            return { content: [{ type: "text", text: JSON.stringify({ success: true, dlqs }, null, 2) }] };
        } catch (err) {
            error("Error listing DLQs:", err);
            return { success: false, error: err.message };
        }
    });

    server.tool("getOrderTableByOrderId", "Gets the order table by order id.", {
        orderId: z.string().describe("The order id to search for"),
    }, async ({ orderId }) => {
        try {
            const order = await getOrderTableByOrderId(orderId);
            return { content: [{ type: "text", text: JSON.stringify({ success: true, order }, null, 2) }] };
        } catch (err) {
            error("Error getting order table by order id:", err);
            return { success: false, error: err.message };  
        }
    });

    server.tool("getOrders", "Gets all orders from the order table.", {}, async () => {
        try {
            const orders = await getOrders();
            return { content: [{ type: "text", text: JSON.stringify({ success: true, orders }, null, 2) }] };
        } catch (err) {
            error("Error getting orders:", err);
            return { success: false, error: err.message };
        }
    });


//     server.tool("generateDlqSummary", {
//         maxMessagesToFetch: z.string().optional().default("10").describe("Maximum number of messages to fetch per queue"),
//         visibilityTimeout: z.string().optional().default("30").describe("Visibility timeout for the messages in seconds"),
//     }, async ({ maxMessagesToFetch, visibilityTimeout }) => {
//         try {
//             const data = await generateDlqSummary(parseInt(maxMessagesToFetch), parseInt(visibilityTimeout));
//             return {
//                 content: [{
//                     type: "text",
//                     text: JSON.stringify({ success: true, messages: data, count: data.length }, null, 2),
//                 }],
//             };
//         } catch (err) {
//             error("Error generating DLQ summary:", err);
//             return { success: false, error: err.message };
//         }
//     }, "Generates a summary of messages across all Dead Letter Queues for analysis.");
};

const createServerAndTools = async (req, res) => {
    info('Creating MCP server and setting up tools');
    
    const transport = new SSEServerTransport("/mcp", res);
    const server = new McpServer({
        name: "OPs Automation MCP Server",
        version: "1.0.0",
    });
    
    try {
        info('Setting up tools');
        await setupTools(server);
        
        info('Connecting server to transport');
        await server.connect(transport);
        
        info('MCP server setup complete');
    } catch (err) {
        error('Error handling MCP request:', err);
        error('Error stack:', err.stack);
        
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
    info('SSE connection established');
    transport = await createServerAndTools(req, res);
});

app.post('/mcp', async (req, res) => {
    info('POST received to /mcp endpoint', req.body);
    try {
        await transport.handlePostMessage(req, res, req.body);
        info('POST message handled successfully');
    } catch (err) {
        error('Error handling POST message:', err);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Internal server error' },
                id: null,
            });
        }
    }
});

app.listen(3001, () => {
    info("MCP server is running on port 3001");
});

info("MCP server is running with HTTP transport on port 3001");