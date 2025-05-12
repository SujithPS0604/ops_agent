# Ops Agent

This project consists of a frontend UI and a backend service for operations management. The application is split into two main components:

- `ops-ui`: React-based frontend application
- `ops-agent-backend`: Node.js backend service

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

## Project Structure

```
ops-agent/
├── ops-ui/              # Frontend React application
└── ops-agent-backend/   # Backend Node.js service
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd ops-agent-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the backend:
   - Review and update `config.js` with your specific configuration
   - Ensure all required environment variables are set

4. Start the backend server:
   ```bash
   ./start-mcp-api-server.sh
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ops-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ./start.sh
   ```

## Running the Application

1. Start the backend server first:
   ```bash
   cd ops-agent-backend
   ./start-mcp-api-server.sh
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd ops-ui
   ./start.sh
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Development

### Backend Development

- The main backend files are:
  - `mcp-api-server.js`: Main API server
  - `mcp-agent.js`: Agent implementation
  - `mcp-server-sse.js`: Server-Sent Events implementation

### Frontend Development

- The frontend is built with React and uses:
  - Custom configuration through `craco.config.js`
  - Public assets in the `public/` directory
  - Source code in the `src/` directory

## Troubleshooting

1. If you encounter port conflicts:
   - Check if any other services are running on ports 3000 or 3001
   - Update the port configuration in respective config files

2. For dependency issues:
   - Delete `node_modules` directory and `package-lock.json`
   - Run `npm install` again

3. For backend connection issues:
   - Verify the backend server is running
   - Check the API endpoint configuration in the frontend

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[Add your license information here] 