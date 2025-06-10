#!/bin/bash

USER_NAME=$(aws sts get-caller-identity --query Arn --output text | awk -F/ '{print $NF}')

if [ -z "$USER_NAME" ]; then
  echo "Could not determine AWS username."
  exit 1
fi

echo "Current AWS user: $USER_NAME"

POLICIES=(
  "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator"
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
  "arn:aws:iam::aws:policy/AmazonSSMFullAccess"
  "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess"
  "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
  "arn:aws:iam::aws:policy/IAMFullAccess"
  "arn:aws:iam::aws:policy/CloudWatchFullAccess"
  "arn:aws:iam::aws:policy/CloudFrontFullAccess"
)

for POLICY_ARN in "${POLICIES[@]}"; do
  echo "Attaching $POLICY_ARN to user $USER_NAME..."
  aws iam attach-user-policy --user-name "$USER_NAME" --policy-arn "$POLICY_ARN"
  if [ $? -eq 0 ]; then
    echo "Successfully attached $POLICY_ARN"
  else
    echo "Failed to attach $POLICY_ARN"
    exit 1
  fi
done

echo "All policies attached successfully."