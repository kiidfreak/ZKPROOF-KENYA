const express = require('express');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const User = require('../models/User');
const { authenticate, requireIdentityVerification } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const router = express.Router();

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doc-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPEG, PNG, and JPG files are allowed.'));
    }
  }
});

// Validation rules
const documentValidation = [
  body('title').trim().notEmpty().withMessage('Document title is required'),
  body('description').optional().trim(),
  body('metadata.category').optional().isIn(['contract', 'agreement', 'certificate', 'report', 'other']).withMessage('Valid category is required'),
  body('metadata.priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority is required'),
  body('metadata.confidentiality').optional().isIn(['public', 'internal', 'confidential', 'secret']).withMessage('Valid confidentiality level is required'),
  body('requiredSigners').optional().isArray().withMessage('Required signers must be an array'),
  body('optionalSigners').optional().isArray().withMessage('Optional signers must be an array')
];

// Upload new document
router.post('/upload', authenticate, upload.single('document'), documentValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Document file is required' 
      });
    }

    const { 
      title, 
      description, 
      metadata = {}, 
      requiredSigners = [], 
      optionalSigners = [],
      settings = {}
    } = req.body;

    // Calculate file hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Create document
    const document = new Document({
      title,
      description,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileHash,
      owner: req.user._id,
      metadata,
      requiredSigners,
      optionalSigners,
      settings
    });

    await document.save();

    // Populate owner information
    await document.populate('owner', 'firstName lastName email');

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: document.getSummary()
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      error: 'Document upload failed. Please try again.' 
    });
  }
});

// Get user's documents
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category,
      search 
    } = req.query;

    const query = { owner: req.user._id };
    
    if (status) query.status = status;
    if (category) query['metadata.category'] = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const documents = await Document.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('requiredSigners', 'firstName lastName email')
      .populate('optionalSigners', 'firstName lastName email')
      .populate('signatures.signer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments(query);

    res.json({
      documents: documents.map(doc => doc.getSummary()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDocuments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch documents' 
    });
  }
});

// Submit document for signing
router.post('/:documentId/submit', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Check if user owns the document
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to modify this document' });
    }
    
    // Check if document is in draft status
    if (document.status !== 'draft') {
      return res.status(400).json({ error: 'Document is not in draft status' });
    }
    
    // Update document status to pending
    document.status = 'pending';
    document.submittedAt = new Date();
    
    await document.save();
    
    res.json({
      message: 'Document submitted for signing successfully',
      document: document.getSummary()
    });
    
  } catch (error) {
    console.error('Submit document error:', error);
    res.status(500).json({ 
      error: 'Failed to submit document for signing' 
    });
  }
});

// Delete document
router.delete('/:documentId', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Check if user owns the document
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this document' });
    }
    
    // Check if document can be deleted (only draft documents)
    if (document.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft documents can be deleted' });
    }
    
    // Delete the file from storage
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Delete the document from database
    await Document.findByIdAndDelete(req.params.documentId);
    
    res.json({
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      error: 'Failed to delete document' 
    });
  }
});

// Get document by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('requiredSigners', 'firstName lastName email')
      .populate('optionalSigners', 'firstName lastName email')
      .populate('signatures.signer', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user has access to this document
    const hasAccess = document.owner._id.toString() === req.user._id.toString() ||
                     document.requiredSigners.some(signer => signer._id.toString() === req.user._id.toString()) ||
                     document.optionalSigners.some(signer => signer._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    res.json({
      document: {
        ...document.toObject(),
        isFullySigned: document.isFullySigned(),
        completionPercentage: document.completionPercentage
      }
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document' 
    });
  }
});

// Update document
router.put('/:id', authenticate, documentValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user is the owner
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Only document owner can update the document' 
      });
    }

    // Check if document can be updated (not signed)
    if (document.status === 'signed') {
      return res.status(400).json({ 
        error: 'Cannot update signed document' 
      });
    }

    const { 
      title, 
      description, 
      metadata, 
      requiredSigners, 
      optionalSigners,
      settings 
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (metadata) updateData.metadata = { ...document.metadata, ...metadata };
    if (requiredSigners) updateData.requiredSigners = requiredSigners;
    if (optionalSigners) updateData.optionalSigners = optionalSigners;
    if (settings) updateData.settings = { ...document.settings, ...settings };

    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument.getSummary()
    });

  } catch (error) {
    console.error('Document update error:', error);
    res.status(500).json({ 
      error: 'Failed to update document' 
    });
  }
});

// Add comment to document
router.post('/:id/comments', authenticate, [
  body('content').trim().notEmpty().withMessage('Comment content is required')
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

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user has access to this document
    const hasAccess = document.owner.toString() === req.user._id.toString() ||
                     document.requiredSigners.some(signer => signer.toString() === req.user._id.toString()) ||
                     document.optionalSigners.some(signer => signer.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Check if comments are allowed
    if (!document.settings.allowComments) {
      return res.status(400).json({ 
        error: 'Comments are not allowed for this document' 
      });
    }

    const { content } = req.body;

    document.comments.push({
      user: req.user._id,
      content
    });

    await document.save();

    // Populate the new comment
    await document.populate('comments.user', 'firstName lastName email');

    const newComment = document.comments[document.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Comment add error:', error);
    res.status(500).json({ 
      error: 'Failed to add comment' 
    });
  }
});

// Download document
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user has access to this document
    const hasAccess = document.owner.toString() === req.user._id.toString() ||
                     document.requiredSigners.some(signer => signer.toString() === req.user._id.toString()) ||
                     document.optionalSigners.some(signer => signer.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ 
        error: 'Document file not found' 
      });
    }

    res.download(document.filePath, document.fileName);

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ 
      error: 'Failed to download document' 
    });
  }
});

// Download signed document with certificate
router.get('/:id/download-signed', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('signatures.signer', 'firstName lastName email')
      .populate('owner', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Check if user has access to this document
    console.log('Download access check:');
    console.log('Document owner:', document.owner);
    console.log('Document owner ID:', document.owner._id);
    console.log('User ID:', req.user._id);
    console.log('Owner match:', document.owner._id.toString() === req.user._id.toString());
    
    const hasAccess = document.owner._id.toString() === req.user._id.toString() ||
                     document.requiredSigners.some(signer => signer._id.toString() === req.user._id.toString()) ||
                     document.optionalSigners.some(signer => signer._id.toString() === req.user._id.toString());

    console.log('Has access:', hasAccess);

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Check if document is signed
    if (document.status !== 'signed') {
      return res.status(400).json({ 
        error: 'Document is not signed yet' 
      });
    }

    // Create signed document package
    const signedDocumentPackage = {
      document: {
        id: document._id,
        title: document.title,
        description: document.description,
        fileName: document.fileName,
        fileSize: document.fileSize,
        fileType: document.fileType,
        status: document.status,
        createdAt: document.createdAt,
        signedAt: document.signedAt,
        owner: document.owner,
        fileHash: document.fileHash
      },
      signatures: document.signatures.map(sig => ({
        signer: sig.signer,
        signature: sig.signature,
        signatureHash: sig.signatureHash,
        blockchainTransactionHash: sig.blockchainTransactionHash,
        signedAt: sig.signedAt,
        ipAddress: sig.ipAddress,
        userAgent: sig.userAgent
      })),
      certificate: {
        issuedAt: new Date(),
        documentHash: document.fileHash,
        totalSignatures: document.signatures.length,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${document._id}`,
        blockchainVerified: document.signatures.length > 0
      }
    };

    // Set response headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="signed_${document.fileName || 'document'}.json"`);
    
    res.json(signedDocumentPackage);

  } catch (error) {
    console.error('Signed document download error:', error);
    res.status(500).json({ 
      error: 'Failed to download signed document' 
    });
  }
});

module.exports = router; 