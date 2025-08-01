// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BKCVerify
 * @dev Blockchain-based Identity Verification and Electronic Document Signing System
 */
contract BKCVerify is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Structs
    struct IdentityVerification {
        string userId;
        string identityHash;
        uint256 timestamp;
        bool verified;
        address verifier;
        string certificateHash;
        // Additional identity fields (stored as hash for privacy)
        string fullNameHash;
        string dateOfBirthHash;
        string nationalityHash;
        string documentTypeHash;
        string documentNumberHash;
    }

    struct Document {
        string documentId;
        string documentHash;
        uint256 timestamp;
        address owner;
        bool signed;
        uint256 signatureCount;
        uint256 requiredSignatures;
    }

    struct Signature {
        address signer;
        uint256 timestamp;
        string signatureHash;
        bool valid;
    }

    struct User {
        string userId;
        address walletAddress;
        bool identityVerified;
        uint256 verificationTimestamp;
        string identityHash;
        uint256 documentCount;
        uint256 signatureCount;
    }

    // State variables
    Counters.Counter private _verificationIds;
    Counters.Counter private _documentIds;
    Counters.Counter private _signatureIds;

    mapping(string => IdentityVerification) public identityVerifications;
    mapping(string => Document) public documents;
    mapping(string => Signature[]) public documentSignatures;
    mapping(address => User) public users;
    mapping(address => bool) public authorizedVerifiers;
    mapping(string => bool) public usedIdentityHashes;
    mapping(string => bool) public usedDocumentHashes;

    // Events
    event IdentityVerified(string indexed userId, address indexed walletAddress, string identityHash, uint256 timestamp);
    event DocumentCreated(string indexed documentId, address indexed owner, string documentHash, uint256 timestamp);
    event DocumentSigned(string indexed documentId, address indexed signer, string signatureHash, uint256 timestamp);
    event VerifierAuthorized(address indexed verifier, bool authorized);
    event UserRegistered(string indexed userId, address indexed walletAddress);

    // Modifiers
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }

    modifier onlyDocumentOwner(string memory documentId) {
        require(documents[documentId].owner == msg.sender, "Not document owner");
        _;
    }

    modifier documentExists(string memory documentId) {
        require(documents[documentId].timestamp != 0, "Document does not exist");
        _;
    }

    modifier userExists(address walletAddress) {
        require(bytes(users[walletAddress].userId).length != 0, "User does not exist");
        _;
    }

    constructor() {
        authorizedVerifiers[msg.sender] = true;
    }

    /**
     * @dev Register a new user
     * @param userId User's unique identifier
     * @param walletAddress User's wallet address
     */
    function registerUser(string memory userId, address walletAddress) external {
        require(bytes(users[walletAddress].userId).length == 0, "User already exists");
        require(bytes(userId).length > 0, "Invalid user ID");

        users[walletAddress] = User({
            userId: userId,
            walletAddress: walletAddress,
            identityVerified: false,
            verificationTimestamp: 0,
            identityHash: "",
            documentCount: 0,
            signatureCount: 0
        });

        emit UserRegistered(userId, walletAddress);
    }

    /**
     * @dev Submit identity verification with detailed fields
     * @param userId User's unique identifier
     * @param identityHash Hash of identity verification data
     * @param walletAddress User's wallet address
     * @param fullNameHash Hash of full name
     * @param dateOfBirthHash Hash of date of birth
     * @param nationalityHash Hash of nationality
     * @param documentTypeHash Hash of document type
     * @param documentNumberHash Hash of document number
     */
    function submitIdentityVerification(
        string memory userId,
        string memory identityHash,
        address walletAddress,
        string memory fullNameHash,
        string memory dateOfBirthHash,
        string memory nationalityHash,
        string memory documentTypeHash,
        string memory documentNumberHash
    ) external onlyAuthorizedVerifier {
        require(!usedIdentityHashes[identityHash], "Identity hash already used");
        require(bytes(users[walletAddress].userId).length != 0, "User does not exist");

        usedIdentityHashes[identityHash] = true;

        identityVerifications[userId] = IdentityVerification({
            userId: userId,
            identityHash: identityHash,
            timestamp: block.timestamp,
            verified: true,
            verifier: msg.sender,
            certificateHash: _generateCertificateHash(userId, identityHash),
            fullNameHash: fullNameHash,
            dateOfBirthHash: dateOfBirthHash,
            nationalityHash: nationalityHash,
            documentTypeHash: documentTypeHash,
            documentNumberHash: documentNumberHash
        });

        users[walletAddress].identityVerified = true;
        users[walletAddress].verificationTimestamp = block.timestamp;
        users[walletAddress].identityHash = identityHash;

        emit IdentityVerified(userId, walletAddress, identityHash, block.timestamp);
    }

    /**
     * @dev Create a new document
     * @param documentId Document's unique identifier
     * @param documentHash Hash of document content
     * @param requiredSignatures Number of required signatures
     */
    function createDocument(
        string memory documentId,
        string memory documentHash,
        uint256 requiredSignatures
    ) external {
        require(!usedDocumentHashes[documentHash], "Document hash already used");
        require(requiredSignatures > 0, "Required signatures must be greater than 0");

        usedDocumentHashes[documentHash] = true;

        documents[documentId] = Document({
            documentId: documentId,
            documentHash: documentHash,
            timestamp: block.timestamp,
            owner: msg.sender,
            signed: false,
            signatureCount: 0,
            requiredSignatures: requiredSignatures
        });

        users[msg.sender].documentCount++;

        emit DocumentCreated(documentId, msg.sender, documentHash, block.timestamp);
    }

    /**
     * @dev Sign a document
     * @param documentId Document's unique identifier
     * @param signatureHash Hash of the signature
     */
    function signDocument(
        string memory documentId,
        string memory signatureHash
    ) external documentExists(documentId) {
        require(users[msg.sender].identityVerified, "Identity not verified");
        require(!documents[documentId].signed, "Document already fully signed");

        // Check if user already signed this document
        Signature[] storage signatures = documentSignatures[documentId];
        for (uint i = 0; i < signatures.length; i++) {
            require(signatures[i].signer != msg.sender, "Already signed this document");
        }

        Signature memory newSignature = Signature({
            signer: msg.sender,
            timestamp: block.timestamp,
            signatureHash: signatureHash,
            valid: true
        });

        documentSignatures[documentId].push(newSignature);
        documents[documentId].signatureCount++;
        users[msg.sender].signatureCount++;

        // Check if document is fully signed
        if (documents[documentId].signatureCount >= documents[documentId].requiredSignatures) {
            documents[documentId].signed = true;
        }

        emit DocumentSigned(documentId, msg.sender, signatureHash, block.timestamp);
    }

    /**
     * @dev Authorize or revoke a verifier
     * @param verifier Address of the verifier
     * @param authorized Whether to authorize or revoke
     */
    function setVerifierAuthorization(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }

    /**
     * @dev Get identity verification status
     * @param userId User's unique identifier
     * @return verification Identity verification data
     */
    function getIdentityVerification(string memory userId) external view returns (IdentityVerification memory verification) {
        return identityVerifications[userId];
    }

    /**
     * @dev Get document information
     * @param documentId Document's unique identifier
     * @return document Document data
     */
    function getDocument(string memory documentId) external view returns (Document memory document) {
        return documents[documentId];
    }

    /**
     * @dev Get document signatures
     * @param documentId Document's unique identifier
     * @return signatures Array of signatures
     */
    function getDocumentSignatures(string memory documentId) external view returns (Signature[] memory signatures) {
        return documentSignatures[documentId];
    }

    /**
     * @dev Get user information
     * @param walletAddress User's wallet address
     * @return user User data
     */
    function getUser(address walletAddress) external view returns (User memory user) {
        return users[walletAddress];
    }

    /**
     * @dev Check if address is an authorized verifier
     * @param verifier Address to check
     * @return bool True if authorized
     */
    function isAuthorizedVerifier(address verifier) external view returns (bool) {
        return authorizedVerifiers[verifier] || verifier == owner();
    }

    /**
     * @dev Generate certificate hash
     * @param userId User's unique identifier
     * @param identityHash Hash of identity verification data
     * @return string Certificate hash
     */
    function _generateCertificateHash(string memory userId, string memory identityHash) internal pure returns (string memory) {
        return string(abi.encodePacked(userId, "_", identityHash, "_certificate"));
    }

    /**
     * @dev Get contract statistics
     * @return totalUsers Total number of users
     * @return totalDocuments Total number of documents
     * @return totalSignatures Total number of signatures
     */
    function getContractStats() external view returns (uint256 totalUsers, uint256 totalDocuments, uint256 totalSignatures) {
        // This would require additional state tracking for accurate counts
        // For now, return placeholder values
        return (0, 0, 0);
    }
} 