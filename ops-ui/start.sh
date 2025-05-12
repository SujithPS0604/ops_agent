#!/bin/bash

# Start the MCP server in the background
cd ..
node mcp-server-sse.js &
MCP_SERVER_PID=$!

# Wait a moment to ensure the server starts
sleep 2

# Start the React application
cd mcp-ui
npm start

# When the React app is stopped, also stop the MCP server
kill $MCP_SERVER_PID