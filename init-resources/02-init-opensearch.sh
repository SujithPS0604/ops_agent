#!/bin/bash
set -e

echo "Initializing OpenSearch with sample logs..."

# Wait for OpenSearch to be available
until curl -s http://opensearch:9200/_cluster/health > /dev/null; do
  echo "Waiting for OpenSearch to start..."
  sleep 5
done

# Delete the index template
curl -X DELETE "http://opensearch:9200/_index_template/cwl_template"

# Delete the index
curl -X DELETE "http://opensearch:9200/cwl-logs"

# Create index template for cwl* indices
curl -X PUT "http://opensearch:9200/_index_template/cwl_template" -H 'Content-Type: application/json' -d '{
  "index_patterns": ["cwl*"],
  "template": {
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
        "trace_id": { "type": "text" },
        "event_id": { "type": "text" }
      }
    }
  }
}'

# Create logs index
curl -X PUT "http://opensearch:9200/cwl-logs" -H 'Content-Type: application/json'

echo "Creating sample logs..."

# Generate some sample log entries
CURRENT_TIMESTAMP=$(date +%s000)

# Sample log entries
curl -X POST "http://opensearch:9200/cwl-logs/_bulk" -H 'Content-Type: application/json' -d '
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 350)))'"  , "level": "INFO", "message": "Received ORDER_CREATED event", "service": "order-processor", "trace_id": "ce79cdee-0e35-4d47-84b0-9d3247266382", "event_id": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 345)))'"  , "level": "INFO", "message": "Processing order 60c5cce3-61a3-291e-91a0-d4d52ff6494d", "service": "order-processor", "trace_id": "ce79cdee-0e35-4d47-84b0-9d3247266382", "event_id": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 340)))'"  , "level": "ERROR", "message": "Failed to validate order data: Invalid product configuration", "service": "order-processor", "trace_id": "ce79cdee-0e35-4d47-84b0-9d3247266382", "event_id": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 338)))'"  , "level": "WARN", "message": "Retry 1 - Processing order 60c5cce3-61a3-291e-91a0-d4d52ff6494d", "service": "order-processor", "trace_id": "ce79cdee-0e35-4d47-84b0-9d3247266382", "event_id": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 335)))'"  , "level": "ERROR", "message": "Failed again - Database connection timeout", "service": "order-processor", "trace_id": "ce79cdee-0e35-4d47-84b0-9d3247266382", "event_id": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 330)))'"  , "level": "WARN", "message": "Retry 2 - Processing order 60c5cce3-61a3-291e-91a0-d4d52ff6494d", "service": "order-processor", "trace_id": "ce79cdee-0e35-4d47-84b0-9d3247266382", "event_id": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 325)))'"  , "level": "ERROR", "message": "Max retries exceeded - Moving message to DLQ", "service": "order-processor", "trace_id": "ce79cdee-0e35-4d47-84b0-9d3247266382", "event_id": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb"}

{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 250)))'"  , "level": "INFO", "message": "Received ORDER_CREATED event", "service": "order-processor", "trace_id": "fe89cdee-1e35-4d47-84b0-9d3247266390", "event_id": "6778d0d2-290a-4f92-b776-7cf5fb26a1ec"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 245)))'"  , "level": "INFO", "message": "Processing order 70d6dde4-72b4-382f-92b1-e5e63ff7505e", "service": "order-processor", "trace_id": "fe89cdee-1e35-4d47-84b0-9d3247266390", "event_id": "6778d0d2-290a-4f92-b776-7cf5fb26a1ec"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 240)))'"  , "level": "ERROR", "message": "Failed to process payment: Insufficient funds", "service": "payment-service", "trace_id": "fe89cdee-1e35-4d47-84b0-9d3247266390", "event_id": "6778d0d2-290a-4f92-b776-7cf5fb26a1ec"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 235)))'"  , "level": "WARN", "message": "Retry 1 - Processing payment for order 70d6dde4-72b4-382f-92b1-e5e63ff7505e", "service": "payment-service", "trace_id": "fe89cdee-1e35-4d47-84b0-9d3247266390", "event_id": "6778d0d2-290a-4f92-b776-7cf5fb26a1ec"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 230)))'"  , "level": "ERROR", "message": "Payment failed again - Payment gateway unavailable", "service": "payment-service", "trace_id": "fe89cdee-1e35-4d47-84b0-9d3247266390", "event_id": "6778d0d2-290a-4f92-b776-7cf5fb26a1ec"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 225)))'"  , "level": "ERROR", "message": "Max retries exceeded - Moving message to DLQ", "service": "payment-service", "trace_id": "fe89cdee-1e35-4d47-84b0-9d3247266390", "event_id": "6778d0d2-290a-4f92-b776-7cf5fb26a1ec"}

{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 150)))'"  , "level": "INFO", "message": "Received ORDER_CANCELLED event", "service": "order-cancellation", "trace_id": "ae59cdee-2e45-5d57-95b0-9d3247266456", "event_id": "7899d0d2-390a-5f93-c886-7cf5fb26a1fd"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 148)))'"  , "level": "INFO", "message": "Processing cancellation for order 90e7eef5-83c5-493g-93c2-f6f74gg8616f", "service": "order-cancellation", "trace_id": "ae59cdee-2e45-5d57-95b0-9d3247266456", "event_id": "7899d0d2-390a-5f93-c886-7cf5fb26a1fd"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 145)))'"  , "level": "ERROR", "message": "Failed to cancel order: Order already shipped", "service": "order-cancellation", "trace_id": "ae59cdee-2e45-5d57-95b0-9d3247266456", "event_id": "7899d0d2-390a-5f93-c886-7cf5fb26a1fd"}
{"index":{}}
{"@timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z" -d @$((CURRENT_TIMESTAMP/1000 - 140)))'"  , "level": "WARN", "message": "Moving cancellation request to DLQ for manual review", "service": "order-cancellation", "trace_id": "ae59cdee-2e45-5d57-95b0-9d3247266456", "event_id": "7899d0d2-390a-5f93-c886-7cf5fb26a1fd"}
'

echo "OpenSearch initialization completed!" 