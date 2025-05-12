#!/bin/bash
set -e

echo "Initializing OpenSearch with sample logs..."

# Wait for OpenSearch to be available
until curl -s http://opensearch:9200/_cluster/health > /dev/null; do
  echo "Waiting for OpenSearch to start..."
  sleep 5
done

# Create logs index
curl -X PUT "http://opensearch:9200/logs" -H 'Content-Type: application/json' -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "service": { "type": "keyword" },
      "trace_id": { "type": "keyword" }
    }
  }
}'

echo "Creating sample logs..."

# Generate some sample log entries
CURRENT_TIMESTAMP=$(date +%s000)

# Sample log entries
curl -X POST "http://opensearch:9200/logs/_bulk" -H 'Content-Type: application/ndjson' -d '
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 300)))'"  , "level": "INFO", "message": "Application started successfully", "service": "api-gateway", "trace_id": "trace-123456"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 240)))'"  , "level": "INFO", "message": "Received request for order processing", "service": "order-service", "trace_id": "trace-123457"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 180)))'"  , "level": "ERROR", "message": "Failed to process payment", "service": "payment-service", "trace_id": "trace-123457"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 120)))'"  , "level": "WARN", "message": "Retry attempt 1 for order processing", "service": "order-service", "trace_id": "trace-123458"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 60)))'"   , "level": "INFO", "message": "Order processed successfully", "service": "order-service", "trace_id": "trace-123458"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000)))'"        , "level": "INFO", "message": "Payment completed", "service": "payment-service", "trace_id": "trace-123458"}
'

echo "OpenSearch initialization completed!" 