# USDC Yield Optimizer

A comprehensive DeFi yield optimization platform that automatically rebalances USDC deposits across Aave V3, Morpho Blue, and Moonwell on Base network to maximize yield.

## 🎯 Project Overview

This project implements a **proof-of-concept USDC yield optimizer** with the following key features:

- **ERC-4626 compliant vault** for tokenized yield-bearing deposits
- **Multi-protocol integration** with Aave, Morpho Blue, and Moonwell
- **Account abstraction** using Safe wallets with session keys
- **Automated rebalancing** via off-chain keeper service
- **Real-time yield tracking** and analytics dashboard
- **Modern React frontend** with comprehensive UX

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │     │   Keeper Bot    │    │  Smart Contracts│
│   (Next.js)     │     │  (TypeScript)   │    │   (Solidity)    │
│                 │     │                 │    │                 │
│ • Wallet Connect │    │ • APY Monitor   │    │ • ERC-4626 Vault│
│ • Yield Dashboard│    │ • Auto Rebalance│    │ • Protocol      │
│ • Deposit/Withdraw│   │ • Safe Integration│  │   Adapters      │
│ • Auto-Yield UI │     │ • Gas Optimization│  │ • Session Keys  │
└─────────────────┘     └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Base Network  │
                    │                 │
                    │ • Aave V3       │
                    │ • Morpho Blue   │
                    │ • Moonwell      │
                    │ • Safe Wallets  │
                    └─────────────────┘
```

## 🛡️ Safe4337 Smart Wallet Integration

This project includes a **complete Safe4337 smart wallet integration** fulfilling all assignment requirements:

### ✅ Assignment Requirements Met

- **✅ ERC-4337 Vault**: Safe smart accounts with Safe4337Module  
- **✅ Session Keys**: Restricted permissions for keeper bot (rebalance-only)
- **✅ Account Abstraction**: UserOperations instead of EOA transactions
- **✅ Auto-Yield Toggle**: Grant/revoke session keys via UI
- **✅ Safety Features**: Daily limits, key expiration, instant revocation
- **✅ Meta-transactions**: Bundler integration via Pimlico
- **✅ Gas Sponsorship**: Optional paymaster for seamless UX

### 🎯 Key Features

- **Smart Accounts**: Deploy Safe wallets with ERC-4337 support
- **Rebalance-Only Access**: Session keys cannot withdraw or transfer funds  
- **24/7 Automation**: Keeper bot operates without compromising security
- **Time-Limited Keys**: Session keys expire after 24 hours automatically
- **Transaction Limits**: Maximum 1000 rebalances per session key
- **Instant Revocation**: Users can revoke automation anytime

### 📖 Documentation

For complete implementation details, see **[SAFE4337_README.md](./SAFE4337_README.md)**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Base network RPC URL
- Private key for deployment/keeper

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assign-elsa
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp contracts/.env.example contracts/.env
   cp keeper/env.example keeper/.env
   cp frontend/env.example frontend/.env.local
   
   # Edit the .env files with your configuration
   ```

4. **Deploy smart contracts**
   ```bash
   cd contracts
   npm run compile
   npm run deploy
   ```

5. **Start the keeper service**
   ```bash
   cd keeper
   npm run build
   npm start
   ```

6. **Launch the frontend**
   ```bash
   cd frontend
   npm run dev
   ```


## 🔧 Smart Contracts

### USDCYieldVault
- **Standard**: ERC-4626 compliant
- **Function**: Main vault contract managing user deposits
- **Features**: 
  - Automated yield optimization
  - Principal tracking for yield calculation
  - Emergency pause functionality
  - Rebalancing with threshold controls

### Protocol Adapters
- **AaveAdapter**: Interfaces with Aave V3 USDC pool
- **MorphoAdapter**: Interfaces with Morpho Blue isolated markets
- **MoonwellAdapter**: Interfaces with Moonwell USDC market

### Key Functions
```solidity
// Deposit USDC and receive vault shares
function deposit(uint256 assets, address receiver) returns (uint256 shares)

// Withdraw USDC by burning shares
function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)

// Rebalance to optimal protocol (keeper only)
function rebalance(uint8 targetProtocol, uint256 expectedGain, uint256 gasCost)

// Get current yield earned by user
function getYieldEarned(address user) returns (uint256)
```

## 🤖 Keeper Service

The keeper service monitors APY rates and automatically rebalances funds when profitable:

### Key Features
- **APY Monitoring**: Fetches rates from De.Fi API and protocol subgraphs
- **Profitability Calculation**: Only rebalances when gain > 30 bps and gas < 10 bps
- **Safe Integration**: Uses account abstraction for secure automated transactions
- **Error Handling**: Robust retry logic and failure notifications

### Configuration
```typescript
{
  minRebalanceThreshold: 30,    // basis points
  maxGasCostThreshold: 10,      // basis points  
  checkInterval: 30,            // minutes
  rpcUrl: "https://sepolia.base.org",
  safeAddress: "0x...",         // Your Safe wallet or opted in
  vaultAddress: "0x..."         // Deployed vault
}
```

## 🎨 Frontend

Built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**:

### Features
- **Wallet Connection**: WalletConnect integration with Base network
- **Yield Dashboard**: Real-time APY tracking and yield visualization  
- **Deposit/Withdraw**: Seamless USDC management with vault shares
- **Auto-Yield Toggle**: Enable/disable automated rebalancing
- **Transaction History**: Complete audit trail of rebalances

### Key Components
- `APYTable`: Live protocol rate comparison
- `VaultStats`: User position and yield summary
- `YieldChart`: Historical performance visualization
- `DepositWithdraw`: Fund management interface
- `AutoYieldToggle`: Automation controls

## 🔐 Security Features

### Account Abstraction
- **Safe Wallets**: Multi-sig security with configurable thresholds
- **Session Keys**: Limited permissions for keeper (rebalance only)
- **Spending Limits**: Daily caps and function restrictions
- **Revocable Access**: Users can disable automation anytime

### Smart Contract Security
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency stop functionality  
- **Access Control**: Owner-only administrative functions
- **Input Validation**: Comprehensive parameter checking

### Operational Security
- **Threshold Controls**: Minimum 30 bps gain required for rebalancing
- **Gas Limits**: Maximum 10 bps annualized cost threshold
- **Transparent Operations**: All transactions visible on-chain

## 📊 Yield Optimization Logic

The system automatically rebalances based on:

1. **APY Differential**: Target protocol must offer ≥30 bps higher yield
2. **Gas Cost Analysis**: Annual gas cost must be ≤10 bps of total assets
3. **Market Conditions**: Considers liquidity and protocol stability
4. **Time Delays**: Minimum intervals between rebalances to prevent MEV

### Example Scenario
```
Current: Aave 3.5% APY
Available: Morpho 4.2% APY (+70 bps)
Gas Cost: 0.05% annually (5 bps)
Decision: REBALANCE ✅ (70 bps > 30 bps threshold, 5 bps < 10 bps limit)
```

## 🧪 Testing

### Contract Tests
```bash
cd contracts
npm test
```

### Integration Tests
```bash
# Test keeper service
cd keeper
npm test

# Test frontend components
cd frontend
npm test
```

## 🚀 Deployment Guide

### 1. Smart Contracts (Base Sepolia)
```bash
cd contracts
cp .env.example .env
# Configure PRIVATE_KEY and RPC URLs
npm run deploy
```

### 2. Keeper Service
```bash
cd keeper
cp env.example .env
# Configure keeper credentials
npm run build && npm start
```

### 3. Frontend (Vercel)
```bash
cd frontend
# Set environment variables in Vercel dashboard
vercel --prod
```

## 📈 Analytics Integration

### Segment Events
- `vault_deposit`: User deposits USDC
- `vault_withdraw`: User withdraws funds
- `rebalance_executed`: Automated rebalancing
- `yield_earned`: Yield calculation updates
- `auto_yield_toggled`: Automation enabled/disabled

### Dune Dashboard
Track key metrics:
- Total Value Locked (TVL)
- Yield generated across protocols
- Rebalancing frequency and success rate
- User adoption and retention
- Gas costs and optimization efficiency


## 🛠️ Development

### Adding New Protocols
1. Implement `IProtocolAdapter` interface
2. Add to vault's protocol enum
3. Deploy and set adapter address
4. Update keeper APY monitoring
5. Add frontend protocol display

### Customizing Thresholds
```solidity
// In USDCYieldVault.sol
uint256 public constant MIN_REBALANCE_THRESHOLD = 30; // Adjustable
uint256 public constant MAX_GAS_COST_THRESHOLD = 10;   // Adjustable
```


### Contract Deployments
| Contract | Address | Verification |
|----------|---------|--------------|
| **USDCYieldVault** | `0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f` | [BaseScan ↗](https://sepolia.basescan.org/address/0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f) |
| **TestnetAaveAdapter** | `0x25e390f75320c7E88337e3945dcD68E6F0ca02ed` | [BaseScan ↗](https://sepolia.basescan.org/address/0x25e390f75320c7E88337e3945dcD68E6F0ca02ed) |
| **TestnetMorphoAdapter** | `0xB438f6DA411D17472AF1735511f9296E5C9341AF` | [BaseScan ↗](https://sepolia.basescan.org/address/0xB438f6DA411D17472AF1735511f9296E5C9341AF) |
| **TestnetMoonwellAdapter** | `0x9258CB7AC8DcC2456C340837EEbA0926A06DE2D7` | [BaseScan ↗](https://sepolia.basescan.org/address/0x9258CB7AC8DcC2456C340837EEbA0926A06DE2D7) |
| **USDC (Sepolia)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | [BaseScan ↗](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |
---

**⚠️ Disclaimer**: This is a proof-of-concept for educational purposes. Use at your own risk. Always audit smart contracts before mainnet deployment.