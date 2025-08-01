const { Web3 } = require('web3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.isConnectedFlag = false;
    this.contract = null;
    this.account = null;
    this.contractAddress = null;
    this.contractABI = null;
  }

  async initialize() {
    try {
      // Initialize Web3 with correct provider syntax for newer versions
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
      
      // Use the correct provider initialization for Web3.js v4
      this.web3 = new Web3(rpcUrl);
      
      // Check connection
      const isListening = await this.web3.eth.net.isListening();
      if (!isListening) {
        throw new Error('Cannot connect to Ethereum network');
      }

      this.isConnectedFlag = true;
      console.log('Connected to Ethereum network');
      
      // Get network info
      const networkId = await this.web3.eth.net.getId();
      let networkType = 'unknown';
      switch (networkId) {
        case 1n:
          networkType = 'mainnet';
          break;
        case 3n:
          networkType = 'ropsten';
          break;
        case 4n:
          networkType = 'rinkeby';
          break;
        case 5n:
          networkType = 'goerli';
          break;
        case 42n:
          networkType = 'kovan';
          break;
        case 11155111n:
          networkType = 'sepolia';
          break;
        default:
          networkType = `unknown (${networkId})`;
      }
      console.log(`Network: ${networkType} (ID: ${networkId})`);

      // Initialize contract
      await this.initializeContract();
      
    } catch (error) {
      console.error('Blockchain initialization failed:', error);
      this.isConnectedFlag = false;
    }
  }

  async initializeContract() {
    try {
      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
        this.contractAddress = contractAddress;
        // Load ABI from artifacts
        const abiPath = path.join(__dirname, '../../artifacts/contracts/BKCVerify.sol/BKCVerify.json');
        const abiJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        this.contractABI = abiJson.abi;
        this.contract = new this.web3.eth.Contract(this.contractABI, contractAddress);
        // Set up account for signing
        const privateKey = process.env.PRIVATE_KEY;
        if (privateKey) {
          this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
          this.web3.eth.accounts.wallet.add(this.account);
          this.web3.eth.defaultAccount = this.account.address;
        } else {
          console.log('No PRIVATE_KEY configured, contract will be read-only.');
        }
        console.log('Smart contract loaded:', contractAddress);
      } else {
        console.log('No contract address configured, using local storage simulation');
      }
    } catch (error) {
      console.error('Contract initialization failed:', error);
    }
  }

  isConnected() {
    return this.isConnectedFlag;
  }

  // Generate digital signature
  async createDigitalSignature(data, privateKey) {
    try {
      const messageHash = this.web3.utils.sha3(data);
      const signature = await this.web3.eth.accounts.sign(messageHash, privateKey);
      
      return {
        signature: signature.signature,
        messageHash: signature.messageHash,
        r: signature.r,
        s: signature.s,
        v: signature.v
      };
    } catch (error) {
      throw new Error(`Signature creation failed: ${error.message}`);
    }
  }

  // Verify digital signature
  async verifyDigitalSignature(data, signature, expectedAddress) {
    try {
      const messageHash = this.web3.utils.sha3(data);
      const recoveredAddress = this.web3.eth.accounts.recover(messageHash, signature);
      
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }

  // Store identity verification on blockchain
  async storeIdentityVerification(userId, identityData, signature) {
    try {
      if (!this.contract || !this.account) {
        // Simulate blockchain storage for development
        const verificationHash = crypto.createHash('sha256')
          .update(JSON.stringify({ userId, identityData, timestamp: Date.now() }))
          .digest('hex');
        return {
          transactionHash: `simulated_${verificationHash}`,
          blockNumber: Math.floor(Math.random() * 1000000),
          verificationHash
        };
      }
      
      // Prepare transaction data with detailed identity fields
      const identityHash = this.web3.utils.sha3(JSON.stringify(identityData));
      
      // Create hashes for individual identity fields for privacy
      const fullNameHash = this.web3.utils.sha3(identityData.fullName || '');
      const dateOfBirthHash = this.web3.utils.sha3(identityData.dateOfBirth || '');
      const nationalityHash = this.web3.utils.sha3(identityData.nationality || '');
      const documentTypeHash = this.web3.utils.sha3(identityData.documentType || '');
      const documentNumberHash = this.web3.utils.sha3(identityData.documentNumber || '');
      
      const tx = this.contract.methods.submitIdentityVerification(
        userId, 
        identityHash, 
        this.account.address,
        fullNameHash,
        dateOfBirthHash,
        nationalityHash,
        documentTypeHash,
        documentNumberHash
      );
      
      const gas = await tx.estimateGas({ from: this.account.address });
      const txData = tx.encodeABI();
      const txObj = {
        from: this.account.address,
        to: this.contractAddress,
        data: txData,
        gas
      };
      const receipt = await this.web3.eth.sendTransaction(txObj);
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        verificationHash: identityHash
      };
    } catch (error) {
      throw new Error(`Identity storage failed: ${error.message}`);
    }
  }

  // Store document signature on blockchain
  async storeDocumentSignature(documentId, signature, signerAddress) {
    try {
      if (!this.contract || !this.account) {
        // Simulate blockchain storage for development
        const signatureHash = crypto.createHash('sha256')
          .update(JSON.stringify({ documentId, signature, signerAddress, timestamp: Date.now() }))
          .digest('hex');
        return {
          transactionHash: `simulated_${signatureHash}`,
          blockNumber: Math.floor(Math.random() * 1000000),
          signatureHash
        };
      }
      // Prepare transaction data
      const signatureHash = this.web3.utils.sha3(signature);
      const tx = this.contract.methods.signDocument(documentId, signatureHash);
      const gas = await tx.estimateGas({ from: this.account.address });
      const txData = tx.encodeABI();
      const txObj = {
        from: this.account.address,
        to: this.contractAddress,
        data: txData,
        gas
      };
      const receipt = await this.web3.eth.sendTransaction(txObj);
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        signatureHash
      };
    } catch (error) {
      throw new Error(`Document signature storage failed: ${error.message}`);
    }
  }

  // Get verification status from blockchain
  async getVerificationStatus(userId) {
    try {
      if (!this.contract) {
        // Simulate blockchain query for development
        return {
          verified: true,
          verificationDate: new Date().toISOString(),
          blockNumber: Math.floor(Math.random() * 1000000)
        };
      }
      // Call contract method
      const result = await this.contract.methods.getIdentityVerification(userId).call();
      return {
        verified: result.verified,
        verificationDate: new Date(Number(result.timestamp) * 1000).toISOString(),
        blockNumber: result.blockNumber
      };
    } catch (error) {
      throw new Error(`Verification status query failed: ${error.message}`);
    }
  }

  // Generate wallet address
  generateWalletAddress() {
    const account = this.web3.eth.accounts.create();
    return {
      address: account.address,
      privateKey: account.privateKey
    };
  }

  // Get account balance
  async getAccountBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      throw new Error(`Balance query failed: ${error.message}`);
    }
  }

  // Get contract address
  getContractAddress() {
    return this.contractAddress;
  }

  // Get network information
  async getNetworkInfo() {
    try {
      const networkId = await this.web3.eth.net.getId();
      let networkType = 'unknown';
      switch (networkId) {
        case 1:
          networkType = 'mainnet';
          break;
        case 3:
          networkType = 'ropsten';
          break;
        case 4:
          networkType = 'rinkeby';
          break;
        case 5:
          networkType = 'goerli';
          break;
        case 42:
          networkType = 'kovan';
          break;
        case 11155111:
          networkType = 'sepolia';
          break;
        default:
          networkType = `unknown (${networkId})`;
      }
      const latestBlock = await this.web3.eth.getBlockNumber();
      
      return {
        networkId,
        networkType,
        latestBlock,
        isConnected: this.isConnectedFlag
      };
    } catch (error) {
      throw new Error(`Network info query failed: ${error.message}`);
    }
  }
}

module.exports = new BlockchainService(); 