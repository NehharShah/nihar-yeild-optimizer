// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./SessionKeyManager.sol";

// Safe contract interfaces
interface ISafeProxyFactory {
        function createProxyWithNonce(
            address singleton,
            bytes memory initializer,
            uint256 saltNonce
        ) external returns (address proxy);
        
        function proxyCreationCode() external pure returns (bytes memory);
    }

interface ISafe {
    function setup(
        address[] calldata _owners,
        uint256 _threshold,
        address to,
        bytes calldata data,
        address fallbackHandler,
        address paymentToken,
        uint256 payment,
        address payable paymentReceiver
    ) external;

    function enableModule(address module) external;
    function isModuleEnabled(address module) external view returns (bool);
    function getOwners() external view returns (address[] memory);
}

interface IAddModuleLib {
    function enableModule(address module) external;
}

/// @title SafeWalletFactory
/// @notice Factory for creating Safe smart accounts with integrated session key management
/// @dev Creates Safe accounts and sets up session key permissions in one transaction
contract SafeWalletFactory is Ownable {

    // Safe4337 configuration
    address public immutable safeProxyFactory;
    address public immutable safeSingleton;
    address public immutable safe4337Module;
    address public immutable addModuleLib;
    address public immutable multiSend;
    
    SessionKeyManager public immutable sessionKeyManager;

    struct SafeConfig {
        address[] owners;
        uint256 threshold;
        uint256 saltNonce;
        address fallbackHandler;
        bytes setupData;
    }

    event SafeCreated(
        address indexed safeAddress,
        address indexed owner,
        uint256 saltNonce,
        bytes32 sessionKeyId
    );

    constructor(
        address _safeProxyFactory,
        address _safeSingleton,
        address _safe4337Module,
        address _addModuleLib,
        address _multiSend
    ) Ownable(msg.sender) {
        require(_safeProxyFactory != address(0), "Invalid SafeProxyFactory");
        require(_safeSingleton != address(0), "Invalid Safe singleton");
        require(_safe4337Module != address(0), "Invalid Safe4337Module");
        require(_addModuleLib != address(0), "Invalid AddModuleLib");
        require(_multiSend != address(0), "Invalid MultiSend");

        safeProxyFactory = _safeProxyFactory;
        safeSingleton = _safeSingleton;
        safe4337Module = _safe4337Module;
        addModuleLib = _addModuleLib;
        multiSend = _multiSend;

        // Deploy session key manager
        sessionKeyManager = new SessionKeyManager();
    }

    /// @notice Create a Safe with session key for yield optimizer
    /// @param owner The owner address for the Safe
    /// @param sessionKeyAddress The session key address for the keeper bot
    /// @param vaultAddress The vault contract address
    /// @param saltNonce Salt for deterministic address generation
    /// @return safeAddress The created Safe address
    /// @return keyId The session key ID
    function createSafeWithSessionKey(
        address owner,
        address sessionKeyAddress,
        address vaultAddress,
        uint256 saltNonce
    ) external returns (address safeAddress, bytes32 keyId) {
        require(owner != address(0), "Invalid owner");
        require(sessionKeyAddress != address(0), "Invalid session key");
        require(vaultAddress != address(0), "Invalid vault address");

        // 1. Create the Safe
        safeAddress = _createSafe(owner, saltNonce);

        // 2. Grant session key for rebalance function
        keyId = _grantRebalanceSessionKey(
            owner,
            sessionKeyAddress,
            vaultAddress
        );

        emit SafeCreated(safeAddress, owner, saltNonce, keyId);
    }

    /// @notice Get the predicted Safe address
    /// @param owner The owner address
    /// @param saltNonce Salt for deterministic address
    /// @return predictedAddress The predicted Safe address
    function predictSafeAddress(
        address owner,
        uint256 saltNonce
    ) external view returns (address predictedAddress) {
        address[] memory owners = new address[](1);
        owners[0] = owner;
        
        bytes memory initializer = abi.encodeCall(
            ISafe.setup,
            (
                owners,
                1, // threshold
                addModuleLib, // to
                abi.encodeCall(IAddModuleLib.enableModule, (safe4337Module)), // data
                safe4337Module, // fallbackHandler
                address(0), // paymentToken
                0, // payment
                payable(address(0)) // paymentReceiver
            )
        );

        bytes memory deploymentData = abi.encodePacked(
            ISafeProxyFactory(safeProxyFactory).proxyCreationCode(),
            uint256(uint160(safeSingleton))
        );

        bytes32 salt = keccak256(abi.encodePacked(initializer, saltNonce));
        predictedAddress = Create2.computeAddress(salt, keccak256(deploymentData), safeProxyFactory);
    }

    /// @notice Internal function to create Safe
    function _createSafe(
        address owner,
        uint256 saltNonce
    ) internal returns (address safeAddress) {
        address[] memory owners = new address[](1);
        owners[0] = owner;

        bytes memory initializer = abi.encodeCall(
            ISafe.setup,
            (
                owners,
                1, // threshold
                addModuleLib, // to
                abi.encodeCall(IAddModuleLib.enableModule, (safe4337Module)), // data
                safe4337Module, // fallbackHandler
                address(0), // paymentToken
                0, // payment
                payable(address(0)) // paymentReceiver
            )
        );

        safeAddress = ISafeProxyFactory(safeProxyFactory).createProxyWithNonce(
            safeSingleton,
            initializer,
            saltNonce
        );

        require(safeAddress != address(0), "Safe creation failed");
    }

    /// @notice Internal function to grant rebalance session key
    function _grantRebalanceSessionKey(
        address owner,
        address sessionKeyAddress,
        address vaultAddress
    ) internal returns (bytes32 keyId) {
        // Grant session key with rebalance-only permissions
        keyId = sessionKeyManager.grantSessionKey(
            sessionKeyAddress,
            vaultAddress,
            0x7dc0d1d0, // rebalance(uint8,uint256,uint256) selector
            0, // No ETH value allowed
            1000, // Max 1000 transactions per day
            block.timestamp, // Valid immediately
            block.timestamp + 24 hours // Valid for 24 hours
        );
    }

    /// @notice Check if a Safe has the required modules enabled
    /// @param safeAddress The Safe address to check
    /// @return isConfigured Whether the Safe is properly configured
    function isSafeConfigured(address safeAddress) external view returns (bool isConfigured) {
        try ISafe(safeAddress).isModuleEnabled(safe4337Module) returns (bool enabled) {
            return enabled;
        } catch {
            return false;
        }
    }

    /// @notice Get Safe owners
    /// @param safeAddress The Safe address
    /// @return owners Array of owner addresses
    function getSafeOwners(address safeAddress) external view returns (address[] memory owners) {
        try ISafe(safeAddress).getOwners() returns (address[] memory _owners) {
            return _owners;
        } catch {
            return new address[](0);
        }
    }

    /// @notice Emergency function to update session key manager (only owner)
    /// @param newSessionKeyManager The new session key manager address
    function updateSessionKeyManager(address newSessionKeyManager) external onlyOwner {
        require(newSessionKeyManager != address(0), "Invalid address");
        // This would require a more sophisticated upgrade mechanism in production
        // For now, this is a placeholder for the upgrade functionality
    }
}
