Architecture Decision Records
=============================

![blue book](https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/standard/ef8b0642-7523-4e13-9fd3-01b65648acf6/64x64/1f4d8.png) Background
-------------------------------------------------------------------------------------------------------------------------------------------------------

Blockia Labs has been invited to develop a focused Proof of Concept (PoC) demonstrating how field boundary data can be transformed into Non‑Fungible Tokens (NFTs) on the Cardano blockchain. The PoC must illustrate practical end‑to‑end viability by ingesting GeoJSON field boundaries, enriching them with multi‑season agricultural metadata, minting the corresponding NFTs, and generating the evidence required for validation.

**DigiFarm Objectives and Milestones:**

-   Mint 10,000 NFTs representing field boundaries across Kenya and Tanzania.

-   Attach ten rows of agricultural data (planted area in hectares over three seasons) to each NFT.

-   Produce a PDF report on 50 randomly selected NFTs, documenting model accuracy and metadata completeness.

**Acceptance Criteria:**

1.  Successfully achieved stated accuracy of sample data-set, i.e. 10,000 field boundaries in Kenya and Tanzania with the targeted (a) 10 rows of meta-data (b) accuracy of boundary delineation (IoU 0.93)

2.  Successfully produced report in PDF on a randomly selected subset of the 10,000 field boundaries, i.e. 50 field boundaries as an example, documenting the targeted AI accuracy of model and meta-data

**Evidence of Completion:**

-   Proof of minted 10,000 NFTS on the blockchain providing to be presented to Catalyst through providing the unique identifiers or attributes attached to the 10,000 NFTs in a CSV or similar format file as well as other links/sites for viewing/validating the NFTs such as [Cardano visual explorer](https://pool.pm/) or other tools

**Notes:**

-   Minting via NMKR API

-   Pre-mint 500 NFTs instead of 10,000 via manual minting or airdroper

-   9,500 NFTs available for claim

![books](https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/standard/ef8b0642-7523-4e13-9fd3-01b65648acf6/64x64/1f4da.png) Relevant data
------------------------------------------------------------------------------------------------------------------------------------------------------

The purpose of this ADR is to select the options that will be used to create **DigiFarm** Geo data processing and NFT minting Application.

![rainbow](https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/standard/ef8b0642-7523-4e13-9fd3-01b65648acf6/64x64/1f308.png) Options considered
-------------------------------------------------------------------------------------------------------------------------------------------------------------

<table border="1" cellspacing="0" cellpadding="10">
  <thead>
    <tr>
      <th></th>
      <th><strong>Option 1</strong><br>Serverless - AWS Lambda</th>
      <th><strong>Option 2</strong><br>Containerized Managed Service</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Pros and cons</strong></td>
      <td>
        <img src="https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/atlassian/productivityEmojis/add-64px.png" alt="Plus" width="20">
        <ul>
          <li>Already used by Digifarm.</li>
          <li>No backend infra/DevOps required.</li>
          <li>Automatic scaling for variable workloads.</li>
          <li>Pay-per-use pricing (no idle costs).</li>
          <li>Native integration with AWS services (DynamoDB, SQS, S3).</li>
          <li>Automatic API Gateway routing for frontend communication.</li>
          <li>Compatible with Amplify and Cognito for auth.</li>
          <li>Easily deployable via the Serverless Framework</li>
          <li>Built-in monitoring/logging via AWS CloudWatch.</li>
          <li>Ideal for event-driven, short-lived tasks (e.g., per-NFT triggers).</li>
        </ul>
        <hr>
        <img src="https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/atlassian/productivityEmojis/minus-64px.png" alt="Minus" width="20">
        <ul>
          <li><strong>Cold starts</strong>: Delays for infrequently used functions.</li>
          <li><strong>Variable costs</strong>: Unpredictable for large batches (10k NFTs = ~10k+ invocations).</li>
          <li><strong>Execution time limits</strong>: Requires chunking for long tasks.</li>
          <li><strong>Vendor lock-in</strong>: Tight coupling to AWS services.</li>
          <li><strong>Concurrency limits</strong>: Requires careful tuning for parallel NFT processing.</li>
          <li><strong>Error handling complexity</strong>: Retries and dead-letter queues add overhead.</li>
        </ul>
      </td>
      <td>
        <img src="https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/atlassian/productivityEmojis/add-64px.png" alt="Plus" width="20">
        <ul>
          <li><strong>Long-running processes</strong>: No timeouts for bulk NFT jobs.</li>
          <li><strong>Team expertise with Docker</strong>: Team familiarity with Docker reduces development time.</li>
          <li><strong>Persistent connections</strong>: Better for NMKR API/IPFS interactions.</li>
          <li><strong>Portability</strong>: Easily migrate to Azure/GCP if needed.</li>
          <li><strong>Runs anywhere</strong></li>
          <li><strong>Full control over runtime environment</strong>.</li>
          <li><strong>Parallel processing</strong>: Scale tasks horizontally without Lambda limits.</li>
          <li><strong>Easier debugging</strong>: Local container testing mirrors production.</li>
        </ul>
        <hr>
        <img src="https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/atlassian/productivityEmojis/minus-64px.png" alt="Minus" width="20">
        <ul>
          <li><strong>Infra/DevOps overhead</strong>: Requires CI/CD (GitHub Actions), VPCs, IAM roles.</li>
          <li><strong>Manual scaling</strong>: Containerized/Manual configuration (auto-scaling policies needed).</li>
          <li><strong>Idle Costs</strong>: Higher idle costs if containers are not stopped post-job.</li>
          <li><strong>Image management</strong>: Docker optimization (size, layers) impacts deploy speed.</li>
          <li><strong>Persistent storage</strong>: Requires EBS/EFS for stateful data (extra cost).</li>
          <li><strong>Compliance</strong>: Additional audits for containerized environments.</li>
          <li><strong>Security</strong>: Secrets management via AWS Parameter Store/Secrets Manager.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Estimated cost</strong></td>
      <td>Medium (Depends on usage, batch size and frequency)</td>
      <td>Medium (Depends on usage, batch size and frequency)</td>
    </tr>
  </tbody>
</table>


![glowing star](https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/standard/ef8b0642-7523-4e13-9fd3-01b65648acf6/64x64/1f31f.png) Outcome
-------------------------------------------------------------------------------------------------------------------------------------------------------------


<table border="1" cellspacing="0" cellpadding="8">
  <thead>
    <tr>
      <th></th>
      <th><strong>Decision</strong></th>
      <th><strong>Notes</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Architecture</strong></td>
      <td>
        <strong> AWS + Node.js + Express API + Serverless Framework</strong>
      </td>
      <td>
        The Serverless Framework enables you to deploy a Node.js Express API to AWS Lambda without manually provisioning or managing servers.
      </td>
    </tr>
    <tr>
      <td><strong>Authentication</strong></td>
      <td><strong>Amplify + AWS Cognito</strong></td>
      <td>Amplify + AWS Cognito provides a fully managed authentication and user management service. However, for this specific case, Amplify and Cognito may not be necessary</td>
    </tr>
    <tr>
      <td><strong>Storage</strong></td>
      <td><strong>AWS Dynamo DB + S3</strong></td>
      <td></td>
    </tr>
    <tr>
      <td><strong>Infrastructure</strong></td>
      <td><strong>AWS Lambda</strong></td>
    </tr>
  </tbody>
</table>
