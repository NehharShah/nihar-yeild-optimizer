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
npm run install:all
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

### 2.4 Verify Contracts
```bash
# Verify on BaseScan for transparency
npx hardhat verify --network base <VAULT_ADDRESS> <USDC_ADDRESS> "USDC Yield Vault" "yUSDC"
```

**Expected Output:**
```
USDCYieldVault deployed to: 0x123...abc
AaveAdapter deployed to: 0x456...def
MorphoAdapter deployed to: 0x789...ghi
MoonwellAdapter deployed to: 0xabc...123
```

## Step 3: Update Configuration

### 3.1 Update Keeper Configuration
Edit `keeper/.env` with deployed contract address:
```bash
VAULT_ADDRESS=0x123...abc  # Use actual deployed vault address
```

### 3.2 Update Frontend Configuration
Edit `frontend/.env.local` with deployed contract address:
```bash
NEXT_PUBLIC_VAULT_ADDRESS=0x123...abc  # Use actual deployed vault address
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

## Step 6: Verification and Testing

### 6.1 Verify Contract Deployment
- [ ] Vault contract deployed and verified on BaseScan
- [ ] All three adapters connected to vault
- [ ] Vault can interact with each protocol

### 6.2 Test Keeper Service
- [ ] Keeper successfully connects to Safe wallet
- [ ] APY data being fetched correctly
- [ ] Rebalancing logic working (test with small amounts)

### 6.3 Test Frontend
- [ ] Wallet connection works
- [ ] APY data displays correctly
- [ ] Deposit/withdrawal functions work
- [ ] Auto-yield toggle works

## Step 7: Production Configuration

### 7.1 Security Checklist
- [ ] Private keys secured (use hardware wallet if possible)
- [ ] Safe wallet has appropriate owners and threshold
- [ ] Keeper permissions limited to rebalance function only
- [ ] All contracts verified on BaseScan
- [ ] Emergency pause functionality tested

### 7.2 Monitoring Setup
- [ ] Keeper service monitoring (uptime alerts)
- [ ] Discord/Slack webhooks configured
- [ ] Gas price monitoring
- [ ] APY data freshness alerts

### 7.3 User Documentation
- [ ] User guide for depositing/withdrawing
- [ ] Documentation for enabling auto-yield
- [ ] FAQ and troubleshooting guide
- [ ] Links to verified contracts

## Common Issues and Solutions

### Issue: Contract deployment fails
**Solution:** 
- Check you have sufficient Base ETH for gas
- Verify RPC URL is correct
- Ensure private key format is correct (without 0x prefix)

### Issue: Keeper can't connect to Safe
**Solution:**
- Verify Safe address is correct
- Ensure keeper address has appropriate permissions
- Check Safe is on the correct network (Base)

### Issue: APY data not loading
**Solution:**
- Verify protocol addresses in adapters
- Check RPC URL connectivity
- Ensure external API endpoints are accessible

### Issue: Frontend wallet connection fails
**Solution:**
- Verify WalletConnect project ID
- Check network configuration (Base = chainId 8453)
- Ensure contract addresses are correct

## Gas Optimization Tips

1. **Batch Operations**: Deploy all contracts in single transaction when possible
2. **Rebalance Timing**: Monitor gas prices and rebalance during low-fee periods
3. **Threshold Tuning**: Adjust rebalance thresholds based on gas costs
4. **Safe Configuration**: Use 1-of-1 Safe for cheaper automated transactions

## Maintenance

### Regular Tasks
- [ ] Monitor keeper service uptime
- [ ] Review rebalancing performance
- [ ] Update APY data sources if needed
- [ ] Check contract security updates
- [ ] Update frontend dependencies

### Monthly Reviews
- [ ] Analyze yield optimization performance
- [ ] Review gas cost efficiency
- [ ] Update protocol parameters if needed
- [ ] Security audit for any changes

## Support

For deployment issues or questions:

1. Check the main README.md for detailed documentation
2. Review contract tests for expected behavior
3. Join our Discord/Telegram for community support
4. Submit GitHub issues for bugs or feature requests

## Next Steps

After successful deployment:

1. **User Acquisition**: Share with DeFi communities
2. **Protocol Integration**: Add more lending protocols
3. **Advanced Features**: Implement cross-chain optimization
4. **Analytics**: Set up comprehensive dashboards
5. **Security**: Schedule regular audits

---

**⚠️ Important**: This is a proof-of-concept. Conduct thorough testing and security audits before deploying significant funds.