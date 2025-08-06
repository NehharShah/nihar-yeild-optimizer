// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IProtocolAdapter
 * @notice Interface for protocol adapters to interact with different lending protocols
 */
interface IProtocolAdapter {
    /// @notice Deposit assets to the protocol
    /// @param amount Amount of assets to deposit
    function deposit(uint256 amount) external;

    /// @notice Withdraw assets from the protocol  
    /// @param amount Amount of assets to withdraw
    function withdraw(uint256 amount) external;

    /// @notice Get current balance of assets in the protocol
    /// @param account Account to check balance for
    /// @return Balance of assets
    function balanceOf(address account) external view returns (uint256);

    /// @notice Get current APY from the protocol
    /// @return APY in basis points (e.g., 500 = 5.00%)
    function getAPY() external view returns (uint256);

    /// @notice Get the underlying asset address
    /// @return Asset address
    function asset() external view returns (address);

    /// @notice Emergency withdraw all funds
    function emergencyWithdraw() external;
}