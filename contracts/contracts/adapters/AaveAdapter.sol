// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProtocolAdapter.sol";

/// @notice Aave V3 interfaces for Base
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getReserveData(address asset) external view returns (ReserveData memory);
}

interface IAToken is IERC20 {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}

struct ReserveData {
    uint256 configuration;
    uint128 liquidityIndex;
    uint128 currentLiquidityRate;
    uint128 variableBorrowIndex;
    uint128 currentVariableBorrowRate;
    uint128 currentStableBorrowRate;
    uint40 lastUpdateTimestamp;
    uint16 id;
    address aTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    address interestRateStrategyAddress;
    uint128 accruedToTreasury;
    uint128 unbacked;
    uint128 isolationModeTotalDebt;
}

/**
 * @title AaveAdapter
 * @notice Adapter for Aave V3 protocol on Base
 */
contract AaveAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;

    /// @notice Aave V3 Pool address on Base
    IPool public constant AAVE_POOL = IPool(0xA238Dd80C259a72e81d7e4664a9801593F98d1c5);
    
    /// @notice USDC address on Base
    IERC20 public immutable USDC;
    
    /// @notice aUSDC token address
    IAToken public immutable aUSDC;
    
    /// @notice Vault address that owns this adapter
    address public immutable vault;

    /// @notice RAY constant for Aave calculations
    uint256 public constant RAY = 1e27;
    
    /// @notice Seconds per year for APY calculations
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    constructor(address _usdc, address _vault) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        vault = _vault;
        
        // Get aUSDC address from Aave pool
        ReserveData memory reserveData = AAVE_POOL.getReserveData(_usdc);
        aUSDC = IAToken(reserveData.aTokenAddress);
        
        // Approve max to Aave pool
        USDC.approve(address(AAVE_POOL), type(uint256).max);
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    /// @notice Deposit USDC to Aave
    function deposit(uint256 amount) external override onlyVault {
        USDC.transferFrom(vault, address(this), amount);
        AAVE_POOL.supply(address(USDC), amount, address(this), 0);
    }

    /// @notice Withdraw USDC from Aave
    function withdraw(uint256 amount) external override onlyVault {
        uint256 withdrawn = AAVE_POOL.withdraw(address(USDC), amount, vault);
        require(withdrawn >= amount, "Insufficient withdrawal");
    }

    /// @notice Get aUSDC balance (represents USDC deposited + interest)
    function balanceOf(address account) external view override returns (uint256) {
        if (account != vault) return 0;
        return aUSDC.balanceOf(address(this));
    }

    /// @notice Get current APY from Aave
    function getAPY() external view override returns (uint256) {
        ReserveData memory reserveData = AAVE_POOL.getReserveData(address(USDC));
        uint256 liquidityRate = reserveData.currentLiquidityRate;
        
        // Convert from ray to basis points and annualize
        // Aave rates are already annualized
        return (liquidityRate * 10000) / RAY;
    }

    /// @notice Get underlying asset
    function asset() external view override returns (address) {
        return address(USDC);
    }

    /// @notice Emergency withdraw all aUSDC
    function emergencyWithdraw() external override onlyOwner {
        uint256 aTokenBalance = aUSDC.balanceOf(address(this));
        if (aTokenBalance > 0) {
            AAVE_POOL.withdraw(address(USDC), type(uint256).max, vault);
        }
    }

    /// @notice Get detailed reserve information
    function getReserveData() external view returns (ReserveData memory) {
        return AAVE_POOL.getReserveData(address(USDC));
    }
}