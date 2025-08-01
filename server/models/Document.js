const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'signed', 'expired', 'cancelled'],
    default: 'draft'
  },
  signatures: [{
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    signature: {
      type: String,
      required: true
    },
    signatureHash: {
      type: String,
      required: true
    },
    blockchainTransactionHash: {
      type: String
    },
    signedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  requiredSigners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  optionalSigners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    category: {
      type: String,
      enum: ['contract', 'agreement', 'certificate', 'report', 'other'],
      default: 'other'
    },
    tags: [String],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    confidentiality: {
      type: String,
      enum: ['public', 'internal', 'confidential', 'secret'],
      default: 'internal'
    }
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    requireAllSigners: {
      type: Boolean,
      default: true
    },
    allowRejection: {
      type: Boolean,
      default: true
    },
    expirationDate: Date,
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' }
    }
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    version: Number,
    createdAt: Date
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
documentSchema.index({ owner: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ 'signatures.signer': 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ fileHash: 1 });

// Virtual for signature count
documentSchema.virtual('signatureCount').get(function() {
  return this.signatures.length;
});

// Virtual for required signatures count
documentSchema.virtual('requiredSignatureCount').get(function() {
  return this.requiredSigners.length;
});

// Virtual for completion percentage
documentSchema.virtual('completionPercentage').get(function() {
  if (this.requiredSigners.length === 0) return 100;
  const signedCount = this.signatures.filter(sig => 
    this.requiredSigners.some(req => req.toString() === sig.signer.toString())
  ).length;
  return Math.round((signedCount / this.requiredSigners.length) * 100);
});

// Method to check if document is fully signed
documentSchema.methods.isFullySigned = function() {
  if (this.requiredSigners.length === 0) return true;
  
  const signedSigners = this.signatures.map(sig => sig.signer.toString());
  return this.requiredSigners.every(signer => 
    signedSigners.includes(signer.toString())
  );
};

// Method to get document summary
documentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    status: this.status,
    signatureCount: this.signatureCount,
    requiredSignatureCount: this.requiredSignatureCount,
    completionPercentage: this.completionPercentage,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema); 