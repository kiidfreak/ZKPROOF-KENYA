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

    // Prevent document owners from signing their own documents
    if (isOwner) {
      return res.status(403).json({ 
        error: 'Document owners cannot sign their own documents' 
      });
    }

    if (!isRequiredSigner && !isOptionalSigner) {
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
      signature: signature,
      signatureHash: signatureHash,
      blockchainTransactionHash: blockchainResult.transactionHash,
      signedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    document.signatures.push(newSignature);

    // Check if document is fully signed
    if (document.isFullySigned()) {
      document.status = 'signed';
      document.signedAt = new Date();
    }

    await document.save();

    // Populate the new signature for response
    await document.populate('signatures.signer', 'firstName lastName email');

    res.json({
      message: 'Document signed successfully',
      signature: newSignature,
      blockchainTransaction: {
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber ? blockchainResult.blockNumber.toString() : blockchainResult.blockNumber,
        signatureHash: blockchainResult.signatureHash
      },
      document: document.getSummary()
    });

  } catch (error) {
    console.error('Document signing error:', error);
    res.status(500).json({ 
      error: 'Document signing failed. Please try again.' 
    });
  }
});

// Sign a document by ID (new endpoint for frontend)
router.post('/sign/:documentId', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { signature, signatureHash } = req.body;

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

    // Check if document is in pending status
    if (document.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Document is not in pending status and cannot be signed' 
      });
    }

    // Check identity verification status (warning only for demo)
    if (!req.user.identityVerified) {
      console.log('Warning: User signing document without identity verification:', req.user._id);
    }

    // Check authorization - document owners cannot sign their own documents
    const isOwner = document.owner._id.toString() === req.user._id.toString();
    const isRequiredSigner = document.requiredSigners.some(signer => signer._id.toString() === req.user._id.toString());
    const isOptionalSigner = document.optionalSigners.some(signer => signer._id.toString() === req.user._id.toString());

    // Prevent document owners from signing their own documents
    if (isOwner) {
      return res.status(403).json({ 
        error: 'Document owners cannot sign their own documents' 
      });
    }

    if (!isRequiredSigner && !isOptionalSigner) {
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

    // Generate a simple signature for demo purposes
    const demoSignature = signature || crypto.createHash('sha256')
      .update(`${documentId}-${req.user._id}-${Date.now()}`)
      .digest('hex');

    const demoSignatureHash = signatureHash || crypto.createHash('sha256')
      .update(demoSignature)
      .digest('hex');

    // Store signature on blockchain (simulated)
    const blockchainResult = await blockchainService.storeDocumentSignature(
      document._id.toString(),
      demoSignature,
      req.user.walletAddress || 'demo-wallet-address'
    );

    // Add signature to document
    const newSignature = {
      signer: req.user._id,
      signature: demoSignature,
      signatureHash: demoSignatureHash,
      blockchainTransactionHash: blockchainResult.transactionHash,
      signedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    document.signatures.push(newSignature);

    // Check if document is fully signed (simplified - mark as signed if owner signs)
    if (isOwner || document.isFullySigned()) {
      document.status = 'signed';
      document.signedAt = new Date();
    }

    await document.save();

    // Populate the new signature for response
    await document.populate('signatures.signer', 'firstName lastName email');

    res.json({
      message: 'Document signed successfully',
      signature: newSignature,
      blockchainTransaction: {
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber ? blockchainResult.blockNumber.toString() : blockchainResult.blockNumber,
        signatureHash: blockchainResult.signatureHash
      },
      document: document.getSummary()
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

    console.log('Fetching pending signatures for user:', req.user._id);
    console.log('User email:', req.user.email);

    // Find documents where user should see pending signatures
    const query = {
      $or: [
        // User is assigned as a required or optional signer
        { requiredSigners: req.user._id },
        { optionalSigners: req.user._id },
        // User owns the document and it's pending (to track status)
        { 
          owner: req.user._id,
          status: 'pending'
        },
        // For demo: include pending documents from other users
        { 
          status: 'pending',
          owner: { $ne: req.user._id }
        }
      ],
      status: { $in: ['draft', 'pending'] }
    };

    // For demo purposes: if no documents found with specific signers,
    // include all pending documents from other users
    let documents = await Document.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('requiredSigners', 'firstName lastName email')
      .populate('optionalSigners', 'firstName lastName email')
      .populate('signatures.signer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // If no documents found, try a broader search for demo purposes
    if (documents.length === 0) {
      console.log('No documents found with specific query, trying broader search...');
      const broaderQuery = {
        status: 'pending',
        owner: { $ne: req.user._id }
      };
      
      documents = await Document.find(broaderQuery)
        .populate('owner', 'firstName lastName email')
        .populate('requiredSigners', 'firstName lastName email')
        .populate('optionalSigners', 'firstName lastName email')
        .populate('signatures.signer', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    console.log('Found documents:', documents.length);
    documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, {
        id: doc._id,
        title: doc.title,
        status: doc.status,
        owner: doc.owner?.email,
        requiredSigners: doc.requiredSigners?.map(s => s.email),
        optionalSigners: doc.optionalSigners?.map(s => s.email)
      });
    });

    // Filter and categorize documents
    const pendingDocuments = documents.filter(doc => {
      console.log('Checking document:', doc.title);
      console.log('Document owner:', doc.owner._id.toString());
      console.log('Current user:', req.user._id.toString());
      console.log('Is owner?', doc.owner._id.toString() === req.user._id.toString());
      
      const isOwner = doc.owner._id.toString() === req.user._id.toString();
      const hasSigned = doc.signatures.some(sig => sig.signer._id.toString() === req.user._id.toString());
      
      console.log('Has signed?', hasSigned);
      
      // Show document if:
      // 1. User is assigned signer and hasn't signed yet
      // 2. For demo: any pending document from other users
      // Note: Owners cannot sign their own documents, so we don't show them in pending list
      
      if (isOwner) {
        // Don't show owner's own documents in pending list since they can't sign them
        return false;
      } else {
        // Non-owners can see documents they need to sign
        return !hasSigned;
      }
    });

    console.log('Final pending documents:', pendingDocuments.length);

    // Debug: Check all pending documents in the database
    const allPendingDocs = await Document.find({ status: 'pending' })
      .populate('owner', 'firstName lastName email')
      .populate('requiredSigners', 'firstName lastName email')
      .populate('optionalSigners', 'firstName lastName email');
    
    console.log('All pending documents in database:', allPendingDocs.length);
    allPendingDocs.forEach((doc, index) => {
      console.log(`All pending doc ${index + 1}:`, {
        id: doc._id,
        title: doc.title,
        owner: doc.owner?.email,
        requiredSigners: doc.requiredSigners?.map(s => s.email),
        optionalSigners: doc.optionalSigners?.map(s => s.email)
      });
    });

    const total = await Document.countDocuments(query);

    res.json({
      documents: pendingDocuments.map(doc => {
        const summary = doc.getSummary();
        const isOwner = doc.owner._id.toString() === req.user._id.toString();
        const isRequiredSigner = doc.requiredSigners.some(signer => signer._id.toString() === req.user._id.toString());
        const isOptionalSigner = doc.optionalSigners.some(signer => signer._id.toString() === req.user._id.toString());
        
        return {
          ...summary,
          userRole: isOwner ? 'owner' : (isRequiredSigner ? 'required_signer' : (isOptionalSigner ? 'optional_signer' : 'viewer'))
        };
      }),
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

// Demo endpoint to create a test pending document (for testing purposes)
router.post('/demo/create-pending', authenticate, async (req, res) => {
  try {
    // Find another user to create a document for
    const otherUser = await User.findOne({ _id: { $ne: req.user._id } });
    
    if (!otherUser) {
      return res.status(400).json({ error: 'No other users found for demo' });
    }
    
    // Create a demo document owned by another user
    const demoDocument = new Document({
      title: 'Demo Document for Signing',
      description: 'This is a demo document created for testing signature functionality',
      fileName: 'demo-document.pdf',
      filePath: 'uploads/demo/demo-document.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      fileHash: 'demo-hash-123',
      owner: otherUser._id,
      status: 'pending',
      submittedAt: new Date(),
      requiredSigners: [req.user._id], // Current user is required to sign
      metadata: {
        category: 'contract',
        priority: 'medium',
        confidentiality: 'internal'
      }
    });
    
    await demoDocument.save();
    
    res.json({
      message: 'Demo pending document created successfully',
      document: demoDocument.getSummary()
    });
    
  } catch (error) {
    console.error('Demo document creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create demo document' 
    });
  }
});

module.exports = router; 