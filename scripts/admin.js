const { ethers } = require("hardhat");

async function main() {
  console.log("BKCVerify Contract Administration");

  const [admin, user1, user2, verifier] = await ethers.getSigners();
  
  // Get the deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not found in environment variables");
    return;
  }

  const BKCVerify = await ethers.getContractFactory("BKCVerify");
  const bkcVerify = BKCVerify.attach(contractAddress);

  console.log("Admin:", admin.address);
  console.log("Contract Address:", contractAddress);

  const command = process.argv[2];

  switch (command) {
    case "stats":
      await showContractStats(bkcVerify);
      break;
    
    case "users":
      await listUsers(bkcVerify, [user1, user2]);
      break;
    
    case "documents":
      await listDocuments(bkcVerify);
      break;
    
    case "authorize":
      const verifierAddress = process.argv[3];
      if (!verifierAddress) {
        console.error("Please provide verifier address");
        return;
      }
      await authorizeVerifier(bkcVerify, verifierAddress);
      break;
    
    case "revoke":
      const revokeAddress = process.argv[3];
      if (!revokeAddress) {
        console.error("Please provide verifier address");
        return;
      }
      await revokeVerifier(bkcVerify, revokeAddress);
      break;
    
    case "verify":
      const userId = process.argv[3];
      const identityHash = process.argv[4];
      const walletAddress = process.argv[5];
      
      if (!userId || !identityHash || !walletAddress) {
        console.error("Please provide userId, identityHash, and walletAddress");
        return;
      }
      await verifyIdentity(bkcVerify, userId, identityHash, walletAddress);
      break;
    
    default:
      console.log("Available commands:");
      console.log("  npm run admin stats                    - Show contract statistics");
      console.log("  npm run admin users                    - List registered users");
      console.log("  npm run admin documents                - List documents");
      console.log("  npm run admin authorize <address>      - Authorize verifier");
      console.log("  npm run admin revoke <address>         - Revoke verifier");
      console.log("  npm run admin verify <userId> <hash> <address> - Verify identity");
      break;
  }
}

async function showContractStats(contract) {
  console.log("\nContract Statistics");
  console.log("======================");
  
  try {
    const stats = await contract.getContractStats();
    console.log("Total Users:", stats[0].toString());
    console.log("Total Documents:", stats[1].toString());
    console.log("Total Signatures:", stats[2].toString());
  } catch (error) {
    console.log("Stats not available (placeholder implementation)");
  }
}

async function listUsers(contract, users) {
  console.log("\nRegistered Users");
  console.log("==================");
  
  for (let i = 0; i < users.length; i++) {
    try {
      const user = await contract.getUser(users[i].address);
      if (user.timestamp !== 0) {
        console.log(`User ${i + 1}:`);
        console.log(`  Address: ${user.walletAddress}`);
        console.log(`  User ID: ${user.userId}`);
        console.log(`  Identity Verified: ${user.identityVerified}`);
        console.log(`  Document Count: ${user.documentCount.toString()}`);
        console.log(`  Signature Count: ${user.signatureCount.toString()}`);
        console.log("");
      }
    } catch (error) {
      console.log(`User ${i + 1}: Not registered`);
    }
  }
}

async function listDocuments(contract) {
  console.log("\nDocuments");
  console.log("============");
  
  // This would require additional state tracking for listing all documents
  // For now, we'll show a placeholder
  console.log("Document listing feature requires additional contract implementation");
}

async function authorizeVerifier(contract, verifierAddress) {
  console.log(`\nAuthorizing verifier: ${verifierAddress}`);
  
  try {
    const tx = await contract.setVerifierAuthorization(verifierAddress, true);
    await tx.wait();
    console.log("Verifier authorized successfully");
  } catch (error) {
    console.error("Failed to authorize verifier:", error.message);
  }
}

async function revokeVerifier(contract, verifierAddress) {
  console.log(`\nRevoking verifier: ${verifierAddress}`);
  
  try {
    const tx = await contract.setVerifierAuthorization(verifierAddress, false);
    await tx.wait();
    console.log("Verifier revoked successfully");
  } catch (error) {
    console.error("Failed to revoke verifier:", error.message);
  }
}

async function verifyIdentity(contract, userId, identityHash, walletAddress) {
  console.log(`\nVerifying identity for user: ${userId}`);
  console.log(`Wallet Address: ${walletAddress}`);
  console.log(`Identity Hash: ${identityHash}`);
  
  try {
    const tx = await contract.submitIdentityVerification(userId, identityHash, walletAddress);
    await tx.wait();
    console.log("Identity verification submitted successfully");
  } catch (error) {
    console.error("Failed to verify identity:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Admin script failed:", error);
    process.exit(1);
  }); 