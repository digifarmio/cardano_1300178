#!/bin/bash

STACK_NAME=$1

if [ -z "$STACK_NAME" ]; then
  echo "Usage: $0 <cloudformation-stack-name>"
  exit 1
fi

echo "Deleting CloudFormation stack: $STACK_NAME"

aws cloudformation delete-stack --stack-name "$STACK_NAME"

echo "Waiting for stack deletion to complete..."

aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

if [ $? -eq 0 ]; then
  echo "Stack $STACK_NAME deleted successfully."
else
  echo "Stack deletion failed or timed out."
  exit 1
fi
