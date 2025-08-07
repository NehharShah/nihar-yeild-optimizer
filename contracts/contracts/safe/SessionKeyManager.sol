// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title SessionKeyManager
/// @notice Manages session keys with specific permissions for Safe smart accounts
/// @dev Allows granting limited permissions to session keys for specific functions
contract SessionKeyManager is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct SessionKeyData {
        address sessionKey;      // The session key address
        address target;          // Target contract address
        bytes4 functionSelector; // Allowed function selector
        uint256 valueLimit;      // Maximum ETH value per transaction
        uint256 maxTransactions; // Maximum number of transactions allowed
        uint256 transactionCount; // Current transaction count
        uint256 validAfter;      // Unix timestamp when key becomes valid
        uint256 validUntil;      // Unix timestamp when key expires
        bool isActive;           // Whether the session key is active
    }

    mapping(bytes32 => SessionKeyData) public sessionKeys;
    mapping(address => bytes32[]) public userSessionKeys;

    event SessionKeyGranted(
        bytes32 indexed keyId,
        address indexed owner,
        address indexed sessionKey,
        address target,
        bytes4 functionSelector,
        uint256 validUntil
    );

    event SessionKeyRevoked(
        bytes32 indexed keyId,
        address indexed owner,
        address indexed sessionKey
    );

    event SessionKeyUsed(
        bytes32 indexed keyId,
        address indexed sessionKey,
        address target,
        bytes4 functionSelector,
        uint256 value
    );

    error SessionKeyNotFound();
    error SessionKeyNotActive();
    error SessionKeyExpired();
    error SessionKeyNotYetValid();
    error ExceededTransactionLimit();
    error ExceededValueLimit();
    error UnauthorizedTarget();
    error UnauthorizedFunction();

    constructor() Ownable(msg.sender) {}

    /// @notice Grant a session key with specific permissions
    /// @param sessionKey The session key address
    /// @param target The target contract address
    /// @param functionSelector The allowed function selector
    /// @param valueLimit Maximum ETH value per transaction
    /// @param maxTransactions Maximum number of transactions
    /// @param validAfter When the session key becomes valid
    /// @param validUntil When the session key expires
    /// @return keyId The unique identifier for this session key
    function grantSessionKey(
        address sessionKey,
        address target,
        bytes4 functionSelector,
        uint256 valueLimit,
        uint256 maxTransactions,
        uint256 validAfter,
        uint256 validUntil
    ) external returns (bytes32 keyId) {
        require(sessionKey != address(0), "Invalid session key");
        require(target != address(0), "Invalid target");
        require(validUntil > validAfter, "Invalid validity period");
        require(validUntil > block.timestamp, "Already expired");

        keyId = keccak256(
            abi.encodePacked(
                msg.sender,
                sessionKey,
                target,
                functionSelector,
                validAfter,
                validUntil
            )
        );

        require(sessionKeys[keyId].sessionKey == address(0), "Session key already exists");

        SessionKeyData memory data = SessionKeyData({
            sessionKey: sessionKey,
            target: target,
            functionSelector: functionSelector,
            valueLimit: valueLimit,
            maxTransactions: maxTransactions,
            transactionCount: 0,
            validAfter: validAfter,
            validUntil: validUntil,
            isActive: true
        });

        sessionKeys[keyId] = data;
        userSessionKeys[msg.sender].push(keyId);

        emit SessionKeyGranted(
            keyId,
            msg.sender,
            sessionKey,
            target,
            functionSelector,
            validUntil
        );
    }

    /// @notice Revoke a session key
    /// @param keyId The session key ID to revoke
    function revokeSessionKey(bytes32 keyId) external {
        SessionKeyData storage data = sessionKeys[keyId];
        if (data.sessionKey == address(0)) revert SessionKeyNotFound();
        
        // Only the owner who granted it can revoke it
        require(msg.sender == owner() || isOwnerOfSessionKey(msg.sender, keyId), "Unauthorized");

        data.isActive = false;

        emit SessionKeyRevoked(keyId, msg.sender, data.sessionKey);
    }

    /// @notice Validate and use a session key for a transaction
    /// @param keyId The session key ID
    /// @param target The target contract
    /// @param functionSelector The function being called
    /// @param value The ETH value being sent
    /// @param signature The signature from the session key
    /// @param messageHash The hash of the message being signed
    /// @return success Whether the session key is valid for this transaction
    function validateSessionKey(
        bytes32 keyId,
        address target,
        bytes4 functionSelector,
        uint256 value,
        bytes memory signature,
        bytes32 messageHash
    ) external nonReentrant returns (bool success) {
        SessionKeyData storage data = sessionKeys[keyId];
        
        if (data.sessionKey == address(0)) revert SessionKeyNotFound();
        if (!data.isActive) revert SessionKeyNotActive();
        if (block.timestamp < data.validAfter) revert SessionKeyNotYetValid();
        if (block.timestamp > data.validUntil) revert SessionKeyExpired();
        if (data.transactionCount >= data.maxTransactions) revert ExceededTransactionLimit();
        if (value > data.valueLimit) revert ExceededValueLimit();
        if (target != data.target) revert UnauthorizedTarget();
        if (functionSelector != data.functionSelector) revert UnauthorizedFunction();

        // Verify signature
        address recoveredSigner = messageHash.toEthSignedMessageHash().recover(signature);
        require(recoveredSigner == data.sessionKey, "Invalid signature");

        // Update transaction count
        data.transactionCount++;

        emit SessionKeyUsed(keyId, data.sessionKey, target, functionSelector, value);

        return true;
    }

    /// @notice Check if an address owns a specific session key
    /// @param user The user address
    /// @param keyId The session key ID
    /// @return owned Whether the user owns this session key
    function isOwnerOfSessionKey(address user, bytes32 keyId) public view returns (bool owned) {
        bytes32[] memory userKeys = userSessionKeys[user];
        for (uint256 i = 0; i < userKeys.length; i++) {
            if (userKeys[i] == keyId) {
                return true;
            }
        }
        return false;
    }

    /// @notice Get session key data
    /// @param keyId The session key ID
    /// @return data The session key data
    function getSessionKey(bytes32 keyId) external view returns (SessionKeyData memory data) {
        return sessionKeys[keyId];
    }

    /// @notice Get all session keys for a user
    /// @param user The user address
    /// @return keyIds Array of session key IDs
    function getUserSessionKeys(address user) external view returns (bytes32[] memory keyIds) {
        return userSessionKeys[user];
    }

    /// @notice Check if a session key is currently valid
    /// @param keyId The session key ID
    /// @return valid Whether the session key is valid
    function isSessionKeyValid(bytes32 keyId) external view returns (bool valid) {
        SessionKeyData memory data = sessionKeys[keyId];
        return data.sessionKey != address(0) &&
               data.isActive &&
               block.timestamp >= data.validAfter &&
               block.timestamp <= data.validUntil &&
               data.transactionCount < data.maxTransactions;
    }
}
