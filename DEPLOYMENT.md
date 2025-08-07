# Deployment Guide

This guide walks you through deploying the USDC Yield Optimizer on Base network.

## Prerequisites

Before deployment, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Base network RPC URL (Alchemy, Infura, or public)
- [ ] Private key with Base ETH for gas fees
- [ ] WalletConnect project ID
- [ ] Safe wallet address on Base (optional but recommended)

## Step 1: Environment Setup

### 1.1 Clone and Install
```bash
git clone <repository-url>
cd assign-elsa

# Install dependencies with compatibility fixes
cd frontend && npm install
cd ../keeper && npm install 
cd ../contracts && npm install
```

### 1.2 Configure Environment Variables

**Contracts (.env)**
```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:
```bash
PRIVATE_KEY=your_deployer_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

**Keeper (.env)**
```bash
cd ../keeper
cp env.example .env
```

Edit `keeper/.env`:
```bash
RPC_URL=https://mainnet.base.org
KEEPER_PRIVATE_KEY=your_keeper_private_key_here
VAULT_ADDRESS=  # Will be filled after contract deployment
SAFE_ADDRESS=your_safe_wallet_address
LOG_LEVEL=info
```

**Frontend (.env.local)**
```bash
cd ../frontend
cp env.example .env.local
```

Edit `frontend/.env.local`:
```bash
NEXT_PUBLIC_VAULT_ADDRESS=  # Will be filled after contract deployment
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Step 2: Smart Contract Deployment

### 2.1 Compile Contracts
```bash
cd contracts
npm run compile
```

### 2.2 Deploy to Base Sepolia (Testnet)
```bash
# Deploy to testnet first for testing
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### 2.3 Deploy to Base Mainnet
```bash
# Deploy to mainnet when ready
npx hardhat run scripts/deploy.ts --network base
```

### 2.4 Deploy Safe4337 Infrastructure
```bash
# Deploy Safe wallet factory and session key manager
npx hardhat run scripts/deploy-safe4337.ts --network baseSepolia
```

**Expected Output:**
```
SessionKeyManager deployed to: 0xdef...456
SafeWalletFactory deployed to: 0x789...abc
Safe4337Module enabled: 0xa581c4A4DB7175302464fF3C06380BC3270b4037
```

### 2.5 Verify Contracts
```bash
# Verify on BaseScan for transparency
npx hardhat verify --network baseSepolia <VAULT_ADDRESS> <USDC_ADDRESS> "USDC Yield Vault" "yUSDC"
npx hardhat verify --network baseSepolia <SESSION_KEY_MANAGER_ADDRESS>
npx hardhat verify --network baseSepolia <SAFE_WALLET_FACTORY_ADDRESS>
```

**Expected Output:**
```
USDCYieldVault deployed to: 0x123...abc
AaveAdapter deployed to: 0x456...def
MorphoAdapter deployed to: 0x789...ghi
MoonwellAdapter deployed to: 0xabc...123
SessionKeyManager deployed to: 0xdef...456
SafeWalletFactory deployed to: 0x789...abc
```

## Step 3: Update Configuration

### 3.1 Update Keeper Configuration
Edit `keeper/.env` with deployed contract address:
```bash
VAULT_ADDRESS=0x123...abc  # Use actual deployed vault address
```

### 3.2 Update Frontend Configuration
Edit `frontend/.env.local` with deployed contract addresses:
```bash
NEXT_PUBLIC_VAULT_ADDRESS=0x123...abc  # Use actual deployed vault address
NEXT_PUBLIC_SAFE_WALLET_FACTORY=0x789...abc  # SafeWalletFactory address
NEXT_PUBLIC_SESSION_KEY_MANAGER=0xdef...456  # SessionKeyManager address
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key  # For bundler services
```

## Step 4: Safe Wallet Setup (Account Abstraction)

### 4.1 Create Safe Wallet
1. Go to [Safe Wallet App](https://app.safe.global)
2. Connect to Base network
3. Create new Safe with your EOA as owner
4. Add keeper address as second owner (optional)
5. Set threshold to 1 for automated transactions

### 4.2 Fund Safe Wallet
Transfer some Base ETH to your Safe for transaction fees:
```bash
# Example: Send 0.01 ETH to Safe for gas
```

### 4.3 Update Configuration
```bash
# In keeper/.env
SAFE_ADDRESS=0xYourSafeAddressHere
```

## Step 5: Deploy and Start Services

### 5.1 Start Keeper Service
```bash
cd keeper
npm run build
npm start
```

**Expected Output:**
```
[INFO] Starting USDC Yield Optimizer Keeper...
[INFO] Initializing YieldKeeperService...
[INFO] Safe initialized: 0x123...abc
[INFO] YieldKeeperService initialized successfully
[INFO] Running initial yield optimization check...
[INFO] Keeper is running. Press Ctrl+C to exit.
```

### 5.2 Deploy Frontend
```bash
cd frontend

# Local development
npm run dev

# Or deploy to Vercel
npm run build
vercel --prod
```
---

**⚠️ Important**: This is a proof-of-concept. Conduct thorough testing and security audits before deploying significant funds.