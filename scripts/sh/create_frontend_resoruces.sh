#!/bin/bash

set -e

# === Config ===
REGION="us-east-1"
BUCKET_NAME="digifarm-blockia-frontend-1"
CLOUDFRONT_COMMENT="Frontend Distribution with OAC"
DEFAULT_ROOT_OBJECT="index.html"
ERROR_PAGE="/index.html"

echo "Creating S3 bucket: $BUCKET_NAME..."
if [ "$REGION" == "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
else
  aws s3api create-bucket --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
fi


echo "Blocking public access..."
aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Checking for existing Origin Access Control (OAC)..."
OAC_NAME="DigifarmBlockiaFrontendOAC"
OAC_ID=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id | [0]" \
  --output text)

if [ "$OAC_ID" == "None" ] || [ -z "$OAC_ID" ]; then
  echo "OAC not found. Creating new OAC..."
  OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config '{
    "Name": "'"$OAC_NAME"'",
    "Description": "OAC for frontend S3 bucket",
    "OriginAccessControlOriginType": "s3",
    "SigningBehavior": "always",
    "SigningProtocol": "sigv4"
  }' --query 'OriginAccessControl.Id' --output text)
else
  echo "Reusing existing OAC: $OAC_ID"
fi


echo "Creating CloudFront distribution..."
ORIGIN_DOMAIN="$BUCKET_NAME.s3.$REGION.amazonaws.com"
DIST_CONFIG_FILE="cf-dist-config.json"
CALLER_REF=$(date +%s)

cat > $DIST_CONFIG_FILE <<EOF
{
  "CallerReference": "$CALLER_REF",
  "Comment": "$CLOUDFRONT_COMMENT",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3Origin",
      "DomainName": "$ORIGIN_DOMAIN",
      "OriginAccessControlId": "$OAC_ID",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "DefaultRootObject": "$DEFAULT_ROOT_OBJECT",
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "$ERROR_PAGE",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "$ERROR_PAGE",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      }
    ]
  }
}
EOF

DIST_ID=$(aws cloudfront create-distribution \
  --distribution-config file://$DIST_CONFIG_FILE \
  --query 'Distribution.Id' --output text)

rm $DIST_CONFIG_FILE

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Applying bucket policy for CloudFront OAC access..."
cat > bucket-policy.json <<EOF
{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DIST_ID"
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json
rm bucket-policy.json

echo "Deployment complete."
echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution ID: $DIST_ID"
