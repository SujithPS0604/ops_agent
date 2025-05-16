import {MultiServerMCPClient} from "@langchain/mcp-adapters";
import {createReactAgent} from "@langchain/langgraph/prebuilt";
import {ChatOllama} from "@langchain/ollama";

/**
 * A service that interacts with the MCP agent
 */
export async function invokeMcpAgent(prompt) {
  // Create client and connect to server
  const client = new MultiServerMCPClient({
    // Global tool configuration options
    throwOnLoadError: true,
    prefixToolNameWithServerName: true,
    additionalToolNamePrefix: "mcp",

    // Server configuration
    mcpServers: {
      opsAutomation: {
        transport: "sse",
        url: process.env.MCP_AGENT_URL,
        useNodeEventSource: true,
        reconnect: {
          enabled: true,
          maxAttempts: 5,
          delayMs: 2000,
        },
      },
    },
  });

  try {
    const tools = await client.getTools();

    // Create an Ollama model
    const model = new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL,
      model: process.env.OLLAMA_MODEL,
    });

    // Create the React agent
    const agent = createReactAgent({
      llm: model,
      tools,
    });

    // Run the agent with the provided prompt
    return await agent.invoke({
      messages: [{role: "user", content: `/no_think ${prompt}`}],
      return_intermediate_steps: true,
    });
  } catch (error) {
    console.error("Error during agent execution:", error);
    // Tools throw ToolException for tool-specific errors
    if (error.name === "ToolException") {
      console.error("Tool execution failed:", error.message);
    }
    throw error;
  } finally {
    // Always close the client connection
    await client.close();
  }
}