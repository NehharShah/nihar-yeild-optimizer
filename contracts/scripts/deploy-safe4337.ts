import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Safe4337 infrastructure...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  console.log("Chain ID:", chainId);
  console.log("Network:", network.name);

  const isTestnet = chainId === 84532; // Base Sepolia

  if (!isTestnet && chainId !== 8453) {
    throw new Error("Only Base Mainnet (8453) and Base Sepolia (84532) are supported");
  }

  // Safe4337 contract addresses (these are already deployed by Safe team)
  const SAFE_4337_ADDRESSES = {
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    safe4337Module: "0xa581c4A4DB7175302464fF3C06380BC3270b4037",
    safeProxyFactory: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
    safeSingleton: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
    addModuleLib: "0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb",
    multiSend: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526"
  };

  console.log("\n=== SAFE4337 INFRASTRUCTURE VERIFICATION ===");
  
  // Verify Safe contracts are deployed
  for (const [name, address] of Object.entries(SAFE_4337_ADDRESSES)) {
    const code = await ethers.provider.getCode(address);
    if (code === "0x") {
      console.error(`❌ ${name} not deployed at ${address}`);
      throw new Error(`Safe contract ${name} not found`);
    } else {
      console.log(`✅ ${name}: ${address}`);
    }
  }

  console.log("\n=== DEPLOYING CUSTOM SAFE4337 CONTRACTS ===");

  // Deploy SessionKeyManager
  console.log("Deploying SessionKeyManager...");
  const SessionKeyManager = await ethers.getContractFactory("SessionKeyManager");
  const sessionKeyManager = await SessionKeyManager.deploy();
  await sessionKeyManager.waitForDeployment();
  const sessionKeyManagerAddress = await sessionKeyManager.getAddress();
  console.log("SessionKeyManager deployed to:", sessionKeyManagerAddress);

  // Deploy SafeWalletFactory
  console.log("Deploying SafeWalletFactory...");
  const SafeWalletFactory = await ethers.getContractFactory("SafeWalletFactory");
  const safeWalletFactory = await SafeWalletFactory.deploy(
    SAFE_4337_ADDRESSES.safeProxyFactory,
    SAFE_4337_ADDRESSES.safeSingleton,
    SAFE_4337_ADDRESSES.safe4337Module,
    SAFE_4337_ADDRESSES.addModuleLib,
    SAFE_4337_ADDRESSES.multiSend
  );
  await safeWalletFactory.waitForDeployment();
  const safeWalletFactoryAddress = await safeWalletFactory.getAddress();
  console.log("SafeWalletFactory deployed to:", safeWalletFactoryAddress);

  // Test contract interactions
  console.log("\n=== TESTING CONTRACTS ===");

  // Test SafeWalletFactory
  try {
    console.log("Testing SafeWalletFactory...");
    const testOwner = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Test address
    const saltNonce = 123456n;
    
    const predictedSafeAddress = await safeWalletFactory.predictSafeAddress(testOwner, saltNonce);
    console.log("✅ Predicted Safe address:", predictedSafeAddress);
    
    const isConfigured = await safeWalletFactory.isSafeConfigured(predictedSafeAddress);
    console.log("✅ Safe configuration check:", isConfigured ? "Configured" : "Not configured");
  } catch (error) {
    console.error("❌ SafeWalletFactory test failed:", error);
  }

  // Test SessionKeyManager
  try {
    console.log("Testing SessionKeyManager...");
    const testSessionKey = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Test address
    const testKeyId = ethers.keccak256(ethers.toUtf8Bytes("test-key-id"));
    
    const isValid = await sessionKeyManager.isSessionKeyValid(testKeyId);
    console.log("✅ Session key validation:", isValid ? "Valid" : "Invalid (expected)");
  } catch (error) {
    console.error("❌ SessionKeyManager test failed:", error);
  }

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", chainId === 84532 ? "Base Sepolia (Testnet)" : "Base Mainnet");
  console.log("Deployer:", deployer.address);

  const deploymentInfo = {
    chainId,
    network: network.name,
    deployer: deployer.address,
    contracts: {
      // Safe4337 Infrastructure (Pre-deployed)
      entryPoint: SAFE_4337_ADDRESSES.entryPoint,
      safe4337Module: SAFE_4337_ADDRESSES.safe4337Module,
      safeProxyFactory: SAFE_4337_ADDRESSES.safeProxyFactory,
      safeSingleton: SAFE_4337_ADDRESSES.safeSingleton,
      addModuleLib: SAFE_4337_ADDRESSES.addModuleLib,
      multiSend: SAFE_4337_ADDRESSES.multiSend,
      
      // Our Custom Contracts
      sessionKeyManager: sessionKeyManagerAddress,
      safeWalletFactory: safeWalletFactoryAddress,
    }
  };

  console.table(deploymentInfo.contracts);

  // Save deployment info
  const fs = require('fs');
  const deploymentPath = `./deployments/safe4337-${chainId}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📝 Deployment info saved to: ${deploymentPath}`);

  // Update contract addresses file
  const contractAddressesPath = '../CONTRACT_ADDRESSES.md';
  if (fs.existsSync(contractAddressesPath)) {
    const contractAddresses = fs.readFileSync(contractAddressesPath, 'utf8');
    const networkSection = chainId === 84532 ? 'Base Sepolia Testnet' : 'Base Mainnet';
    
    const newSection = `
## Safe4337 Infrastructure - ${networkSection}

### Pre-deployed Safe Contracts
- **EntryPoint**: \`${SAFE_4337_ADDRESSES.entryPoint}\`
- **Safe4337Module**: \`${SAFE_4337_ADDRESSES.safe4337Module}\`
- **SafeProxyFactory**: \`${SAFE_4337_ADDRESSES.safeProxyFactory}\`
- **SafeSingleton**: \`${SAFE_4337_ADDRESSES.safeSingleton}\`
- **AddModuleLib**: \`${SAFE_4337_ADDRESSES.addModuleLib}\`
- **MultiSend**: \`${SAFE_4337_ADDRESSES.multiSend}\`

### Custom Deployed Contracts
- **SessionKeyManager**: \`${sessionKeyManagerAddress}\`
- **SafeWalletFactory**: \`${safeWalletFactoryAddress}\`

`;
    
    fs.appendFileSync(contractAddressesPath, newSection);
    console.log(`📝 Contract addresses updated in: ${contractAddressesPath}`);
  }

  console.log("\n🎉 Safe4337 infrastructure deployment completed!");
  console.log("\n📋 Next Steps:");
  console.log("1. Update your frontend config with the new contract addresses");
  console.log("2. Update your keeper service config");
  console.log("3. Get a Pimlico API key for ERC-4337 bundler services");
  console.log("4. Test Safe wallet creation and session key management");
  console.log("5. Deploy on mainnet when ready");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
