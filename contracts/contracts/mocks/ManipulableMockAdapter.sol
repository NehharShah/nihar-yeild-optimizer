// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProtocolAdapter.sol";

/**
 * @title ManipulableMockAdapter
 * @notice Mock adapter that can be manipulated for testing edge cases and attacks
 * @dev Used for testing oracle manipulation, APY spoofing, and slippage scenarios
 */
contract ManipulableMockAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable USDC;
    address public immutable vault;
    
    // Mock state that can be manipulated
    uint256 private _balance;
    uint256 private _apy = 500; // Default 5% APY
    bool private _shouldFailDeposit = false;
    bool private _shouldFailWithdraw = false;
    uint256 private _slippagePercent = 0; // 0-10000 (0-100%)
    uint256 private _maxDepositLimit = type(uint256).max;
    
    // Attack simulation
    bool private _isUnderAttack = false;
    uint256 private _attackSlippage = 0;
    
    event APYManipulated(uint256 oldAPY, uint256 newAPY);
    event AttackSimulated(bool isUnderAttack, uint256 attackSlippage);
    event SlippageSet(uint256 slippagePercent);

    constructor(address _usdc, address _vault) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        vault = _vault;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    /// @notice Deposit with potential manipulation/slippage
    function deposit(uint256 amount) external override onlyVault {
        if (_shouldFailDeposit) {
            revert("Forced deposit failure");
        }
        
        if (amount > _maxDepositLimit) {
            revert("Exceeds deposit limit");
        }
        
        USDC.transferFrom(vault, address(this), amount);
        
        // Apply slippage or attack effects
        uint256 effectiveAmount = amount;
        if (_isUnderAttack) {
            effectiveAmount = (amount * (10000 - _attackSlippage)) / 10000;
        } else if (_slippagePercent > 0) {
            effectiveAmount = (amount * (10000 - _slippagePercent)) / 10000;
        }
        
        _balance += effectiveAmount;
    }

    /// @notice Withdraw with potential manipulation/slippage
    function withdraw(uint256 amount) external override onlyVault {
        if (_shouldFailWithdraw) {
            revert("Forced withdraw failure");
        }
        
        require(_balance >= amount, "Insufficient balance");
        
        // Apply slippage or attack effects
        uint256 actualAmount = amount;
        if (_isUnderAttack) {
            actualAmount = (amount * (10000 - _attackSlippage)) / 10000;
        } else if (_slippagePercent > 0) {
            actualAmount = (amount * (10000 - _slippagePercent)) / 10000;
        }
        
        _balance -= amount;
        USDC.transfer(vault, actualAmount);
    }

    /// @notice Get balance (can be manipulated to simulate oracle attacks)
    function balanceOf(address account) external view override returns (uint256) {
        if (account != vault) return 0;
        
        // Simulate oracle manipulation during attack
        if (_isUnderAttack) {
            // Return inflated balance to simulate oracle manipulation
            return _balance + (_balance * _attackSlippage / 10000);
        }
        
        return _balance;
    }

    /// @notice Get APY (can be manipulated)
    function getAPY() external view override returns (uint256) {
        return _apy;
    }

    function asset() external view override returns (address) {
        return address(USDC);
    }

    function emergencyWithdraw() external override onlyOwner {
        uint256 usdcBalance = USDC.balanceOf(address(this));
        if (usdcBalance > 0) {
            USDC.transfer(vault, usdcBalance);
        }
        _balance = 0;
    }

    // === MANIPULATION FUNCTIONS FOR TESTING ===

    /// @notice Manipulate APY to simulate oracle spoofing
    function manipulateAPY(uint256 newAPY) external onlyOwner {
        uint256 oldAPY = _apy;
        _apy = newAPY;
        emit APYManipulated(oldAPY, newAPY);
    }

    /// @notice Simulate protocol attack with slippage
    function simulateAttack(bool underAttack, uint256 attackSlippage) external onlyOwner {
        _isUnderAttack = underAttack;
        _attackSlippage = attackSlippage;
        emit AttackSimulated(underAttack, attackSlippage);
    }

    /// @notice Set normal slippage for testing
    function setSlippage(uint256 slippagePercent) external onlyOwner {
        require(slippagePercent <= 10000, "Slippage too high");
        _slippagePercent = slippagePercent;
        emit SlippageSet(slippagePercent);
    }

    /// @notice Force deposit failures for testing
    function setShouldFailDeposit(bool shouldFail) external onlyOwner {
        _shouldFailDeposit = shouldFail;
    }

    /// @notice Force withdraw failures for testing
    function setShouldFailWithdraw(bool shouldFail) external onlyOwner {
        _shouldFailWithdraw = shouldFail;
    }

    /// @notice Set maximum deposit limit for testing
    function setMaxDepositLimit(uint256 limit) external onlyOwner {
        _maxDepositLimit = limit;
    }

    /// @notice Add yield to simulate earning (for testing)
    function addYield(uint256 yieldAmount) external onlyOwner {
        _balance += yieldAmount;
    }

    /// @notice Reduce balance to simulate losses (for testing)
    function reduceBalance(uint256 lossAmount) external onlyOwner {
        require(_balance >= lossAmount, "Cannot reduce more than balance");
        _balance -= lossAmount;
    }

    /// @notice Get internal balance (for testing)
    function getInternalBalance() external view returns (uint256) {
        return _balance;
    }
}
