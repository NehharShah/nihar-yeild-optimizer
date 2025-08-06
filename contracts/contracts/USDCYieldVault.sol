// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./interfaces/IProtocolAdapter.sol";

/**
 * @title USDCYieldVault
 * @notice ERC-4626 compliant vault that optimizes USDC yield across Aave, Morpho, and Moonwell
 * @dev Supports automated rebalancing through account abstraction wallets
 */
contract USDCYieldVault is ERC4626, Ownable, ReentrancyGuard, Pausable {
    /// @notice Protocol identifiers
    enum Protocol {
        AAVE,
        MORPHO, 
        MOONWELL
    }

    /// @notice Current active protocol for deposits
    Protocol public activeProtocol;

    /// @notice Protocol adapters
    mapping(Protocol => IProtocolAdapter) public adapters;

    /// @notice Last rebalance block
    uint256 public lastRebalanceBlock;

    /// @notice Minimum rebalance threshold (30 basis points)
    uint256 public constant MIN_REBALANCE_THRESHOLD = 30;

    /// @notice Maximum gas cost threshold (10 basis points annualized)
    uint256 public constant MAX_GAS_COST_THRESHOLD = 10;

    /// @notice Principal amounts for yield tracking
    mapping(address => uint256) public principalDeposited;

    /// @notice Total principal deposited
    uint256 public totalPrincipal;

    /// @notice Events
    event Rebalance(Protocol from, Protocol to, uint256 deltaBps, uint256 amount);
    event AdapterSet(Protocol protocol, address adapter);
    event YieldEarned(address indexed user, uint256 amount);

    /// @notice Errors
    error InvalidAdapter();
    error InsufficientYieldGain();
    error GasCostTooHigh();
    error NoFundsToRebalance();

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {
        activeProtocol = Protocol.AAVE; // Default to Aave
    }

    /// @notice Set protocol adapter
    function setAdapter(Protocol protocol, address adapter) external onlyOwner {
        if (adapter == address(0)) revert InvalidAdapter();
        adapters[protocol] = IProtocolAdapter(adapter);
        emit AdapterSet(protocol, adapter);
    }

    /// @notice Deposit assets and track principal
    function deposit(uint256 assets, address receiver) 
        public 
        virtual 
        override 
        nonReentrant 
        whenNotPaused 
        returns (uint256 shares) 
    {
        shares = super.deposit(assets, receiver);
        
        // Track principal for yield calculation
        principalDeposited[receiver] += assets;
        totalPrincipal += assets;

        // Deposit to active protocol
        _depositToProtocol(assets);
    }

    /// @notice Withdraw assets and update principal tracking
    function withdraw(uint256 assets, address receiver, address owner) 
        public 
        virtual 
        override 
        nonReentrant 
        returns (uint256 shares) 
    {
        // Calculate shares needed
        shares = previewWithdraw(assets);
        
        // Withdraw from active protocol
        _withdrawFromProtocol(assets);

        // Update principal tracking proportionally
        uint256 principalToReduce = (principalDeposited[owner] * shares) / balanceOf(owner);
        principalDeposited[owner] -= principalToReduce;
        totalPrincipal -= principalToReduce;

        // Execute withdrawal
        shares = super.withdraw(assets, receiver, owner);

        // Calculate and emit yield earned
        uint256 currentValue = convertToAssets(balanceOf(owner));
        uint256 yieldEarned = currentValue > principalDeposited[owner] ? 
            currentValue - principalDeposited[owner] : 0;
        
        if (yieldEarned > 0) {
            emit YieldEarned(owner, yieldEarned);
        }
    }

    /// @notice Rebalance funds to the most profitable protocol
    /// @param targetProtocol The protocol to rebalance to
    /// @param expectedGain Expected APY gain in basis points
    /// @param gasCost Estimated gas cost in basis points (annualized)
    function rebalance(
        Protocol targetProtocol, 
        uint256 expectedGain,
        uint256 gasCost
    ) external nonReentrant whenNotPaused {
        // Validate rebalance conditions
        if (expectedGain < MIN_REBALANCE_THRESHOLD) revert InsufficientYieldGain();
        if (gasCost > MAX_GAS_COST_THRESHOLD) revert GasCostTooHigh();
        if (totalAssets() == 0) revert NoFundsToRebalance();
        
        Protocol fromProtocol = activeProtocol;
        uint256 amount = totalAssets();

        // Withdraw from current protocol
        _withdrawFromProtocol(amount);

        // Deposit to target protocol
        activeProtocol = targetProtocol;
        _depositToProtocol(amount);

        lastRebalanceBlock = block.number;
        emit Rebalance(fromProtocol, targetProtocol, expectedGain, amount);
    }

    /// @notice Get yield earned for a specific user
    function getYieldEarned(address user) external view returns (uint256) {
        uint256 currentValue = convertToAssets(balanceOf(user));
        return currentValue > principalDeposited[user] ? 
            currentValue - principalDeposited[user] : 0;
    }

    /// @notice Get current APY from active protocol
    function getCurrentAPY() external view returns (uint256) {
        IProtocolAdapter adapter = adapters[activeProtocol];
        return adapter.getAPY();
    }

    /// @notice Get APY from specific protocol
    function getProtocolAPY(Protocol protocol) external view returns (uint256) {
        IProtocolAdapter adapter = adapters[protocol];
        return adapter.getAPY();
    }

    /// @notice Emergency pause
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Internal deposit to protocol
    function _depositToProtocol(uint256 amount) internal {
        IProtocolAdapter adapter = adapters[activeProtocol];
        IERC20(asset()).approve(address(adapter), amount);
        adapter.deposit(amount);
    }

    /// @notice Internal withdraw from protocol
    function _withdrawFromProtocol(uint256 amount) internal {
        IProtocolAdapter adapter = adapters[activeProtocol];
        adapter.withdraw(amount);
    }

    /// @notice Calculate total assets including protocol deposits
    function totalAssets() public view virtual override returns (uint256) {
        uint256 idleAssets = IERC20(asset()).balanceOf(address(this));
        
        IProtocolAdapter adapter = adapters[activeProtocol];
        if (address(adapter) == address(0)) {
            return idleAssets;
        }
        
        uint256 protocolAssets = adapter.balanceOf(address(this));
        return idleAssets + protocolAssets;
    }
}