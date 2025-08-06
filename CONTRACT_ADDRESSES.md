# Contract Addresses

## System Architecture Decision: Safe {Core} vs ZeroDev

**Decision**: We chose **Safe {Core}** over ZeroDev for the following reasons:

### Safe {Core} Advantages
- ✅ **Mature ecosystem**: Battle-tested with $100B+ secured
- ✅ **Native ERC-4337 support**: Via Safe4337Module
- ✅ **Multi-sig capabilities**: Configurable thresholds for governance
- ✅ **Session key support**: Granular permissions for automated actions
- ✅ **Base network support**: Full compatibility and tooling
- ✅ **Audit history**: Extensively audited codebase
- ✅ **Developer experience**: Comprehensive SDK and documentation

### Implementation Details
- **Account abstraction**: Safe4337Module for ERC-4337 compatibility
- **Session keys**: Limited to `rebalance()` function only
- **Multi-sig**: User as primary owner, keeper as authorized signer
- **Threshold**: Configurable (1-of-1 for automation, 2-of-2 for security)

---

## Base Network Contract Addresses

### Core Protocol Addresses

| Protocol | Contract | Address | Description |
|----------|----------|---------|-------------|
| **USDC** | USDC Token | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Base USDC (6 decimals) |
| **Aave V3** | Pool | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` | Main lending pool |
| **Aave V3** | aUSDC | `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB` | Interest-bearing USDC |
| **Morpho Blue** | Main Contract | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` | Morpho Blue core |
| **Moonwell** | mUSDC | `0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22` | Moonwell USDC market |
| **Moonwell** | Comptroller | `0xfBb21d0380beE3312B33c4353c8936a0F13EF26C` | Moonwell controller |

### Our Deployed Contracts (To be updated after deployment)

| Contract | Address | Verification |
|----------|---------|--------------|
| **USDCYieldVault** | `0xAD2eE75074b0e68B7D658de907C1BdbD72fE56BE` | [BaseScan ↗](https://sepolia.basescan.org/address/0xAD2eE75074b0e68B7D658de907C1BdbD72fE56BE) |
| **AaveAdapter** | `0x...` | [BaseScan ↗]() |
| **MorphoAdapter** | `0x...` | [BaseScan ↗]() |
| **MoonwellAdapter** | `0x...` | [BaseScan ↗]() |

---

## Safe Wallet Configuration

### Production Setup
```typescript
// Safe deployment configuration
const safeConfig = {
  owners: [
    "0x...", // User EOA (primary owner)
    "0x...", // Keeper address (for automation)
  ],
  threshold: 1, // 1-of-2 for automated rebalancing
  modules: [
    "0x...", // Safe4337Module for account abstraction
  ],
  fallbackHandler: "0x...", // Default Safe fallback handler
}
```

### Session Key Permissions
```typescript
// Limited permissions for keeper automation
const sessionKeyConfig = {
  validAfter: Math.floor(Date.now() / 1000),
  validUntil: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
  sessionKey: "0x...", // Keeper public key
  allowedFunctions: [
    "0x...", // rebalance(uint8,uint256,uint256) selector
  ],
  spendingLimit: {
    token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    amount: ethers.MaxUint256, // No limit (protected by vault logic)
  }
}
```

---

## Network Configuration

### Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: `https://mainnet.base.org`
- **Explorer**: https://basescan.org
- **Native Token**: ETH

### Base Sepolia (Testnet)
- **Chain ID**: 84532
- **RPC URL**: `https://sepolia.base.org`
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://portal.cdp.coinbase.com/products/faucet

---

## Integration Details

### Protocol-Specific Configurations

#### Aave V3 Integration
```solidity
// Aave V3 Base deployment
IPool constant AAVE_POOL = IPool(0xA238Dd80C259a72e81d7e4664a9801593F98d1c5);
IAToken constant aUSDC = IAToken(0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB);

// Key functions used
- pool.supply(asset, amount, onBehalfOf, referralCode)
- pool.withdraw(asset, amount, to)
- aToken.balanceOf(user) // Current balance including accrued interest
```

#### Morpho Blue Integration
```solidity
// Morpho Blue Base deployment
IMorpho constant MORPHO = IMorpho(0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb);

// Market parameters for USDC
MarketParams memory marketParams = MarketParams({
    loanToken: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, // USDC
    collateralToken: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, // USDC (self-collateralized)
    oracle: address(0), // Zero address for self-collateralized
    irm: 0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC, // Interest rate model
    lltv: 0 // 0% for supply-only markets
});
```

#### Moonwell Integration
```solidity
// Moonwell Base deployment
IMToken constant mUSDC = IMToken(0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22);
IComptroller constant COMPTROLLER = IComptroller(0xfBb21d0380beE3312B33c4353c8936a0F13EF26C);

// Key functions
- mToken.mint(amount) // Supply USDC, get mUSDC
- mToken.redeemUnderlying(amount) // Redeem USDC
- mToken.exchangeRateStored() // Current exchange rate
```

---

## Verification Commands

After deployment, verify contracts using:

```bash
# Verify main vault
npx hardhat verify --network base <VAULT_ADDRESS> \
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" \
  "USDC Yield Vault" \
  "yUSDC"

# Verify adapters
npx hardhat verify --network base <AAVE_ADAPTER_ADDRESS> \
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" \
  <VAULT_ADDRESS>

npx hardhat verify --network base <MORPHO_ADAPTER_ADDRESS> \
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" \
  <VAULT_ADDRESS> \
  [marketParams]

npx hardhat verify --network base <MOONWELL_ADAPTER_ADDRESS> \
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" \
  <VAULT_ADDRESS>
```

---

## Security Considerations

### Access Controls
- **Vault Owner**: Deployer address (for emergency functions)
- **Adapters**: Only callable by vault contract
- **Rebalancing**: Only authorized Safe signers
- **Session Keys**: Limited scope and time-bound

### Emergency Procedures
```solidity
// Emergency functions available to owner
function pause() external onlyOwner
function unpause() external onlyOwner
function emergencyWithdraw() external onlyOwner (in adapters)
```

### Monitoring
- All contracts emit comprehensive events for tracking
- BaseScan verification for transparency
- Multi-sig requirements for sensitive operations

---

## Frontend Integration

### Contract ABIs
All contract ABIs are available in:
- `contracts/artifacts/` after compilation
- TypeScript types in `contracts/typechain-types/`
- Frontend hooks in `frontend/app/hooks/`

### Environment Variables
```bash
# Frontend configuration
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---