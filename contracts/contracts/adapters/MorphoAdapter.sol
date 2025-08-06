// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProtocolAdapter.sol";

/// @notice Morpho Blue interfaces
interface IMorpho {
    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }

    struct Market {
        uint128 totalSupplyAssets;
        uint128 totalSupplyShares;
        uint128 totalBorrowAssets;
        uint128 totalBorrowShares;
        uint128 lastUpdate;
        uint128 fee;
    }

    function supply(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalfOf,
        bytes calldata data
    ) external returns (uint256 assetsSupplied, uint256 sharesSupplied);

    function withdraw(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalfOf,
        address receiver
    ) external returns (uint256 assetsWithdrawn, uint256 sharesWithdrawn);

    function market(bytes32 id) external view returns (Market memory);
    
    function position(bytes32 id, address user) external view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral);
    
    function expectedSupplyAssets(MarketParams memory marketParams, address user) external view returns (uint256);
}

interface IIrm {
    function borrowRate(IMorpho.MarketParams memory marketParams, IMorpho.Market memory market) external view returns (uint256);
}

/**
 * @title MorphoAdapter  
 * @notice Adapter for Morpho Blue protocol on Base
 */
contract MorphoAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;

    /// @notice Morpho Blue contract address on Base
    IMorpho public constant MORPHO = IMorpho(0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb);
    
    /// @notice USDC address on Base
    IERC20 public immutable USDC;
    
    /// @notice Vault address that owns this adapter
    address public immutable vault;

    /// @notice USDC market parameters on Morpho Blue
    IMorpho.MarketParams public marketParams;
    
    /// @notice Market ID for USDC market
    bytes32 public marketId;

    /// @notice WAD constant for calculations
    uint256 public constant WAD = 1e18;
    
    /// @notice Seconds per year
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    constructor(
        address _usdc, 
        address _vault,
        IMorpho.MarketParams memory _marketParams
    ) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        vault = _vault;
        marketParams = _marketParams;
        
        // Calculate market ID
        marketId = keccak256(abi.encode(_marketParams));
        
        // Approve max to Morpho
        USDC.approve(address(MORPHO), type(uint256).max);
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    /// @notice Deposit USDC to Morpho Blue
    function deposit(uint256 amount) external override onlyVault {
        USDC.transferFrom(vault, address(this), amount);
        
        // Supply to Morpho Blue market
        MORPHO.supply(
            marketParams,
            amount,
            0, // shares = 0 means calculate from assets
            address(this),
            ""
        );
    }

    /// @notice Withdraw USDC from Morpho Blue
    function withdraw(uint256 amount) external override onlyVault {
        // Withdraw from Morpho Blue
        MORPHO.withdraw(
            marketParams,
            amount,
            0, // shares = 0 means calculate from assets
            address(this),
            vault
        );
    }

    /// @notice Get supply balance in USDC terms
    function balanceOf(address account) external view override returns (uint256) {
        if (account != vault) return 0;
        return MORPHO.expectedSupplyAssets(marketParams, address(this));
    }

    /// @notice Get current supply APY
    function getAPY() external view override returns (uint256) {
        IMorpho.Market memory market = MORPHO.market(marketId);
        
        if (market.totalSupplyAssets == 0) return 0;
        
        // Get interest rate model
        IIrm irm = IIrm(marketParams.irm);
        uint256 borrowRate = irm.borrowRate(marketParams, market);
        
        // Calculate supply rate based on utilization
        uint256 utilization = market.totalBorrowAssets * WAD / market.totalSupplyAssets;
        uint256 supplyRate = (borrowRate * utilization * (WAD - market.fee)) / (WAD * WAD);
        
        // Convert to basis points (supplyRate is per second in WAD)
        return (supplyRate * SECONDS_PER_YEAR * 10000) / WAD;
    }

    /// @notice Get underlying asset
    function asset() external view override returns (address) {
        return address(USDC);
    }

    /// @notice Emergency withdraw all funds
    function emergencyWithdraw() external override onlyOwner {
        uint256 suppliedAssets = MORPHO.expectedSupplyAssets(marketParams, address(this));
        
        if (suppliedAssets > 0) {
            MORPHO.withdraw(
                marketParams,
                suppliedAssets,
                0,
                address(this),
                vault
            );
        }
    }

    /// @notice Get market information
    function getMarketInfo() external view returns (IMorpho.Market memory) {
        return MORPHO.market(marketId);
    }

    /// @notice Get position information
    function getPosition() external view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral) {
        return MORPHO.position(marketId, address(this));
    }

    /// @notice Update market parameters (admin only)
    function updateMarketParams(IMorpho.MarketParams memory _marketParams) external onlyOwner {
        marketParams = _marketParams;
        marketId = keccak256(abi.encode(_marketParams));
    }
}