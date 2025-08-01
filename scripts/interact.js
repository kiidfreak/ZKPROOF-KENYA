const { ethers } = require("hardhat");

async function main() {
  console.log("BKCVerify Contract Interaction Script");

  // Get the deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not found in environment variables");
    return;
  }

  const BKCVerify = await ethers.getContractFactory("BKCVerify");
  const bkcVerify = BKCVerify.attach(contractAddress);

  const [owner, user1, user2, verifier] = await ethers.getSigners();

  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("Verifier:", verifier.address);

  try {
    // 1. Register users
    console.log("\nRegistering users...");
    await bkcVerify.connect(user1).registerUser("user1", user1.address);
    await bkcVerify.connect(user2).registerUser("user2", user2.address);
    console.log("Users registered");

    // 2. Authorize verifier
    console.log("\nAuthorizing verifier...");
    await bkcVerify.connect(owner).setVerifierAuthorization(verifier.address, true);
    console.log("Verifier authorized");

    // 3. Submit identity verification
    console.log("\nSubmitting identity verification...");
    const identityHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user1_identity_data"));
    const identityHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user2_identity_data"));
    
    await bkcVerify.connect(verifier).submitIdentityVerification("user1", identityHash1, user1.address);
    await bkcVerify.connect(verifier).submitIdentityVerification("user2", identityHash2, user2.address);
    console.log("Identity verifications submitted");

    // 4. Create documents
    console.log("\nCreating documents...");
    const documentHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document1_content"));
    const documentHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document2_content"));
    
    await bkcVerify.connect(user1).createDocument("doc1", documentHash1, 2);
    await bkcVerify.connect(user2).createDocument("doc2", documentHash2, 1);
    console.log("Documents created");

    // 5. Sign documents
    console.log("\nSigning documents...");
    const signatureHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user1_signature_doc1"));
    const signatureHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user2_signature_doc1"));
    const signatureHash3 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user1_signature_doc2"));
    
    await bkcVerify.connect(user1).signDocument("doc1", signatureHash1);
    await bkcVerify.connect(user2).signDocument("doc1", signatureHash2);
    await bkcVerify.connect(user1).signDocument("doc2", signatureHash3);
    console.log("Documents signed");

    // 6. Query contract state
    console.log("\nQuerying contract state...");
    
    const user1Info = await bkcVerify.getUser(user1.address);
    const user2Info = await bkcVerify.getUser(user2.address);
    const doc1Info = await bkcVerify.getDocument("doc1");
    const doc2Info = await bkcVerify.getDocument("doc2");
    const doc1Signatures = await bkcVerify.getDocumentSignatures("doc1");
    const doc2Signatures = await bkcVerify.getDocumentSignatures("doc2");

    console.log("User1 Info:", {
      userId: user1Info.userId,
      identityVerified: user1Info.identityVerified,
      documentCount: user1Info.documentCount.toString(),
      signatureCount: user1Info.signatureCount.toString()
    });

    console.log("User2 Info:", {
      userId: user2Info.userId,
      identityVerified: user2Info.identityVerified,
      documentCount: user2Info.documentCount.toString(),
      signatureCount: user2Info.signatureCount.toString()
    });

    console.log("Document1 Info:", {
      signed: doc1Info.signed,
      signatureCount: doc1Info.signatureCount.toString(),
      requiredSignatures: doc1Info.requiredSignatures.toString()
    });

    console.log("Document2 Info:", {
      signed: doc2Info.signed,
      signatureCount: doc2Info.signatureCount.toString(),
      requiredSignatures: doc2Info.requiredSignatures.toString()
    });

    console.log("Document1 Signatures:", doc1Signatures.length);
    console.log("Document2 Signatures:", doc2Signatures.length);

    console.log("\nContract interaction completed successfully!");

  } catch (error) {
    console.error("Contract interaction failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 