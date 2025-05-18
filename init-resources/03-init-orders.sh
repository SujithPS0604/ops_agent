#!/bin/bash
set -e

echo "Creating orders table and inserting sample data..."

# Set AWS endpoint for LocalStack
export AWS_ENDPOINT_URL="http://localstack:4566"
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
for i in {1..30}; do
  if aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb list-tables > /dev/null 2>&1; then
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

# Create orders table
echo "Creating orders table..."
aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb create-table \
  --table-name orders \
  --attribute-definitions \
    AttributeName=orderId,AttributeType=S \
  --key-schema \
    AttributeName=orderId,KeyType=HASH \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5

# Wait for table to be created
echo "Waiting for table to be created..."
aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb wait table-exists --table-name orders

# Insert sample orders
echo "Inserting sample orders..."

# Order 1 - Multiple positions with different statuses
aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb put-item \
  --table-name orders \
  --item '{
    "orderId": {"S": "60c5cce3-61a3-291e-91a0-d4d52ff6494d"},
    "orderNumber": {"S": "5814127"},
    "orderDate": {"S": "2023-10-27T07:42:42.112Z"},
    "positions": {"L": [
      {"M": {
        "id": {"S": "70c5cce3-61a3-291e-91a0-d4d52ff6494d"},
        "product": {"M": {
          "id": {"S": "80c5cce3-61a3-291e-91a0-d4d52ff6494d"},
          "name": {"S": "Premium Widget"}
        }},
        "orderPositionItems": {"L": [
          {"M": {
            "id": {"S": "3ccce605-61a3-291e-91a0-d4d52ff6494d"},
            "status": {"S": "CREATED"}
          }}
        ]}
      }},
      {"M": {
        "id": {"S": "71c5cce3-61a3-291e-91a0-d4d52ff6494e"},
        "product": {"M": {
          "id": {"S": "81c5cce3-61a3-291e-91a0-d4d52ff6494e"},
          "name": {"S": "Basic Widget"}
        }},
        "orderPositionItems": {"L": [
          {"M": {
            "id": {"S": "4ccce605-61a3-291e-91a0-d4d52ff6494e"},
            "status": {"S": "SHIPPED"}
          }}
        ]}
      }}
    ]}
  }'

# Order 2 - Single position with cancelled items
aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb put-item \
  --table-name orders \
  --item '{
    "orderId": {"S": "70d6dde4-72b4-382f-92b1-e5e63ff7505e"},
    "orderNumber": {"S": "5814128"},
    "orderDate": {"S": "2023-10-28T13:15:22.756Z"},
    "positions": {"L": [
      {"M": {
        "id": {"S": "80d6dde4-72b4-382f-92b1-e5e63ff7505e"},
        "product": {"M": {
          "id": {"S": "90d6dde4-72b4-382f-92b1-e5e63ff7505e"},
          "name": {"S": "Deluxe Package"}
        }},
        "orderPositionItems": {"L": [
          {"M": {
            "id": {"S": "4dddf706-72b4-382f-92b1-e5e63ff7505e"},
            "status": {"S": "CANCELLED"}
          }}
        ]}
      }}
    ]}
  }'

# Order 3 - Multiple positions with mixed statuses
aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb put-item \
  --table-name orders \
  --item '{
    "orderId": {"S": "90e7eef5-83c5-493g-93c2-f6f74gg8616f"},
    "orderNumber": {"S": "5814129"},
    "orderDate": {"S": "2023-10-29T09:30:15.123Z"},
    "positions": {"L": [
      {"M": {
        "id": {"S": "91e7eef5-83c5-493g-93c2-f6f74gg8616f"},
        "product": {"M": {
          "id": {"S": "92e7eef5-83c5-493g-93c2-f6f74gg8616f"},
          "name": {"S": "Ultimate Bundle"}
        }},
        "orderPositionItems": {"L": [
          {"M": {
            "id": {"S": "5eeef807-83c5-493g-93c2-f6f74gg8616f"},
            "status": {"S": "SHIPPED"}
          }},
          {"M": {
            "id": {"S": "6eeef807-83c5-493g-93c2-f6f74gg8616g"},
            "status": {"S": "CREATED"}
          }}
        ]}
      }}
    ]}
  }'

# Order 4 - All items shipped
aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb put-item \
  --table-name orders \
  --item '{
    "orderId": {"S": "a1f8ffg6-94d6-5a4h-a4d3-g7g85hh9727g"},
    "orderNumber": {"S": "5814130"},
    "orderDate": {"S": "2023-10-30T14:45:30.456Z"},
    "positions": {"L": [
      {"M": {
        "id": {"S": "a2f8ffg6-94d6-5a4h-a4d3-g7g85hh9727g"},
        "product": {"M": {
          "id": {"S": "a3f8ffg6-94d6-5a4h-a4d3-g7g85hh9727g"},
          "name": {"S": "Complete Set"}
        }},
        "orderPositionItems": {"L": [
          {"M": {
            "id": {"S": "7fffg908-94d6-5a4h-a4d3-g7g85hh9727g"},
            "status": {"S": "SHIPPED"}
          }},
          {"M": {
            "id": {"S": "8fffg908-94d6-5a4h-a4d3-g7g85hh9727h"},
            "status": {"S": "SHIPPED"}
          }}
        ]}
      }}
    ]}
  }'

# Order 5 - All items cancelled
aws --endpoint-url=${AWS_ENDPOINT_URL} dynamodb put-item \
  --table-name orders \
  --item '{
    "orderId": {"S": "b2g9ggh7-a5e7-6b5i-b5e4-h8h96ii0838h"},
    "orderNumber": {"S": "5814131"},
    "orderDate": {"S": "2023-10-31T11:20:45.789Z"},
    "positions": {"L": [
      {"M": {
        "id": {"S": "b3g9ggh7-a5e7-6b5i-b5e4-h8h96ii0838h"},
        "product": {"M": {
          "id": {"S": "b4g9ggh7-a5e7-6b5i-b5e4-h8h96ii0838h"},
          "name": {"S": "Mega Pack"}
        }},
        "orderPositionItems": {"L": [
          {"M": {
            "id": {"S": "9gggh009-a5e7-6b5i-b5e4-h8h96ii0838h"},
            "status": {"S": "CANCELLED"}
          }},
          {"M": {
            "id": {"S": "0gggh009-a5e7-6b5i-b5e4-h8h96ii0838i"},
            "status": {"S": "CANCELLED"}
          }}
        ]}
      }}
    ]}
  }'

echo "Orders table setup completed!" 