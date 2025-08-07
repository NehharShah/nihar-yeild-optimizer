import { ethers } from "hardhat";
import { IMorpho } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());

  // Use different addresses for testnet vs mainnet
  const isTestnet = network.chainId === 84532n; // Base Sepolia
  const USDC_ADDRESS = isTestnet 
    ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // Base Sepolia USDC
    : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC
  
  // Deploy the main vault
  console.log("Deploying USDCYieldVault...");
  const USDCYieldVault = await ethers.getContractFactory("USDCYieldVault");
  const vault = await USDCYieldVault.deploy(
    USDC_ADDRESS,
    "USDC Yield Vault",
    "yUSDC"
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("USDCYieldVault deployed to:", vaultAddress);

  let deploymentInfo;

  if (isTestnet) {
    console.log("\n=== TESTNET DEPLOYMENT ===");
    console.log("Deploying adapters on testnet for testing purposes");
    
    // For testnet, we'll try to deploy adapters with mock addresses or skip if protocols don't exist
    let adapters: any = {};
    
    try {
      console.log("Deploying TestnetAaveAdapter...");
      const TestnetAaveAdapter = await ethers.getContractFactory("TestnetAaveAdapter");
      const aaveAdapter = await TestnetAaveAdapter.deploy(USDC_ADDRESS, vaultAddress);
      await aaveAdapter.waitForDeployment();
      const aaveAdapterAddress = await aaveAdapter.getAddress();
      console.log("TestnetAaveAdapter deployed to:", aaveAdapterAddress);
      adapters.TestnetAaveAdapter = aaveAdapterAddress;
      
      // Set adapter in vault
      await vault.setAdapter(0, aaveAdapterAddress);
    } catch (error) {
      console.log("TestnetAaveAdapter deployment failed:", (error as Error).message);
      adapters.TestnetAaveAdapter = "Deployment failed";
    }
    
    try {
      console.log("Deploying TestnetMoonwellAdapter...");
      const TestnetMoonwellAdapter = await ethers.getContractFactory("TestnetMoonwellAdapter");
      const moonwellAdapter = await TestnetMoonwellAdapter.deploy(USDC_ADDRESS, vaultAddress);
      await moonwellAdapter.waitForDeployment();
      const moonwellAdapterAddress = await moonwellAdapter.getAddress();
      console.log("TestnetMoonwellAdapter deployed to:", moonwellAdapterAddress);
      adapters.TestnetMoonwellAdapter = moonwellAdapterAddress;
      
      // Set adapter in vault
      await vault.setAdapter(1, moonwellAdapterAddress);
    } catch (error) {
      console.log("TestnetMoonwellAdapter deployment failed:", (error as Error).message);
      adapters.TestnetMoonwellAdapter = "Deployment failed";
    }
    
    try {
      console.log("Deploying TestnetMorphoAdapter...");
      const TestnetMorphoAdapter = await ethers.getContractFactory("TestnetMorphoAdapter");
      const morphoAdapter = await TestnetMorphoAdapter.deploy(USDC_ADDRESS, vaultAddress);
      await morphoAdapter.waitForDeployment();
      const morphoAdapterAddress = await morphoAdapter.getAddress();
      console.log("TestnetMorphoAdapter deployed to:", morphoAdapterAddress);
      adapters.TestnetMorphoAdapter = morphoAdapterAddress;
      
      // Set adapter in vault
      await vault.setAdapter(2, morphoAdapterAddress);
    } catch (error) {
      console.log("TestnetMorphoAdapter deployment failed:", (error as Error).message);
      adapters.TestnetMorphoAdapter = "Deployment failed";
    }
    
    deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId.toString()
      },
      deployer: deployer.address,
      contracts: {
        USDCYieldVault: vaultAddress,
        USDC: USDC_ADDRESS,
        ...adapters
      },
      timestamp: new Date().toISOString(),
      note: "Testnet deployment - adapters deployed where possible"
    };
  } else {
    // Full mainnet deployment with adapters
    const MORPHO_MARKET_PARAMS = {
      loanToken: USDC_ADDRESS,
      collateralToken: USDC_ADDRESS,
      oracle: "0x0000000000000000000000000000000000000000",
      irm: "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
      lltv: 0
    };

    // Deploy Aave adapter
    console.log("Deploying AaveAdapter...");
    const AaveAdapter = await ethers.getContractFactory("AaveAdapter");
    const aaveAdapter = await AaveAdapter.deploy(USDC_ADDRESS, vaultAddress);
    await aaveAdapter.waitForDeployment();
    const aaveAdapterAddress = await aaveAdapter.getAddress();
    console.log("AaveAdapter deployed to:", aaveAdapterAddress);

    // Deploy Morpho adapter
    console.log("Deploying MorphoAdapter...");
    const MorphoAdapter = await ethers.getContractFactory("MorphoAdapter");
    const morphoAdapter = await MorphoAdapter.deploy(
      USDC_ADDRESS, 
      vaultAddress, 
      MORPHO_MARKET_PARAMS
    );
    await morphoAdapter.waitForDeployment();
    const morphoAdapterAddress = await morphoAdapter.getAddress();
    console.log("MorphoAdapter deployed to:", morphoAdapterAddress);

    // Deploy Moonwell adapter
    console.log("Deploying MoonwellAdapter...");
    const MoonwellAdapter = await ethers.getContractFactory("MoonwellAdapter");
    const moonwellAdapter = await MoonwellAdapter.deploy(USDC_ADDRESS, vaultAddress);
    await moonwellAdapter.waitForDeployment();
    const moonwellAdapterAddress = await moonwellAdapter.getAddress();
    console.log("MoonwellAdapter deployed to:", moonwellAdapterAddress);

    // Set adapters in vault
    console.log("Setting adapters in vault...");
    await vault.setAdapter(0, aaveAdapterAddress);
    await vault.setAdapter(1, morphoAdapterAddress);
    await vault.setAdapter(2, moonwellAdapterAddress);

    deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId.toString()
      },
      deployer: deployer.address,
      contracts: {
        USDCYieldVault: vaultAddress,
        AaveAdapter: aaveAdapterAddress,
        MorphoAdapter: morphoAdapterAddress,
        MoonwellAdapter: moonwellAdapterAddress,
        USDC: USDC_ADDRESS
      },
      timestamp: new Date().toISOString()
    };

    console.log("\n=== Deployment Summary ===");
    console.log(`USDCYieldVault: ${vaultAddress}`);
    console.log(`AaveAdapter: ${aaveAdapterAddress}`);
    console.log(`MorphoAdapter: ${morphoAdapterAddress}`);
    console.log(`MoonwellAdapter: ${moonwellAdapterAddress}`);
    console.log(`USDC: ${USDC_ADDRESS}`);
  }

  console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});