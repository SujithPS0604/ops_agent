#!/bin/bash
set -e

echo "Creating SQS queues and DLQs from dlqs.json..."

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install it to continue."
    exit 1
fi

# Set AWS endpoint for LocalStack - using localhost since this runs inside the container
export AWS_ENDPOINT_URL="http://localstack:4566"
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
for i in {1..30}; do
  if aws --endpoint-url=${AWS_ENDPOINT_URL} sqs list-queues > /dev/null 2>&1; then
    echo "LocalStack is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 1
  if [ $i -eq 30 ]; then
    echo "Timed out waiting for LocalStack to be ready"
    exit 1
  fi
done

# Read from the dlqs.json file
DLQ_CONFIG=$(cat /init-resources/dlqs.json)

# Create queues and DLQs
for row in $(echo "${DLQ_CONFIG}" | jq -c '.[]'); do
  DLQ_NAME=$(echo ${row} | jq -r '.dlqName')
  QUEUE_NAME=$(echo ${row} | jq -r '.source')
  
  echo "Creating DLQ: ${DLQ_NAME}"
  aws --endpoint-url=${AWS_ENDPOINT_URL} sqs create-queue --queue-name ${DLQ_NAME}
  
  # Get DLQ ARN
  DLQ_URL=$(aws --endpoint-url=${AWS_ENDPOINT_URL} sqs get-queue-url --queue-name ${DLQ_NAME} --query 'QueueUrl' --output text)
  DLQ_ARN=$(aws --endpoint-url=${AWS_ENDPOINT_URL} sqs get-queue-attributes --queue-url ${DLQ_URL} --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
  
  echo "Creating Queue: ${QUEUE_NAME} with DLQ: ${DLQ_NAME}"
  aws --endpoint-url=${AWS_ENDPOINT_URL} sqs create-queue \
    --queue-name ${QUEUE_NAME} \
    --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"
done

# Verify the queues were created properly
echo "Listing all queues:"
aws --endpoint-url=${AWS_ENDPOINT_URL} sqs list-queues

# Add sample DLQ messages
echo "Adding sample DLQ messages..."

# Sample DLQ message with trace ID - Failed order event
ORDER_DLQ_URL=$(aws --endpoint-url=${AWS_ENDPOINT_URL} sqs get-queue-url --queue-name order-queue-dlq --query 'QueueUrl' --output text)

# Sample order event 1
aws --endpoint-url=${AWS_ENDPOINT_URL} sqs send-message \
  --queue-url ${ORDER_DLQ_URL} \
  --message-body '{
    "traceId": "ce79cdee-0e35-4d47-84b0-9d3247266382",
    "eventId": "5667d0d2-290a-4f92-b776-7cf5fb26a1eb",
    "eventTime": "2023-07-11T06:44:56.856134Z",
    "type": "ORDER_CREATED",
    "originEventTime": "2023-07-11T06:44:56.856Z",
    "version": "0.1.0",
    "data": {
      "orderId": "60c5cce3-61a3-291e-91a0-d4d52ff6494d",
      "orderDate": "2023-10-27T07:42:42.112Z",
      "orderNumber": "5814127",
      "positions": [
        {
          "id": "70c5cce3-61a3-291e-91a0-d4d52ff6494d",
          "product": {
            "id": "80c5cce3-61a3-291e-91a0-d4d52ff6494d",
            "name": "Premium Widget"
          },
          "orderPositionItems": [
            {
              "id": "3ccce605-61a3-291e-91a0-d4d52ff6494d",
              "status": "CREATED"
            }
          ]
        }
      ]
    }
  }'

# Sample order event 2 - with different trace ID
aws --endpoint-url=${AWS_ENDPOINT_URL} sqs send-message \
  --queue-url ${ORDER_DLQ_URL} \
  --message-body '{
    "traceId": "fe89cdee-1e35-4d47-84b0-9d3247266390",
    "eventId": "6778d0d2-290a-4f92-b776-7cf5fb26a1ec",
    "eventTime": "2023-07-12T09:22:13.412134Z",
    "type": "ORDER_CREATED",
    "originEventTime": "2023-07-12T09:22:13.412Z",
    "version": "0.1.0",
    "data": {
      "orderId": "70d6dde4-72b4-382f-92b1-e5e63ff7505e",
      "orderDate": "2023-10-28T13:15:22.756Z",
      "orderNumber": "5814128",
      "positions": [
        {
          "id": "80d6dde4-72b4-382f-92b1-e5e63ff7505e",
          "product": {
            "id": "90d6dde4-72b4-382f-92b1-e5e63ff7505e",
            "name": "Deluxe Package"
          },
          "orderPositionItems": [
            {
              "id": "4dddf706-72b4-382f-92b1-e5e63ff7505e",
              "status": "CREATED"
            }
          ]
        }
      ]
    }
  }'

# Sample order cancellation event for the second DLQ
CANCEL_DLQ_URL=$(aws --endpoint-url=${AWS_ENDPOINT_URL} sqs get-queue-url --queue-name order-cancellation-queue-dlq --query 'QueueUrl' --output text)

aws --endpoint-url=${AWS_ENDPOINT_URL} sqs send-message \
  --queue-url ${CANCEL_DLQ_URL} \
  --message-body '{
    "traceId": "ae59cdee-2e45-5d57-95b0-9d3247266456",
    "eventId": "7899d0d2-390a-5f93-c886-7cf5fb26a1fd",
    "eventTime": "2023-07-13T14:33:45.123134Z",
    "type": "ORDER_CANCELLED",
    "originEventTime": "2023-07-13T14:33:45.123Z",
    "version": "0.1.0",
    "data": {
      "orderId": "90e7eef5-83c5-493g-93c2-f6f74gg8616f",
      "orderNumber": "5814129",
      "cancellationReason": "CUSTOMER_REQUEST"
    }
  }'

echo "DLQ messages added successfully!"

echo "SQS setup completed!" 