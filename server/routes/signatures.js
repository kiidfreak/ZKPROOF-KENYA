const express = require('express');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const User = require('../models/User');
const { authenticate, requireIdentityVerification } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');
const crypto = require('crypto');
const fs = require('fs');

const router = express.Router();

// Validation rules
const signatureValidation = [
  body('documentId').isMongoId().withMessage('Valid document ID is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('signatureHash').notEmpty().withMessage('Signature hash is required')
];

// Sign a document
router.post('/sign', authenticate, requireIdentityVerification, signatureValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { documentId, signature, signatureHash } = req.body;

    // Find document
    const document = await Document.findById(documentId)
      .populate('owner', 'firstName lastName email')
      .populate('requiredSigners', 'firstName lastName email')
      .populate('optionalSigners', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user is authorized to sign
    const isRequiredSigner = document.requiredSigners.some(signer => signer._id.toString() === req.user._id.toString());
    const isOptionalSigner = document.optionalSigners.some(signer => signer._id.toString() === req.user._id.toString());
    const isOwner = document.owner._id.toString() === req.user._id.toString();

    if (!isRequiredSigner && !isOptionalSigner && !isOwner) {
      return res.status(403).json({ 
        error: 'You are not authorized to sign this document' 
      });
    }

    // Check if document is in a signable state
    if (document.status === 'signed' || document.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Document cannot be signed in its current state' 
      });
    }

    // Check if user has already signed
    const hasAlreadySigned = document.signatures.some(sig => sig.signer.toString() === req.user._id.toString());
    if (hasAlreadySigned) {
      return res.status(400).json({ 
        error: 'You have already signed this document' 
      });
    }

    // Verify signature
    const dataToVerify = JSON.stringify({
      documentId: document._id.toString(),
      documentHash: document.fileHash,
      signerId: req.user._id.toString(),
      timestamp: Date.now()
    });

    const isSignatureValid = await blockchainService.verifyDigitalSignature(
      dataToVerify,
      signature,
      req.user.walletAddress
    );

    if (!isSignatureValid) {
      return res.status(400).json({ 
        error: 'Invalid signature' 
      });
    }

    // Store signature on blockchain
    const blockchainResult = await blockchainService.storeDocumentSignature(
      document._id.toString(),
      signature,
      req.user.walletAddress
    );

    // Add signature to document
    const newSignature = {
      signer: req.user._id,
      signature,
      signatureHash,
      blockchainTransactionHash: blockchainResult.transactionHash,
      signedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    document.signatures.push(newSignature);

    // Update document status if all required signers have signed
    if (document.isFullySigned()) {
      document.status = 'signed';
    } else if (document.status === 'draft') {
      document.status = 'pending';
    }

    await document.save();

    // Populate signature information
    await document.populate('signatures.signer', 'firstName lastName email');

    res.json({
      message: 'Document signed successfully',
      signature: newSignature,
      blockchainTransaction: blockchainResult,
      documentStatus: document.status,
      completionPercentage: document.completionPercentage
    });

  } catch (error) {
    console.error('Document signing error:', error);
    res.status(500).json({ 
      error: 'Document signing failed. Please try again.' 
    });
  }
});

// Verify document signature
router.post('/verify', authenticate, [
  body('documentId').isMongoId().withMessage('Valid document ID is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('signerAddress').notEmpty().withMessage('Signer address is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { documentId, signature, signerAddress } = req.body;

    // Find document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Verify signature
    const dataToVerify = JSON.stringify({
      documentId: document._id.toString(),
      documentHash: document.fileHash,
      signerId: req.user._id.toString(),
      timestamp: Date.now()
    });

    const isSignatureValid = await blockchainService.verifyDigitalSignature(
      dataToVerify,
      signature,
      signerAddress
    );

    res.json({
      isValid: isSignatureValid,
      documentHash: document.fileHash,
      signerAddress
    });

  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({ 
      error: 'Signature verification failed' 
    });
  }
});

// Get document signatures
router.get('/document/:documentId', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId)
      .populate('signatures.signer', 'firstName lastName email walletAddress')
      .populate('requiredSigners', 'firstName lastName email')
      .populate('optionalSigners', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user has access to this document
    const hasAccess = document.owner.toString() === req.user._id.toString() ||
                     document.requiredSigners.some(signer => signer._id.toString() === req.user._id.toString()) ||
                     document.optionalSigners.some(signer => signer._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Get blockchain verification for each signature
    const signaturesWithVerification = await Promise.all(
      document.signatures.map(async (signature) => {
        try {
          const verification = await blockchainService.verifyDigitalSignature(
            JSON.stringify({
              documentId: document._id.toString(),
              documentHash: document.fileHash,
              signerId: signature.signer._id.toString(),
              timestamp: signature.signedAt.getTime()
            }),
            signature.signature,
            signature.signer.walletAddress
          );

          return {
            ...signature.toObject(),
            blockchainVerified: verification
          };
        } catch (error) {
          return {
            ...signature.toObject(),
            blockchainVerified: false
          };
        }
      })
    );

    res.json({
      documentId: document._id,
      documentHash: document.fileHash,
      signatures: signaturesWithVerification,
      requiredSigners: document.requiredSigners,
      optionalSigners: document.optionalSigners,
      completionPercentage: document.completionPercentage,
      isFullySigned: document.isFullySigned()
    });

  } catch (error) {
    console.error('Signature fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch signatures' 
    });
  }
});

// Generate signature data for client
router.post('/generate-signature-data', authenticate, requireIdentityVerification, [
  body('documentId').isMongoId().withMessage('Valid document ID is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { documentId } = req.body;

    // Find document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user is authorized to sign
    const isRequiredSigner = document.requiredSigners.some(signer => signer.toString() === req.user._id.toString());
    const isOptionalSigner = document.optionalSigners.some(signer => signer.toString() === req.user._id.toString());
    const isOwner = document.owner.toString() === req.user._id.toString();

    if (!isRequiredSigner && !isOptionalSigner && !isOwner) {
      return res.status(403).json({ 
        error: 'You are not authorized to sign this document' 
      });
    }

    // Check if user has already signed
    const hasAlreadySigned = document.signatures.some(sig => sig.signer.toString() === req.user._id.toString());
    if (hasAlreadySigned) {
      return res.status(400).json({ 
        error: 'You have already signed this document' 
      });
    }

    // Create data to sign
    const dataToSign = JSON.stringify({
      documentId: document._id.toString(),
      documentHash: document.fileHash,
      signerId: req.user._id.toString(),
      timestamp: Date.now()
    });

    // Generate signature hash
    const signatureHash = crypto.createHash('sha256').update(dataToSign).digest('hex');

    res.json({
      dataToSign,
      signatureHash,
      documentHash: document.fileHash,
      signerAddress: req.user.walletAddress
    });

  } catch (error) {
    console.error('Signature data generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate signature data' 
    });
  }
});

// Get user's pending signatures
router.get('/pending', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Find documents where user is a required or optional signer
    const query = {
      $or: [
        { requiredSigners: req.user._id },
        { optionalSigners: req.user._id }
      ],
      status: { $in: ['draft', 'pending'] }
    };

    const documents = await Document.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('requiredSigners', 'firstName lastName email')
      .populate('optionalSigners', 'firstName lastName email')
      .populate('signatures.signer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out documents user has already signed
    const pendingDocuments = documents.filter(doc => 
      !doc.signatures.some(sig => sig.signer._id.toString() === req.user._id.toString())
    );

    const total = await Document.countDocuments(query);

    res.json({
      documents: pendingDocuments.map(doc => doc.getSummary()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDocuments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Pending signatures fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pending signatures' 
    });
  }
});

// Get signature history for user
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Find documents where user has signed
    const documents = await Document.find({
      'signatures.signer': req.user._id
    })
      .populate('owner', 'firstName lastName email')
      .populate('signatures.signer', 'firstName lastName email')
      .sort({ 'signatures.signedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const userSignatures = documents.map(doc => {
      const userSignature = doc.signatures.find(sig => 
        sig.signer._id.toString() === req.user._id.toString()
      );
      
      return {
        documentId: doc._id,
        documentTitle: doc.title,
        documentOwner: doc.owner,
        signature: userSignature,
        documentStatus: doc.status,
        signedAt: userSignature.signedAt
      };
    });

    const total = await Document.countDocuments({
      'signatures.signer': req.user._id
    });

    res.json({
      signatures: userSignatures,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSignatures: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Signature history fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch signature history' 
    });
  }
});

module.exports = router; 