const { ethers } = require("hardhat");

async function checkBalance() {
  try {
    console.log('🔍 Checking wallet balance on Sepolia...');
    
    // Connect to Sepolia network explicitly
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const address = await wallet.getAddress();
    const balance = await provider.getBalance(address);
    
    console.log(`📍 Wallet Address: ${address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther("0.01")) {
      console.log('\n⚠️  Insufficient balance for deployment!');
      console.log('🔗 Get free test ETH from: https://sepoliafaucet.com/');
      console.log(`📝 Enter this address: ${address}`);
    } else {
      console.log('\n✅ Sufficient balance for deployment!');
    }
    
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
}

checkBalance().then(() => process.exit(0));
