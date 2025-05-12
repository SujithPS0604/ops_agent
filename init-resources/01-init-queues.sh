#!/bin/bash
set -e

echo "Creating SQS queues and DLQs from dlqs.json..."

# Set AWS endpoint for LocalStack
export AWS_ENDPOINT_URL="http://localhost:4566"
export AWS_REGION="us-east-1"

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

echo "SQS setup completed!" 