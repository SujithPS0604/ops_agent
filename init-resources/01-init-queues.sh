#!/bin/bash
set -e

echo "Creating SQS queues and DLQs from dlqs.json..."

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install it to continue."
    exit 1
fi

# Set AWS endpoint for LocalStack - using localhost since this runs inside the container
export AWS_ENDPOINT_URL="http://localhost:4566"
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
DLQ_CONFIG=$(cat /docker-entrypoint-initaws.d/dlqs.json)

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

echo "SQS setup completed!" 