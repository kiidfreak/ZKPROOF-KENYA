const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireIdentityVerification } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/identity/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `identity-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed.'));
    }
  }
});

// Validation rules
const identityVerificationValidation = [
  body('idType').isIn(['passport', 'national_id', 'drivers_license', 'other']).withMessage('Valid document type is required'),
  body('idNumber').trim().notEmpty().withMessage('Document number is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('nationality').trim().notEmpty().withMessage('Nationality is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required')
];

// Get identity verification status
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('identityVerified verificationData');
    
    if (user.identityVerified) {
      // Get blockchain verification status
      const blockchainStatus = await blockchainService.getVerificationStatus(user._id.toString());
      
      res.json({
        verified: user.identityVerified,
        verificationData: user.verificationData,
        blockchainStatus
      });
    } else {
      res.json({
        verified: false,
        verificationData: null
      });
    }

  } catch (error) {
    console.error('Identity status error:', error);
    res.status(500).json({ 
      error: 'Failed to get identity verification status' 
    });
  }
});

// Submit identity verification
router.post('/verify', authenticate, upload.single('idFile'), identityVerificationValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    // Check if already verified
    const user = await User.findById(req.user._id);
    if (user.identityVerified) {
      return res.status(400).json({ 
        error: 'Identity is already verified' 
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Identity document is required' 
      });
    }

    const { idType, idNumber, dateOfBirth, nationality, fullName } = req.body;

    // Create verification data
    const verificationData = {
      documentType: idType,
      documentNumber: idNumber,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      verificationDate: new Date(),
      documentFile: req.file.filename,
      fullName
    };

    // Create digital signature for verification data
    const dataToSign = JSON.stringify({
      userId: user._id.toString(),
      documentType: idType,
      documentNumber: idNumber,
      dateOfBirth,
      nationality,
      fullName,
      timestamp: Date.now()
    });

    // Generate signature using the system private key (in production, this should be handled securely)
    const signature = await blockchainService.createDigitalSignature(dataToSign, process.env.PRIVATE_KEY);

    // Store verification on blockchain
    const blockchainResult = await blockchainService.storeIdentityVerification(
      user._id.toString(),
      verificationData,
      signature.signature
    );

    // Update user verification data
    user.verificationData = {
      ...verificationData,
      blockchainTransactionHash: blockchainResult.transactionHash,
      verificationHash: blockchainResult.verificationHash
    };
    user.identityVerified = true;

    await user.save();

    res.json({
      message: 'Identity verification submitted successfully',
      verificationData: user.verificationData,
      blockchainTransaction: blockchainResult
    });

  } catch (error) {
    console.error('Identity verification error:', error);
    res.status(500).json({ 
      error: 'Identity verification failed. Please try again.' 
    });
  }
});

// Get verification certificate
router.get('/certificate', authenticate, requireIdentityVerification, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('verificationData firstName lastName email walletAddress');
    
    if (!user.identityVerified) {
      return res.status(400).json({ 
        error: 'Identity not verified' 
      });
    }

    // Get blockchain verification status
    const blockchainStatus = await blockchainService.getVerificationStatus(user._id.toString());

    // Generate certificate data
    const certificate = {
      certificateId: crypto.createHash('sha256')
        .update(`${user._id}-${user.verificationData.verificationDate}`)
        .digest('hex'),
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        walletAddress: user.walletAddress
      },
      verification: {
        documentType: user.verificationData.documentType,
        documentNumber: user.verificationData.documentNumber,
        dateOfBirth: user.verificationData.dateOfBirth,
        nationality: user.verificationData.nationality,
        fullName: user.verificationData.fullName,
        verificationDate: user.verificationData.verificationDate
      },
      blockchain: {
        transactionHash: user.verificationData.blockchainTransactionHash,
        verificationHash: user.verificationData.verificationHash,
        blockNumber: blockchainStatus.blockNumber,
        verified: blockchainStatus.verified
      },
      issuedAt: new Date().toISOString()
    };

    res.json({
      certificate,
      downloadUrl: `/api/identity/certificate/${certificate.certificateId}/download`
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate certificate' 
    });
  }
});

// Download verification certificate (PDF)
router.get('/certificate/:certificateId/download', authenticate, requireIdentityVerification, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const user = await User.findById(req.user._id).select('verificationData firstName lastName email walletAddress');
    
    // Verify certificate ID
    const expectedCertificateId = crypto.createHash('sha256')
      .update(`${user._id}-${user.verificationData.verificationDate}`)
      .digest('hex');

    if (certificateId !== expectedCertificateId) {
      return res.status(404).json({ 
        error: 'Certificate not found' 
      });
    }

    // In a real implementation, you would generate a PDF certificate here
    // For now, we'll return a JSON response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="identity-certificate-${certificateId}.json"`);
    
    const certificate = {
      certificateId,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        walletAddress: user.walletAddress
      },
      verification: user.verificationData,
      issuedAt: new Date().toISOString()
    };

    res.json(certificate);

  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ 
      error: 'Failed to download certificate' 
    });
  }
});

// Verify identity on blockchain
router.post('/verify-on-chain', authenticate, requireIdentityVerification, async (req, res) => {
  try {
    const { userId, verificationHash } = req.body;

    if (!userId || !verificationHash) {
      return res.status(400).json({ 
        error: 'User ID and verification hash are required' 
      });
    }

    // Verify on blockchain
    const verificationStatus = await blockchainService.getVerificationStatus(userId);
    
    // Verify hash matches
    const user = await User.findById(userId);
    if (!user || user.verificationData.verificationHash !== verificationHash) {
      return res.status(400).json({ 
        error: 'Invalid verification hash' 
      });
    }

    res.json({
      verified: verificationStatus.verified,
      verificationDate: verificationStatus.verificationDate,
      blockNumber: verificationStatus.blockNumber,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({ 
      error: 'Blockchain verification failed' 
    });
  }
});

// Get wallet information
router.get('/wallet', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletAddress');
    
    if (!user.walletAddress) {
      return res.status(404).json({ 
        error: 'No wallet address found' 
      });
    }

    // Get balance
    const balance = await blockchainService.getAccountBalance(user.walletAddress);

    res.json({
      address: user.walletAddress,
      balance,
      network: process.env.ETHEREUM_NETWORK || 'sepolia'
    });

  } catch (error) {
    console.error('Wallet info error:', error);
    res.status(500).json({ 
      error: 'Failed to get wallet information' 
    });
  }
});

module.exports = router; 