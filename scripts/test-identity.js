const { ethers } = require("hardhat");

async function main() {
  console.log("Testing BKCVerify identity verification...");

  // Get the deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not found in environment variables");
    process.exit(1);
  }

  const BKCVerify = await ethers.getContractFactory("BKCVerify");
  const bkcVerify = BKCVerify.attach(contractAddress);

  // Get signers
  const [deployer, user] = await ethers.getSigners();
  
  console.log("Deployer address:", deployer.address);
  console.log("User address:", user.address);

  try {
    // Test 1: Register a user
    console.log("\n1. Registering user...");
    const userId = "user123";
    await bkcVerify.registerUser(userId, user.address);
    console.log("User registered successfully");

    // Test 2: Check if deployer is authorized verifier
    console.log("\n2. Checking verifier authorization...");
    const isAuthorized = await bkcVerify.isAuthorizedVerifier(deployer.address);
    console.log("Deployer is authorized:", isAuthorized);

    // Test 3: Submit identity verification
    console.log("\n3. Submitting identity verification...");
    
    // Create test identity data
    const identityData = {
      fullName: "John Doe",
      dateOfBirth: "1990-01-01",
      nationality: "US",
      documentType: "passport",
      documentNumber: "123456789"
    };

    // Create hashes for privacy
    const identityHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(identityData)));
    const fullNameHash = ethers.keccak256(ethers.toUtf8Bytes(identityData.fullName));
    const dateOfBirthHash = ethers.keccak256(ethers.toUtf8Bytes(identityData.dateOfBirth));
    const nationalityHash = ethers.keccak256(ethers.toUtf8Bytes(identityData.nationality));
    const documentTypeHash = ethers.keccak256(ethers.toUtf8Bytes(identityData.documentType));
    const documentNumberHash = ethers.keccak256(ethers.toUtf8Bytes(identityData.documentNumber));

    await bkcVerify.submitIdentityVerification(
      userId,
      identityHash,
      user.address,
      fullNameHash,
      dateOfBirthHash,
      nationalityHash,
      documentTypeHash,
      documentNumberHash
    );
    console.log("Identity verification submitted successfully");

    // Test 4: Get verification status
    console.log("\n4. Getting verification status...");
    const verification = await bkcVerify.getIdentityVerification(userId);
    console.log("Verification verified:", verification.verified);
    console.log("Verification timestamp:", verification.timestamp);
    console.log("Verifier:", verification.verifier);

    // Test 5: Get user information
    console.log("\n5. Getting user information...");
    const userInfo = await bkcVerify.getUser(user.address);
    console.log("User ID:", userInfo.userId);
    console.log("Identity verified:", userInfo.identityVerified);
    console.log("Verification timestamp:", userInfo.verificationTimestamp);

    console.log("\nAll tests passed successfully!");

  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  }); 