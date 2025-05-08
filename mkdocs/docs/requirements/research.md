NMKR API Research Document: Geo Data to NFT Minting Solution
------------------------------------------------------------

### Prerequisites

1.  **Wallet Setup**

    -   Install a Cardano-compatible wallet (e.g., Eternl, Nami)

    -   Fund with testnet ADA via [faucet](https://docs.cardano.org/cardano-testnets/tools/faucet "https://docs.cardano.org/cardano-testnets/tools/faucet")

2.  **NMKR Account**

    -   Register at [NMKR Preprod Studio](https://studio.preprod.nmkr.io/ "https://studio.preprod.nmkr.io/")

    -   Complete KYC verification (testnet only requires basic details)

    -   Generate API keys under Account Settings → Developer API

3.  **Funding**

    -   Top up account balance with mint coupons (1 NFT = 1 coupon ≈ 4.5 ADA testnet)

    -   Minimum recommended: 2,250 ADA testnet for 500 NFTs

4.  **Configure Environment Variables**

    -   API Keys

    -   Wallet Address

5.  **Data provided by Digifarm**

    -   CSV file format


### NFT Minting

-   Bulk Minting 500 NFTs in chunks via **"Manual Minting"**

    -   **NFTs queued for minting**

    -   **NFTs reserved time e.g. 60 minutes**

    -   **NFTs minted**

    -   **NFTs sent to DigiFarm Treasury Wallet address or MultiSignature Wallet**

-   Bulk minting 500 NFTs via **"Airdrop"**

    -   Seems like more convenient way to handle the mint and transfer to DigiFarm Treasury

    -   Might be a bit cheaper when done through the distributor

-   Claimable 9,500

    -   User/farmer claims each NFT separately via 3rd party apps

    -   or WebUI through on-demand minting

-   **Key Points:**

    -   The manual mint of 1 NFT will cost 1 [Mint Coupon](https://docs.nmkr.io/nmkr-studio/account/mint-coupons "https://docs.nmkr.io/nmkr-studio/account/mint-coupons"). The amount that can be sent in one Transaction is depending on the metadata size (up to 1 Million Tokens). To further reduce the cost of manual minting, set the [Sendback in your project settings to MinUtxo](https://docs.nmkr.io/nmkr-studio/project/edit#sendback-to-customer "https://docs.nmkr.io/nmkr-studio/project/edit#sendback-to-customer"). This will calculate the sendback for each transaction depending on the metadata size and token amount.

    -   Each airdropped NFT costs about [one Mint Coupon](https://docs.nmkr.io/nmkr-studio/account/mint-coupons "https://docs.nmkr.io/nmkr-studio/account/mint-coupons"). Actually it takes a bit less as the drops were processed in batches and therefore it will cost less fees. To further reduce the cost of airdropping, set the [Sendback in your project settings to MinUtxo](https://docs.nmkr.io/nmkr-studio/project/edit#sendback-to-customer "https://docs.nmkr.io/nmkr-studio/project/edit#sendback-to-customer"). This will calculate the sendback for each transaction depending on the metadata size and token amount. A token airdrop with 3 NFTs in one transaction to one wallet costs with these settings and the standard metadata about 1.4 ADA.