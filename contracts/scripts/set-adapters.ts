import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting adapters with account:", deployer.address);

  const VAULT_ADDRESS = "0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f";
  const AAVE_ADAPTER = "0x25e390f75320c7E88337e3945dcD68E6F0ca02ed";
  const MOONWELL_ADAPTER = "0x9258CB7AC8DcC2456C340837EEbA0926A06DE2D7";
  const MORPHO_ADAPTER = "0xB438f6DA411D17472AF1735511f9296E5C9341AF";

  // Get the vault contract instance
  const USDCYieldVault = await ethers.getContractFactory("USDCYieldVault");
  const vault = USDCYieldVault.attach(VAULT_ADDRESS);

  console.log("Setting adapters in vault...");
  
  // Set adapters with delays between transactions
  try {
    console.log("Setting Aave adapter at index 0...");
    await vault.setAdapter(0, AAVE_ADAPTER);
    console.log("✓ Aave adapter set");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Setting Moonwell adapter at index 1...");
    await vault.setAdapter(1, MOONWELL_ADAPTER);
    console.log("✓ Moonwell adapter set");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Setting Morpho adapter at index 2...");
    await vault.setAdapter(2, MORPHO_ADAPTER);
    console.log("✓ Morpho adapter set");
    
  } catch (error) {
    console.error("Error setting adapters:", error);
  }

  console.log("\n=== Adapters Successfully Set ===");
  console.log("Vault:", VAULT_ADDRESS);
  console.log("Aave Adapter (0):", AAVE_ADAPTER);
  console.log("Moonwell Adapter (1):", MOONWELL_ADAPTER);
  console.log("Morpho Adapter (2):", MORPHO_ADAPTER);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
