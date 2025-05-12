# LocalStack AWS Environment

This repository contains a Docker Compose setup for LocalStack with AWS services and OpenSearch for local development and testing.

## Services

- **LocalStack**: Emulates AWS services locally
  - SQS queues and DLQs defined in `dlqs.json`
- **OpenSearch**: Search and analytics engine
- **OpenSearch Dashboards**: UI for interacting with OpenSearch
- **mcp-server-sse**: Server-Sent Events implementation for MCP communication
- **mcp-api-server**: API server for handling requests
- **ops-ui**: React-based frontend application

## Getting Started

### Prerequisites

- Docker and Docker Compose
- AWS CLI (optional for manual testing)

### Running the Environment

1. Start all services:

```bash
docker-compose up -d
```

2. Check if services are running:

```bash
docker-compose ps
```

### Accessing Services

- **LocalStack AWS services**: http://localhost:4566
- **OpenSearch**: http://localhost:9200
- **OpenSearch Dashboards**: http://localhost:5601
- **Ops UI**: http://localhost:3000
- **MCP API Server**: http://localhost:3002
- **MCP SSE Server**: http://localhost:3001

## Working with SQS Queues

The following queues and Dead Letter Queues (DLQs) are automatically created from `dlqs.json`:

- order-queue → order-queue-dlq
- order-cancellation-queue → order-cancellation-queue-dlq

### Testing SQS Locally

```bash
# List queues
aws --endpoint-url=http://localhost:4566 sqs list-queues

# Send a message to a queue
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/order-queue \
  --message-body '{"orderId": "123456", "status": "created"}'

# Receive messages from a queue
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/order-queue
```

## Working with OpenSearch

Sample logs have been preloaded into the OpenSearch instance. You can access them via the OpenSearch API or using OpenSearch Dashboards.

### Sample Query

```bash
# Search all logs
curl -X GET "http://localhost:9200/logs/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "match_all": {}
  }
}'

# Search for error logs
curl -X GET "http://localhost:9200/logs/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "match": {
      "level": "ERROR"
    }
  }
}'
```

## Using the Ops UI

The Ops UI provides a user-friendly interface for interacting with all services:

1. Access the UI at http://localhost:3000
2. Use the interface to:
   - Monitor SQS queues and DLQs
   - Search logs in OpenSearch
   - Perform operations through the MCP API

## Shutting Down

To stop all services:

```bash
docker-compose down
```

To remove all data (including volumes):

```bash
docker-compose down -v
``` 