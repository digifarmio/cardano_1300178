# Project Title:

**Minting NFTs from Historical Agricultural Field Boundary & Crop Performance Data**

## Overview

This project leverages Cardano's blockchain technology to preserve and validate historical agricultural records by converting them into non-fungible tokens (NFTs). It seeks to digitize valuable historical data—specifically agricultural field boundaries and crop performance metrics—thereby ensuring long-term data integrity, transparency, and accessibility.

## Project Objectives

- **Data Preservation and Digitization:**
  Transform historical records of agricultural field boundaries and crop yields into digital assets, safeguarding crucial agricultural heritage data against loss and degradation.

- **NFT Minting on Cardano:**
  Utilize Cardano’s secure, scalable, and environmentally friendly blockchain to mint NFTs that encapsulate historical agricultural data. Each NFT acts as a verifiable, immutable record ensuring authenticity and provenance.

- **Empowering Stakeholders:**
  Provide farmers, researchers, and policymakers with reliable, tamper-proof data to improve decision-making, support academic research, and assist in historical land use studies.

- **Innovative Market Applications:**
  Create a decentralized marketplace for agricultural data, allowing stakeholders to access, trade, or utilize this information in various agri-tech solutions, thereby unlocking new revenue streams and insights.

## Key Components

1. **Data Collection and Standardization:**

   - Gather historical data from agricultural surveys, governmental databases, and archival sources.
   - Ensure data consistency and accuracy through standardization protocols.

2. **NFT Creation Process:**

   - Design a process to convert each record into an NFT, embedding detailed metadata such as field boundaries, historical crop performance, and temporal context.
   - Utilize Cardano’s smart contracts to automate the minting and validation process.

3. **Verification and Security:**

   - Leverage Cardano’s immutable ledger to ensure that once data is recorded as an NFT, it remains tamper-proof.
   - Enable transparent tracking of data provenance and modifications.

4. **User Engagement and Education:**

   - Develop user-friendly interfaces and tools to make the technology accessible to non-technical users, particularly farmers and local agricultural experts.
   - Provide educational resources to foster understanding and adoption of blockchain in agriculture.

5. **Potential Market and Research Applications:**
   - Facilitate a decentralized marketplace where agricultural data NFTs can be accessed or traded.
   - Offer insights into historical farming practices, aiding both modern farming strategies and academic research.

## Impact and Benefits

- **Historical Record Integrity:**
  Secure preservation of valuable agricultural history, ensuring that records remain accessible for future generations.

- **Enhanced Decision-Making:**
  Farmers and policymakers can leverage verified data for improved crop planning, resource management, and strategic planning.

- **Research and Innovation:**
  Provide researchers with a robust dataset to analyze long-term trends in agricultural performance, contributing to advancements in agri-tech and sustainable practices.

- **Economic Opportunities:**
  Creating a market for agricultural data opens up new revenue streams for stakeholders and encourages investment in data-driven agricultural solutions.

## Project Setup & Deployment

### Prerequisites

Ensure the following are installed on your machine:

- Node.js (v18.x or higher)
- npm (bundled with Node.js)

### Project Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/digifarmio/cardano_1300178
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Environment Variables Configuration:**
   Create a `.env` file with the following configuration:

   ```env
   NODE_ENV=development
   SERVERLESS_ORG=<your-org>
   NMKR_API_KEY=<your-nmkr-api-key>
   NMKR_BASE_URL=https://studio-api.preprod.nmkr.io
   NMKR_CUSTOMER_ID=<your-nmkr-customer-id>
   NMKR_PROJECT_UID=<your-nmkr-project-id>
   RECEIVER_ADDRESS=<your-wallet-address>
   BLOCKCHAIN=Cardano
   MINT_BATCH_SIZE=10
   MINT_TOTAL_COUNT=500
   CONCURRENCY_LIMIT=5
   RETRY_COUNT=3
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-s3-bucket-name
   AWS_DYNAMO_TABLE_BATCH_RECORDS=your-dynamo-table
   AWS_DYNAMO_TABLE_RECORDS_STATUS=your-dynamo-table
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   ```

4. **Build and Deploy:**
   ```bash
   npm run build && npm run deploy
   ```

### Local Development

For a full local development, leverage the `serverless-offline` plugin to simulate the AWS Lambda environment.

This command starts a local server, allowing you to test and debug the Lambda API seamlessly before deployment.

```bash
npm run dev
```

### Deployment

After running npm run build && npm run deploy, you should see output similar to:

```Deploying "digifarm-api" to stage "dev" (us-east-1)
✔ Service deployed to stack digifarm-api-dev (96s)

endpoint: ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
functions:
api: digifarm-api-dev (2.3 kB)
```

Note: The API is public by default after deployment. For production, consider configuring an authorizer for added security. See [httpApi](https://www.serverless.com/framework/docs/providers/aws/events/http-api) Event Docs for more details.

### API Invocation

After deployment, you can call the application via HTTP:

```
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/
```

## Conclusion

This project represents a pioneering intersection between agriculture and blockchain technology. By minting NFTs of historical agricultural records on Cardano, it not only preserves critical data but also creates a dynamic ecosystem for data utilization. The initiative has the potential to revolutionize how historical agricultural data is stored, accessed, and applied, thereby supporting sustainable agricultural practices and informed decision-making in the modern era.
