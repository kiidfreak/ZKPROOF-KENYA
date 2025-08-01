const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BKCVerify", function () {
  let bkcVerify;
  let owner, user1, user2, verifier, unauthorizedUser;

  beforeEach(async function () {
    [owner, user1, user2, verifier, unauthorizedUser] = await ethers.getSigners();
    
    const BKCVerify = await ethers.getContractFactory("BKCVerify");
    bkcVerify = await BKCVerify.deploy();
    await bkcVerify.deployed();
  });

  describe("User Registration", function () {
    it("Should register a new user", async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      
      const user = await bkcVerify.getUser(user1.address);
      expect(user.userId).to.equal("user1");
      expect(user.walletAddress).to.equal(user1.address);
      expect(user.identityVerified).to.be.false;
    });

    it("Should not allow duplicate user registration", async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      
      await expect(
        bkcVerify.connect(user1).registerUser("user1", user1.address)
      ).to.be.revertedWith("User already exists");
    });

    it("Should not allow empty user ID", async function () {
      await expect(
        bkcVerify.connect(user1).registerUser("", user1.address)
      ).to.be.revertedWith("Invalid user ID");
    });
  });

  describe("Verifier Authorization", function () {
    it("Should allow owner to authorize verifier", async function () {
      await bkcVerify.connect(owner).setVerifierAuthorization(verifier.address, true);
      
      const isAuthorized = await bkcVerify.isAuthorizedVerifier(verifier.address);
      expect(isAuthorized).to.be.true;
    });

    it("Should not allow non-owner to authorize verifier", async function () {
      await expect(
        bkcVerify.connect(user1).setVerifierAuthorization(verifier.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Identity Verification", function () {
    beforeEach(async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      await bkcVerify.connect(owner).setVerifierAuthorization(verifier.address, true);
    });

    it("Should allow authorized verifier to submit identity verification", async function () {
      const identityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("identity_data"));
      
      await bkcVerify.connect(verifier).submitIdentityVerification("user1", identityHash, user1.address);
      
      const user = await bkcVerify.getUser(user1.address);
      expect(user.identityVerified).to.be.true;
      
      const verification = await bkcVerify.getIdentityVerification("user1");
      expect(verification.verified).to.be.true;
      expect(verification.verifier).to.equal(verifier.address);
    });

    it("Should not allow unauthorized verifier to submit identity verification", async function () {
      const identityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("identity_data"));
      
      await expect(
        bkcVerify.connect(unauthorizedUser).submitIdentityVerification("user1", identityHash, user1.address)
      ).to.be.revertedWith("Not authorized verifier");
    });

    it("Should not allow duplicate identity hash", async function () {
      const identityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("identity_data"));
      
      await bkcVerify.connect(verifier).submitIdentityVerification("user1", identityHash, user1.address);
      
      await expect(
        bkcVerify.connect(verifier).submitIdentityVerification("user2", identityHash, user2.address)
      ).to.be.revertedWith("Identity hash already used");
    });
  });

  describe("Document Management", function () {
    beforeEach(async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      await bkcVerify.connect(user2).registerUser("user2", user2.address);
    });

    it("Should create a new document", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      
      await bkcVerify.connect(user1).createDocument("doc1", documentHash, 2);
      
      const document = await bkcVerify.getDocument("doc1");
      expect(document.documentId).to.equal("doc1");
      expect(document.owner).to.equal(user1.address);
      expect(document.requiredSignatures).to.equal(2);
    });

    it("Should not allow duplicate document hash", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      
      await bkcVerify.connect(user1).createDocument("doc1", documentHash, 2);
      
      await expect(
        bkcVerify.connect(user2).createDocument("doc2", documentHash, 1)
      ).to.be.revertedWith("Document hash already used");
    });

    it("Should not allow zero required signatures", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      
      await expect(
        bkcVerify.connect(user1).createDocument("doc1", documentHash, 0)
      ).to.be.revertedWith("Required signatures must be greater than 0");
    });
  });

  describe("Document Signing", function () {
    beforeEach(async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      await bkcVerify.connect(user2).registerUser("user2", user2.address);
      await bkcVerify.connect(owner).setVerifierAuthorization(verifier.address, true);
      
      // Verify identities
      const identityHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user1_identity"));
      const identityHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user2_identity"));
      await bkcVerify.connect(verifier).submitIdentityVerification("user1", identityHash1, user1.address);
      await bkcVerify.connect(verifier).submitIdentityVerification("user2", identityHash2, user2.address);
      
      // Create document
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      await bkcVerify.connect(user1).createDocument("doc1", documentHash, 2);
    });

    it("Should allow verified user to sign document", async function () {
      const signatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature"));
      
      await bkcVerify.connect(user1).signDocument("doc1", signatureHash);
      
      const document = await bkcVerify.getDocument("doc1");
      expect(document.signatureCount).to.equal(1);
    });

    it("Should not allow unverified user to sign document", async function () {
      await bkcVerify.connect(user2).registerUser("user3", unauthorizedUser.address);
      
      const signatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature"));
      
      await expect(
        bkcVerify.connect(unauthorizedUser).signDocument("doc1", signatureHash)
      ).to.be.revertedWith("Identity not verified");
    });

    it("Should not allow user to sign same document twice", async function () {
      const signatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature"));
      
      await bkcVerify.connect(user1).signDocument("doc1", signatureHash);
      
      await expect(
        bkcVerify.connect(user1).signDocument("doc1", signatureHash)
      ).to.be.revertedWith("Already signed this document");
    });

    it("Should mark document as signed when required signatures are met", async function () {
      const signatureHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature1"));
      const signatureHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature2"));
      
      await bkcVerify.connect(user1).signDocument("doc1", signatureHash1);
      await bkcVerify.connect(user2).signDocument("doc1", signatureHash2);
      
      const document = await bkcVerify.getDocument("doc1");
      expect(document.signed).to.be.true;
      expect(document.signatureCount).to.equal(2);
    });

    it("Should not allow signing of fully signed document", async function () {
      const signatureHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature1"));
      const signatureHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature2"));
      const signatureHash3 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature3"));
      
      await bkcVerify.connect(user1).signDocument("doc1", signatureHash1);
      await bkcVerify.connect(user2).signDocument("doc1", signatureHash2);
      
      await expect(
        bkcVerify.connect(unauthorizedUser).signDocument("doc1", signatureHash3)
      ).to.be.revertedWith("Document already fully signed");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      await bkcVerify.connect(owner).setVerifierAuthorization(verifier.address, true);
    });

    it("Should return correct user information", async function () {
      const user = await bkcVerify.getUser(user1.address);
      expect(user.userId).to.equal("user1");
      expect(user.walletAddress).to.equal(user1.address);
    });

    it("Should return correct document information", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      await bkcVerify.connect(user1).createDocument("doc1", documentHash, 2);
      
      const document = await bkcVerify.getDocument("doc1");
      expect(document.documentId).to.equal("doc1");
      expect(document.owner).to.equal(user1.address);
    });

    it("Should return correct document signatures", async function () {
      // Verify identity
      const identityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("identity_data"));
      await bkcVerify.connect(verifier).submitIdentityVerification("user1", identityHash, user1.address);
      
      // Create and sign document
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      await bkcVerify.connect(user1).createDocument("doc1", documentHash, 2);
      
      const signatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature"));
      await bkcVerify.connect(user1).signDocument("doc1", signatureHash);
      
      const signatures = await bkcVerify.getDocumentSignatures("doc1");
      expect(signatures.length).to.equal(1);
      expect(signatures[0].signer).to.equal(user1.address);
    });
  });

  describe("Events", function () {
    it("Should emit UserRegistered event", async function () {
      await expect(bkcVerify.connect(user1).registerUser("user1", user1.address))
        .to.emit(bkcVerify, "UserRegistered")
        .withArgs("user1", user1.address);
    });

    it("Should emit IdentityVerified event", async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      await bkcVerify.connect(owner).setVerifierAuthorization(verifier.address, true);
      
      const identityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("identity_data"));
      
      await expect(bkcVerify.connect(verifier).submitIdentityVerification("user1", identityHash, user1.address))
        .to.emit(bkcVerify, "IdentityVerified")
        .withArgs("user1", user1.address, identityHash, await ethers.provider.getBlockNumber());
    });

    it("Should emit DocumentCreated event", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      
      await expect(bkcVerify.connect(user1).createDocument("doc1", documentHash, 2))
        .to.emit(bkcVerify, "DocumentCreated")
        .withArgs("doc1", user1.address, documentHash, await ethers.provider.getBlockNumber());
    });

    it("Should emit DocumentSigned event", async function () {
      await bkcVerify.connect(user1).registerUser("user1", user1.address);
      await bkcVerify.connect(owner).setVerifierAuthorization(verifier.address, true);
      
      // Verify identity
      const identityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("identity_data"));
      await bkcVerify.connect(verifier).submitIdentityVerification("user1", identityHash, user1.address);
      
      // Create and sign document
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document_content"));
      await bkcVerify.connect(user1).createDocument("doc1", documentHash, 2);
      
      const signatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("signature"));
      
      await expect(bkcVerify.connect(user1).signDocument("doc1", signatureHash))
        .to.emit(bkcVerify, "DocumentSigned")
        .withArgs("doc1", user1.address, signatureHash, await ethers.provider.getBlockNumber());
    });
  });
}); 