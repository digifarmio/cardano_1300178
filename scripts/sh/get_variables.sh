#!/bin/bash

STACK_NAME="digifarm-blockia-dev"
SQS_UPLOADS_NAME="digifarm-blockia-upload-queue.fifo"
SQS_REPORT_NAME="digifarm-blockia-report-queue"
CF_DIST_COMMENT="Frontend Distribution with OAC" 

echo "Getting SQS uploads queue URL and ARN..."
UPLOADS_QUEUE_URL=$(aws sqs get-queue-url --queue-name "$SQS_UPLOADS_NAME" --output text --query QueueUrl)
UPLOADS_QUEUE_ARN=$(aws sqs get-queue-attributes --queue-url "$UPLOADS_QUEUE_URL" --attribute-names QueueArn --output text --query 'Attributes.QueueArn')

echo "Getting SQS report queue URL and ARN..."
REPORT_QUEUE_URL=$(aws sqs get-queue-url --queue-name "$SQS_REPORT_NAME" --output text --query QueueUrl)
REPORT_QUEUE_ARN=$(aws sqs get-queue-attributes --queue-url "$REPORT_QUEUE_URL" --attribute-names QueueArn --output text --query 'Attributes.QueueArn')

echo "Getting CloudFront distribution by comment: '$CF_DIST_COMMENT'..."
CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='$CF_DIST_COMMENT'].Id" --output text)
CF_DOMAIN=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='$CF_DIST_COMMENT'].DomainName" --output text)

echo "Getting API Gateway invoke URL from CloudFormation stack: $STACK_NAME..."
API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" --output text)

echo "----------------------------------------"
echo "AWS_SQS_UPLOADS_QUEUE_URL=$UPLOADS_QUEUE_URL"
echo "AWS_SQS_UPLOADS_QUEUE_ARN=$UPLOADS_QUEUE_ARN"
echo "AWS_SQS_REPORT_QUEUE_URL=$REPORT_QUEUE_URL"
echo "AWS_SQS_REPORT_QUEUE_ARN=$REPORT_QUEUE_ARN"
echo "CLOUDFRONT_DISTRIBUTION_ID=$CF_DIST_ID"
echo "CLOUDFRONT_DOMAIN_NAME=$CF_DOMAIN"
echo "APIGATEWAY_URL=$API_GATEWAY_URL"
echo "----------------------------------------"
