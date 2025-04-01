import requests

# Replace with your NMKR API Key and Project ID
API_KEY = 'OUR_NMKR_KEY'
PROJECT_ID = 'change_proper_project_id'

# Example data for the NFT to be minted
nft_metadata = {
    "projectUid": PROJECT_ID,
    "nft": {
        "name": "Fee Estimation NFT",
        "description": "This NFT is for estimating minting cost.",
        "image": "ipfs://bafybeib2examplehash",
        "mediaType": "image/png",
        "files": [
            {
                "mediaType": "image/png",
                "src": "ipfs://bafybeib2examplehash"
            }
        ],
        "traits": {
            "Category": "SimpleTest",
            "Creator": "Digifarm"
        }
    },
    "recipientWalletAddress": "walletADDR"  # Use real wallet address
}

# NMKR endpoint to calculate minting fee
url = "https://api.nmkr.io/v2/minting/calculate/fee"

# Headers
headers = {
    'accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
}

# Send the request
response = requests.post(url, json=nft_metadata, headers=headers)

# Display the result
if response.status_code == 200:
    result = response.json()
    print("Estimated Minting Fee Breakdown:")
    print(f"- Network Fee (ADA): {result.get('estimatedTxFeeAda')}")
    print(f"- NMKR Fee (ADA): {result.get('nmkrFeeAda')}")
    print(f"- Total Fee (ADA): {result.get('totalFeeAda')}")
    print(f"- Min ADA to send with NFT: {result.get('minAdaToSend')}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)