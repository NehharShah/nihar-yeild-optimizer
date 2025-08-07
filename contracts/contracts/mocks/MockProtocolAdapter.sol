// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProtocolAdapter.sol";

/**
 * @title MockProtocolAdapter
 * @notice Simple mock adapter for testing
 */
contract MockProtocolAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable USDC;
    string public name;
    uint256 private _apy;
    uint256 private _balance;
    
    constructor(address _usdc, string memory _name, uint256 _initialAPY) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        name = _name;
        _apy = _initialAPY;
    }
    
    function deposit(uint256 amount) external override {
        USDC.transferFrom(msg.sender, address(this), amount);
        _balance += amount;
    }
    
    function withdraw(uint256 amount) external override {
        require(_balance >= amount, "Insufficient balance");
        _balance -= amount;
        USDC.transfer(msg.sender, amount);
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        if (account == address(this) || account == msg.sender) {
            return _balance;
        }
        return 0;
    }
    
    function getAPY() external view override returns (uint256) {
        return _apy;
    }
    
    function asset() external view override returns (address) {
        return address(USDC);
    }
    
    function emergencyWithdraw() external override onlyOwner {
        uint256 usdcBalance = USDC.balanceOf(address(this));
        if (usdcBalance > 0) {
            USDC.transfer(msg.sender, usdcBalance);
        }
        _balance = 0;
    }
    
    // Helper functions for testing
    function increaseBalance(uint256 amount) external onlyOwner {
        _balance += amount;
    }
    
    function setAPY(uint256 newAPY) external onlyOwner {
        _apy = newAPY;
    }
}
