const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BKCVerify contract...");

  // Get the contract factory
  const BKCVerify = await ethers.getContractFactory("BKCVerify");
  
  // Deploy the contract
  const bkcVerify = await BKCVerify.deploy();
  
  // Wait for deployment to finish
  await bkcVerify.waitForDeployment();
  
  const contractAddress = await bkcVerify.getAddress();
  
  console.log("BKCVerify deployed to:", contractAddress);
  console.log("Contract owner:", await bkcVerify.owner());
  
  // Verify the contract is working by checking if the deployer is an authorized verifier
  const isAuthorized = await bkcVerify.isAuthorizedVerifier(await bkcVerify.owner());
  console.log("Deployer is authorized verifier:", isAuthorized);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployer: await bkcVerify.owner(),
    network: process.env.ETHEREUM_NETWORK || 'sepolia',
    deploymentDate: new Date().toISOString()
  };
  
  console.log("Deployment successful!");
  console.log("Please update your .env file with:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 