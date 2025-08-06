// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProtocolAdapter.sol";

/// @notice Moonwell interfaces (Compound-like)
interface IMToken is IERC20 {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function exchangeRateStored() external view returns (uint256);
    function balanceOfUnderlying(address owner) external returns (uint256);
    function supplyRatePerBlock() external view returns (uint256);
    function underlying() external view returns (address);
}

interface IComptroller {
    function markets(address mToken) external view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped);
    function enterMarkets(address[] calldata mTokens) external returns (uint256[] memory);
}

/**
 * @title MoonwellAdapter
 * @notice Adapter for Moonwell protocol on Base
 */
contract MoonwellAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;

    /// @notice mUSDC token on Moonwell Base
    IMToken public constant mUSDC = IMToken(0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22);
    
    /// @notice Moonwell Comptroller on Base  
    IComptroller public constant COMPTROLLER = IComptroller(0xfBb21d0380beE3312B33c4353c8936a0F13EF26C);
    
    /// @notice USDC address on Base
    IERC20 public immutable USDC;
    
    /// @notice Vault address that owns this adapter
    address public immutable vault;

    /// @notice Mantissa constant (1e18)
    uint256 public constant MANTISSA = 1e18;
    
    /// @notice Blocks per year on Base (assuming 2s block time)
    uint256 public constant BLOCKS_PER_YEAR = 365 days / 2;

    constructor(address _usdc, address _vault) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        vault = _vault;
        
        // Approve max to mUSDC
        USDC.approve(address(mUSDC), type(uint256).max);
        
        // Enter market for this adapter
        address[] memory markets = new address[](1);
        markets[0] = address(mUSDC);
        COMPTROLLER.enterMarkets(markets);
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    /// @notice Deposit USDC to Moonwell
    function deposit(uint256 amount) external override onlyVault {
        USDC.transferFrom(vault, address(this), amount);
        
        // Mint mUSDC tokens
        uint256 result = mUSDC.mint(amount);
        require(result == 0, "Moonwell mint failed");
    }

    /// @notice Withdraw USDC from Moonwell  
    function withdraw(uint256 amount) external override onlyVault {
        // Redeem underlying USDC
        uint256 result = mUSDC.redeemUnderlying(amount);
        require(result == 0, "Moonwell redeem failed");
        
        // Transfer USDC to vault
        USDC.transfer(vault, amount);
    }

    /// @notice Get USDC balance (underlying value of mUSDC held)
    function balanceOf(address account) external view override returns (uint256) {
        if (account != vault) return 0;
        
        uint256 mTokenBalance = mUSDC.balanceOf(address(this));
        uint256 exchangeRate = mUSDC.exchangeRateStored();
        
        // Convert mUSDC to USDC using exchange rate
        return (mTokenBalance * exchangeRate) / MANTISSA;
    }

    /// @notice Get current supply APY
    function getAPY() external view override returns (uint256) {
        uint256 supplyRatePerBlock = mUSDC.supplyRatePerBlock();
        
        // Convert to APY: ((1 + ratePerBlock) ^ blocksPerYear - 1) * 10000
        // Approximation for small rates: ratePerBlock * blocksPerYear * 10000
        return (supplyRatePerBlock * BLOCKS_PER_YEAR * 10000) / MANTISSA;
    }

    /// @notice Get underlying asset
    function asset() external view override returns (address) {
        return address(USDC);
    }

    /// @notice Emergency withdraw all mUSDC
    function emergencyWithdraw() external override onlyOwner {
        uint256 mTokenBalance = mUSDC.balanceOf(address(this));
        
        if (mTokenBalance > 0) {
            // Redeem all mTokens
            uint256 result = mUSDC.redeem(mTokenBalance);
            require(result == 0, "Emergency redeem failed");
            
            // Transfer all USDC to vault
            uint256 usdcBalance = USDC.balanceOf(address(this));
            if (usdcBalance > 0) {
                USDC.transfer(vault, usdcBalance);
            }
        }
    }

    /// @notice Get mToken balance
    function getMTokenBalance() external view returns (uint256) {
        return mUSDC.balanceOf(address(this));
    }

    /// @notice Get current exchange rate
    function getExchangeRate() external view returns (uint256) {
        return mUSDC.exchangeRateStored();
    }

    /// @notice Check if market is listed
    function isMarketListed() external view returns (bool) {
        (bool isListed,,) = COMPTROLLER.markets(address(mUSDC));
        return isListed;
    }
}