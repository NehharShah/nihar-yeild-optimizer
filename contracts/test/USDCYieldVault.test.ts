import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { USDCYieldVault, AaveAdapter, MorphoAdapter, MoonwellAdapter } from "../typechain-types";

describe("USDCYieldVault", function () {
  // Fixture for deploying contracts
  async function deployVaultFixture() {
    const [owner, user1, user2, keeper] = await ethers.getSigners();

    // Mock USDC for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6); // 6 decimals like real USDC

    // Deploy vault
    const USDCYieldVault = await ethers.getContractFactory("USDCYieldVault");
    const vault = await USDCYieldVault.deploy(
      await usdc.getAddress(),
      "USDC Yield Vault",
      "yUSDC"
    );

    // Deploy mock adapters for testing
    const MockAdapter = await ethers.getContractFactory("MockProtocolAdapter");
    const aaveAdapter = await MockAdapter.deploy(await usdc.getAddress(), "Aave", 350); // 3.5% APY
    const morphoAdapter = await MockAdapter.deploy(await usdc.getAddress(), "Morpho", 420); // 4.2% APY
    const moonwellAdapter = await MockAdapter.deploy(await usdc.getAddress(), "Moonwell", 380); // 3.8% APY

    // Set adapters in vault
    await vault.setAdapter(0, await aaveAdapter.getAddress()); // AAVE
    await vault.setAdapter(1, await morphoAdapter.getAddress()); // MORPHO
    await vault.setAdapter(2, await moonwellAdapter.getAddress()); // MOONWELL

    // Mint USDC to users for testing
    const depositAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    await usdc.mint(user1.address, depositAmount);
    await usdc.mint(user2.address, depositAmount);

    return { vault, usdc, aaveAdapter, morphoAdapter, moonwellAdapter, owner, user1, user2, keeper, depositAmount };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { vault, usdc } = await loadFixture(deployVaultFixture);

      expect(await vault.asset()).to.equal(await usdc.getAddress());
      expect(await vault.name()).to.equal("USDC Yield Vault");
      expect(await vault.symbol()).to.equal("yUSDC");
      expect(await vault.activeProtocol()).to.equal(0); // Default to AAVE
    });
  });

  describe("Deposits", function () {
    it("Should allow users to deposit USDC", async function () {
      const { vault, usdc, user1, depositAmount } = await loadFixture(deployVaultFixture);

      // Approve and deposit
      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      
      const sharesBefore = await vault.balanceOf(user1.address);
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const sharesAfter = await vault.balanceOf(user1.address);

      expect(sharesAfter).to.be.gt(sharesBefore);
      expect(await vault.principalDeposited(user1.address)).to.equal(depositAmount);
    });

    it("Should track total assets correctly", async function () {
      const { vault, usdc, user1, depositAmount } = await loadFixture(deployVaultFixture);

      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      expect(await vault.totalAssets()).to.equal(depositAmount);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow users to withdraw their funds", async function () {
      const { vault, usdc, user1, depositAmount } = await loadFixture(deployVaultFixture);

      // First deposit
      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Then withdraw half
      const withdrawAmount = ethers.parseUnits("500", 6);
      const usdcBalanceBefore = await usdc.balanceOf(user1.address);
      
      await vault.connect(user1).withdraw(withdrawAmount, user1.address, user1.address);
      
      const usdcBalanceAfter = await usdc.balanceOf(user1.address);
      expect(usdcBalanceAfter).to.equal(usdcBalanceBefore + withdrawAmount);
    });

    it("Should update principal tracking on withdrawal", async function () {
      const { vault, usdc, user1, depositAmount } = await loadFixture(deployVaultFixture);

      // Deposit
      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Withdraw half
      const withdrawAmount = ethers.parseUnits("500", 6);
      await vault.connect(user1).withdraw(withdrawAmount, user1.address, user1.address);

      // Principal should be reduced proportionally
      const remainingPrincipal = await vault.principalDeposited(user1.address);
      expect(remainingPrincipal).to.be.lt(depositAmount);
    });
  });

  describe("Rebalancing", function () {
    it("Should allow rebalancing to higher APY protocol", async function () {
      const { vault, usdc, user1, depositAmount, owner } = await loadFixture(deployVaultFixture);

      // Deposit funds
      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Rebalance from Aave (0) to Morpho (1) - higher APY
      const expectedGain = 70; // 70 basis points (4.2% - 3.5%)
      const gasCost = 5; // 5 basis points

      await expect(
        vault.connect(owner).rebalance(1, expectedGain, gasCost)
      ).to.emit(vault, "Rebalance")
       .withArgs(0, 1, expectedGain, depositAmount);

      expect(await vault.activeProtocol()).to.equal(1); // Should be Morpho now
    });

    it("Should reject rebalancing with insufficient gain", async function () {
      const { vault, usdc, user1, depositAmount, owner } = await loadFixture(deployVaultFixture);

      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Try to rebalance with only 20 bps gain (below 30 bps threshold)
      await expect(
        vault.connect(owner).rebalance(1, 20, 5)
      ).to.be.revertedWithCustomError(vault, "InsufficientYieldGain");
    });

    it("Should reject rebalancing with high gas cost", async function () {
      const { vault, usdc, user1, depositAmount, owner } = await loadFixture(deployVaultFixture);

      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Try to rebalance with 15 bps gas cost (above 10 bps threshold)
      await expect(
        vault.connect(owner).rebalance(1, 50, 15)
      ).to.be.revertedWithCustomError(vault, "GasCostTooHigh");
    });
  });

  describe("Yield Calculation", function () {
    it("Should calculate yield earned correctly", async function () {
      const { vault, usdc, user1, depositAmount, morphoAdapter } = await loadFixture(deployVaultFixture);

      // Deposit
      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Simulate yield by increasing adapter balance
      const yieldAmount = ethers.parseUnits("50", 6); // 50 USDC yield
      await morphoAdapter.increaseBalance(yieldAmount);

      // Rebalance to Morpho to access the yield
      await vault.rebalance(1, 50, 5);

      const yieldEarned = await vault.getYieldEarned(user1.address);
      expect(yieldEarned).to.be.gt(0);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to set adapters", async function () {
      const { vault, user1, aaveAdapter } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setAdapter(0, await aaveAdapter.getAddress())
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("Should only allow authorized users to rebalance", async function () {
      const { vault, usdc, user1, depositAmount } = await loadFixture(deployVaultFixture);

      // First deposit some funds so rebalance has something to work with
      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Now test that non-owner cannot rebalance
      await expect(
        vault.connect(user1).rebalance(1, 50, 5)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause the contract", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).pause();
      expect(await vault.paused()).to.be.true;
    });

    it("Should prevent deposits when paused", async function () {
      const { vault, usdc, user1, depositAmount, owner } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).pause();
      await usdc.connect(user1).approve(await vault.getAddress(), depositAmount);

      await expect(
        vault.connect(user1).deposit(depositAmount, user1.address)
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });
  });
});