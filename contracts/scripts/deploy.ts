import { ethers } from "hardhat";
import { IMorpho } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Base network addresses
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  // Morpho Blue market parameters for USDC (example - needs to be updated with actual values)
  const MORPHO_MARKET_PARAMS = {
    loanToken: USDC_BASE,
    collateralToken: USDC_BASE, // Self-collateralized for supply-only
    oracle: "0x0000000000000000000000000000000000000000", // Zero address for self-collateralized
    irm: "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC", // Example IRM address
    lltv: 0 // 0% for supply-only markets
  };

  // Deploy the main vault
  console.log("Deploying USDCYieldVault...");
  const USDCYieldVault = await ethers.getContractFactory("USDCYieldVault");
  const vault = await USDCYieldVault.deploy(
    USDC_BASE,
    "USDC Yield Vault",
    "yUSDC"
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("USDCYieldVault deployed to:", vaultAddress);

  // Deploy Aave adapter
  console.log("Deploying AaveAdapter...");
  const AaveAdapter = await ethers.getContractFactory("AaveAdapter");
  const aaveAdapter = await AaveAdapter.deploy(USDC_BASE, vaultAddress);
  await aaveAdapter.waitForDeployment();
  const aaveAdapterAddress = await aaveAdapter.getAddress();
  console.log("AaveAdapter deployed to:", aaveAdapterAddress);

  // Deploy Morpho adapter
  console.log("Deploying MorphoAdapter...");
  const MorphoAdapter = await ethers.getContractFactory("MorphoAdapter");
  const morphoAdapter = await MorphoAdapter.deploy(
    USDC_BASE, 
    vaultAddress, 
    MORPHO_MARKET_PARAMS
  );
  await morphoAdapter.waitForDeployment();
  const morphoAdapterAddress = await morphoAdapter.getAddress();
  console.log("MorphoAdapter deployed to:", morphoAdapterAddress);

  // Deploy Moonwell adapter
  console.log("Deploying MoonwellAdapter...");
  const MoonwellAdapter = await ethers.getContractFactory("MoonwellAdapter");
  const moonwellAdapter = await MoonwellAdapter.deploy(USDC_BASE, vaultAddress);
  await moonwellAdapter.waitForDeployment();
  const moonwellAdapterAddress = await moonwellAdapter.getAddress();
  console.log("MoonwellAdapter deployed to:", moonwellAdapterAddress);

  // Set adapters in vault
  console.log("Setting adapters in vault...");
  await vault.setAdapter(0, aaveAdapterAddress); // AAVE = 0
  await vault.setAdapter(1, morphoAdapterAddress); // MORPHO = 1  
  await vault.setAdapter(2, moonwellAdapterAddress); // MOONWELL = 2

  console.log("\n=== Deployment Summary ===");
  console.log(`USDCYieldVault: ${vaultAddress}`);
  console.log(`AaveAdapter: ${aaveAdapterAddress}`);
  console.log(`MorphoAdapter: ${morphoAdapterAddress}`);
  console.log(`MoonwellAdapter: ${moonwellAdapterAddress}`);
  console.log(`USDC: ${USDC_BASE}`);

  // Save deployment addresses
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      USDCYieldVault: vaultAddress,
      AaveAdapter: aaveAdapterAddress,
      MorphoAdapter: morphoAdapterAddress,
      MoonwellAdapter: moonwellAdapterAddress,
      USDC: USDC_BASE
    },
    timestamp: new Date().toISOString()
  };

  console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});