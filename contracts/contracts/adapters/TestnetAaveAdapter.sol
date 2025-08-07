// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProtocolAdapter.sol";

/**
 * @title TestnetAaveAdapter
 * @notice Simplified Aave adapter for Base Sepolia testnet
 * @dev Mock implementation for testing purposes without requiring actual Aave deployment
 */
contract TestnetAaveAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    /// @notice USDC address on Base Sepolia
    IERC20 public immutable USDC;
    
    /// @notice Vault address that owns this adapter
    address public immutable vault;

    /// @notice Mock balance tracking for testnet
    uint256 private _balance;
    
    /// @notice Mock APY (5% for testing)
    uint256 private constant MOCK_APY = 500; // 5.00% in basis points

    constructor(address _usdc, address _vault) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        vault = _vault;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can call");
        _;
    }

    /// @notice Mock deposit function for testnet
    function deposit(uint256 amount) external override onlyVault {
        USDC.transferFrom(vault, address(this), amount);
        _balance += amount;
    }

    /// @notice Mock withdraw function for testnet
    function withdraw(uint256 amount) external override onlyVault {
        require(_balance >= amount, "Insufficient balance");
        _balance -= amount;
        USDC.transfer(vault, amount);
    }

    /// @notice Get mock balance
    function balanceOf(address account) external view override returns (uint256) {
        if (account != vault) return 0;
        return _balance;
    }

    /// @notice Get mock APY
    function getAPY() external pure override returns (uint256) {
        return MOCK_APY;
    }

    /// @notice Get underlying asset
    function asset() external view override returns (address) {
        return address(USDC);
    }

    /// @notice Emergency withdraw function
    function emergencyWithdraw() external override onlyOwner {
        if (_balance > 0) {
            uint256 currentBalance = _balance;
            _balance = 0;
            USDC.transfer(vault, currentBalance);
        }
    }

    /// @notice Get current balance for testing
    function getCurrentBalance() external view returns (uint256) {
        return _balance;
    }
}
