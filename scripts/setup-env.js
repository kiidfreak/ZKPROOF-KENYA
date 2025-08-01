const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('Setting up BKCVerify environment...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (fs.existsSync(envPath)) {
  console.log('.env file already exists');
} else {
  console.log('Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('.env file created from template');
  } else {
    // Create basic .env file
    const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/bkcverify

# JWT
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}

# Ethereum
ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHEREUM_NETWORK=sepolia
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_deployed_contract_address

# File Upload
MAX_FILE_SIZE=10485760

# Server
PORT=5000
NODE_ENV=development
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('.env file created with default values');
  }
}

console.log('\nNext steps:');
console.log('1. Update your .env file with your specific values');
console.log('2. Deploy the smart contract: npx hardhat run scripts/deploy.js --network sepolia');
console.log('3. Update CONTRACT_ADDRESS in your .env file');
console.log('4. Start the application: npm run dev');
console.log('\nFor more information, see the README.md file'); 