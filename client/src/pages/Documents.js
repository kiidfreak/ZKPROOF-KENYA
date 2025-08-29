import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Documents = () => {
  // const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null,
    category: 'other',
    priority: 'medium',
    confidentiality: 'internal'
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file: file
      });
    }
  };

  const handleDocumentClick = async (document) => {
    setLoading(true);
    try {
      // Fetch complete document details including signatures
      const documentId = document.id || document._id;
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Full document data:', result);
        setSelectedDocument(result.document);
        setShowDocumentModal(true);
      } else {
        // Fallback to basic document data if fetch fails
        console.warn('Failed to fetch full document details, using basic data');
        setSelectedDocument(document);
        setShowDocumentModal(true);
      }
    } catch (error) {
      console.error('Error fetching document details:', error);
      // Fallback to basic document data
      setSelectedDocument(document);
      setShowDocumentModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  const handleSubmitForSigning = async () => {
    if (!selectedDocument) return;
    
    console.log('Selected document:', selectedDocument);
    console.log('Document ID:', selectedDocument.id || selectedDocument._id);
    
    const documentId = selectedDocument.id || selectedDocument._id;
    if (!documentId) {
      toast.error('Document ID is missing. Please try refreshing the page.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Document submitted for signing successfully!');
        handleCloseDocumentModal();
        fetchDocuments(); // Refresh the documents list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit document for signing');
      }
    } catch (error) {
      console.error('Submit for signing error:', error);
      toast.error('Failed to submit document for signing');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDocument = () => {
    if (!selectedDocument) return;
    
    // Pre-fill the upload form with existing document data
    setUploadForm({
      title: selectedDocument.title,
      description: selectedDocument.description || '',
      file: null, // Don't pre-fill file
      category: selectedDocument.metadata?.category || 'other',
      priority: selectedDocument.metadata?.priority || 'medium',
      confidentiality: selectedDocument.metadata?.confidentiality || 'internal'
    });
    
    // Close document modal and open upload modal in edit mode
    handleCloseDocumentModal();
    setShowUploadModal(true);
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    console.log('Selected document for deletion:', selectedDocument);
    console.log('Document ID for deletion:', selectedDocument.id || selectedDocument._id);
    
    const documentId = selectedDocument.id || selectedDocument._id;
    if (!documentId) {
      toast.error('Document ID is missing. Please try refreshing the page.');
      return;
    }
    
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${selectedDocument.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Document deleted successfully!');
        handleCloseDocumentModal();
        fetchDocuments(); // Refresh the documents list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete document error:', error);
      toast.error('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSigned = async () => {
    if (!selectedDocument) return;
    
    console.log('Selected document for download:', selectedDocument);
    
    const documentId = selectedDocument.id || selectedDocument._id;
    if (!documentId) {
      toast.error('Document ID not found');
      return;
    }
    
    setLoading(true);
    try {
      // Download signed document data from backend
      const response = await fetch(`/api/documents/${documentId}/download-signed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Download response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        
        // Generate PDF certificate
        await generatePDFCertificate(data);
        
        toast.success('PDF certificate generated successfully');
      } else {
        const error = await response.json();
        console.error('Download error response:', error);
        toast.error(error.error || 'Failed to download signed document');
      }
    } catch (error) {
      console.error('Error downloading signed document:', error);
      toast.error('Failed to download signed document');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFCertificate = async (data) => {
    try {
      // Create a temporary div for the certificate
      const certificateDiv = document.createElement('div');
      certificateDiv.style.position = 'absolute';
      certificateDiv.style.left = '-9999px';
      certificateDiv.style.top = '0';
      certificateDiv.style.width = '800px';
      certificateDiv.style.backgroundColor = 'white';
      certificateDiv.style.padding = '40px';
      certificateDiv.style.fontFamily = 'Arial, sans-serif';
      certificateDiv.style.color = 'black';
      
      certificateDiv.innerHTML = `
        <div style="text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 32px;">Document Certificate</h1>
          <h2 style="color: #34495e; margin: 10px 0; font-size: 24px;">${data.document.title}</h2>
          <p style="color: #7f8c8d; margin: 5px 0; font-size: 16px;">Signed on: ${new Date(data.document.signedAt).toLocaleString()}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 10px;">Document Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 150px;">Document ID:</td><td style="padding: 8px 0;">${data.document.id}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">File Name:</td><td style="padding: 8px 0;">${data.document.fileName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">File Size:</td><td style="padding: 8px 0;">${(data.document.fileSize / 1024).toFixed(1)} KB</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="padding: 8px 0; color: #27ae60; font-weight: bold;">${data.document.status.toUpperCase()}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Document Hash:</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${data.document.fileHash}</td></tr>
          </table>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 10px;">Signatures (${data.signatures.length})</h3>
          ${data.signatures.map((sig, index) => `
            <div style="border: 1px solid #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; background-color: #f8f9fa;">
              <h4 style="color: #34495e; margin: 0 0 10px 0;">Signature ${index + 1}</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0; font-weight: bold; width: 150px;">Signer:</td><td style="padding: 5px 0;">${sig.signer.firstName} ${sig.signer.lastName}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Email:</td><td style="padding: 5px 0;">${sig.signer.email}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Signed At:</td><td style="padding: 5px 0;">${new Date(sig.signedAt).toLocaleString()}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Signature Hash:</td><td style="padding: 5px 0; font-family: monospace; font-size: 11px;">${sig.signatureHash}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Blockchain TX:</td><td style="padding: 5px 0; font-family: monospace; font-size: 11px;">${sig.blockchainTransactionHash}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">IP Address:</td><td style="padding: 5px 0;">${sig.ipAddress}</td></tr>
              </table>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 10px;">Certificate Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 150px;">Issued At:</td><td style="padding: 8px 0;">${new Date(data.certificate.issuedAt).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Total Signatures:</td><td style="padding: 8px 0;">${data.certificate.totalSignatures}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Blockchain Verified:</td><td style="padding: 8px 0; color: #27ae60; font-weight: bold;">${data.certificate.blockchainVerified ? 'YES' : 'NO'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Verification URL:</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${data.certificate.verificationUrl}</td></tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #2c3e50; color: #7f8c8d;">
          <p style="margin: 0; font-style: italic;">This certificate verifies that the above document has been digitally signed and stored on the blockchain.</p>
          <p style="margin: 10px 0 0 0; font-size: 12px;">Generated on: ${new Date().toLocaleString()}</p>
        </div>
      `;
      
      document.body.appendChild(certificateDiv);
      
      // Convert to canvas and then to PDF
      const canvas = await html2canvas(certificateDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(certificateDiv);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download the PDF
      pdf.save(`certificate_${data.document.title}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF certificate');
    }
  };

  const handleViewCertificate = async () => {
    if (!selectedDocument) return;
    
    console.log('Selected document for certificate:', selectedDocument);
    
    setLoading(true);
    try {
      // Create a certificate view with all signature details
      const certificateData = {
        documentTitle: selectedDocument.title,
        documentId: selectedDocument.id || selectedDocument._id,
        signedAt: selectedDocument.signedAt || new Date(),
        signatures: selectedDocument.signatures || [],
        blockchainTransaction: selectedDocument.blockchainTransaction || {},
        verificationHash: selectedDocument.verificationHash || 'N/A'
      };

      console.log('Certificate data:', certificateData);

      // For now, show certificate in a new window/tab
      const certificateWindow = window.open('', '_blank');
      certificateWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Document Certificate - ${selectedDocument.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .certificate { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .signature { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .hash { font-family: monospace; background: #f0f0f0; padding: 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <h1>Document Certificate</h1>
              <h2>${selectedDocument.title}</h2>
              <p>Signed on: ${new Date(selectedDocument.signedAt).toLocaleString()}</p>
            </div>
            
            <h3>Document Information</h3>
            <p><strong>Document ID:</strong> ${certificateData.documentId}</p>
            <p><strong>File Name:</strong> ${selectedDocument.fileName}</p>
            <p><strong>Status:</strong> ${selectedDocument.status}</p>
            
            <h3>Signatures (${certificateData.signatures.length})</h3>
            ${certificateData.signatures.length > 0 ? 
              certificateData.signatures.map(sig => `
                <div class="signature">
                  <p><strong>Signer:</strong> ${sig.signer?.firstName || sig.signer?.name || 'Unknown'} ${sig.signer?.lastName || ''}</p>
                  <p><strong>Signed At:</strong> ${new Date(sig.signedAt || sig.timestamp || Date.now()).toLocaleString()}</p>
                  <p><strong>Signature Hash:</strong> <span class="hash">${sig.signatureHash || sig.hash || 'N/A'}</span></p>
                  <p><strong>Blockchain TX:</strong> <span class="hash">${sig.blockchainTransactionHash || sig.transactionHash || 'N/A'}</span></p>
                </div>
              `).join('') : 
              '<p><em>No signature details available</em></p>'
            }
            
            <h3>Blockchain Verification</h3>
            ${certificateData.signatures.length > 0 ? 
              certificateData.signatures.map((sig, index) => `
                <div class="signature" style="margin-bottom: 20px;">
                  <h4>Signature ${index + 1} Blockchain Data:</h4>
                  <p><strong>Transaction Hash:</strong> <span class="hash">${sig.blockchainTransactionHash || sig.transactionHash || 'N/A'}</span></p>
                  <p><strong>Block Number:</strong> ${sig.blockNumber || 'N/A'}</p>
                  <p><strong>Signature Hash:</strong> <span class="hash">${sig.signatureHash || sig.hash || 'N/A'}</span></p>
                </div>
              `).join('') : 
              '<p><em>No blockchain verification data available</em></p>'
            }
            <p><strong>Document Hash:</strong> <span class="hash">${selectedDocument.fileHash || 'N/A'}</span></p>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p><em>This certificate verifies that the above document has been digitally signed and stored on the blockchain.</em></p>
            </div>
          </div>
        </body>
        </html>
      `);
      certificateWindow.document.close();
      
      toast.success('Certificate opened in new window');
    } catch (error) {
      console.error('Error viewing certificate:', error);
      toast.error('Failed to view certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('metadata[category]', uploadForm.category);
      formData.append('metadata[priority]', uploadForm.priority);
      formData.append('metadata[confidentiality]', uploadForm.confidentiality);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        // const result = await response.json();
        toast.success('Document uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({
          title: '',
          description: '',
          file: null,
          category: 'other',
          priority: 'medium',
          confidentiality: 'internal'
        });
        // Refresh documents list
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched documents data:', data);
        console.log('Documents array:', data.documents);
        if (data.documents && data.documents.length > 0) {
          console.log('First document:', data.documents[0]);
          console.log('First document _id:', data.documents[0]._id);
        }
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Document Management</h1>
              <p className="text-gray-300">Upload and manage your electronic documents</p>
            </div>
          </div>
          <button 
            className="btn-primary flex items-center"
            onClick={() => setShowUploadModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">My Documents</h2>
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-100">No documents found</h3>
            <p className="mt-1 text-sm text-gray-400">
              Try uploading your first document.
            </p>
            <div className="mt-6">
              <button 
                className="btn-primary"
                onClick={() => setShowUploadModal(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div 
                key={doc.id || doc._id} 
                className="bg-[#232c3a] rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors duration-200"
                onClick={() => handleDocumentClick(doc)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-100 truncate">{doc.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === 'signed' ? 'bg-green-100 text-green-800' :
                    doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{doc.description}</p>
                <div className="text-xs text-gray-500">
                  <p>Size: {doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : '0'} KB</p>
                  <p>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23272f] rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-100">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter document title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter document description"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-1">
                  File *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 50MB)
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-100 mb-1">
                    Category
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                    className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="contract">Contract</option>
                    <option value="agreement">Agreement</option>
                    <option value="certificate">Certificate</option>
                    <option value="report">Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 mb-1">
                    Priority
                  </label>
                  <select
                    value={uploadForm.priority}
                    onChange={(e) => setUploadForm({...uploadForm, priority: e.target.value})}
                    className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 mb-1">
                    Confidentiality
                  </label>
                  <select
                    value={uploadForm.confidentiality}
                    onChange={(e) => setUploadForm({...uploadForm, confidentiality: e.target.value})}
                    className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="confidential">Confidential</option>
                    <option value="secret">Secret</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23272f] rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-100">Document Details</h2>
              <button
                onClick={handleCloseDocumentModal}
                className="text-gray-400 hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Document Info */}
              <div className="bg-[#232c3a] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-100">{selectedDocument.title}</h3>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    selectedDocument.status === 'signed' ? 'bg-green-100 text-green-800' :
                    selectedDocument.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedDocument.status}
                  </span>
                </div>
                
                {selectedDocument.description && (
                  <p className="text-gray-300 mb-3">{selectedDocument.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">File Name:</span>
                    <p className="text-gray-100">{selectedDocument.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">File Size:</span>
                    <p className="text-gray-100">{(selectedDocument.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <p className="text-gray-100 capitalize">{selectedDocument.metadata?.category || 'Other'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Uploaded:</span>
                    <p className="text-gray-100">{new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-[#232c3a] rounded-lg p-4 border border-gray-700">
                <h4 className="text-md font-medium text-gray-100 mb-3">Actions</h4>
                
                <div className="space-y-3">
                  {selectedDocument.status === 'draft' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">
                        This document is currently in draft status. To start the signing process:
                      </p>
                      <div className="flex space-x-3">
                        <button 
                          onClick={handleSubmitForSigning}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          Submit for Signing
                        </button>
                        <button 
                          onClick={handleEditDocument}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                        >
                          Edit Document
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedDocument.status === 'pending' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">
                        This document is pending signatures. Current progress:
                      </p>
                      <div className="flex space-x-3">
                        <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                          View Signatures
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
                          Send Reminders
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedDocument.status === 'signed' && (
                    <div className="space-y-2">
                      <p className="text-sm text-green-300">
                        ✅ This document has been fully signed by all parties.
                      </p>
                      <div className="flex space-x-3">
                        <button 
                          onClick={handleDownloadSigned}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating PDF...
                            </>
                          ) : (
                            'Download PDF Certificate'
                          )}
                        </button>
                        <button 
                          onClick={handleViewCertificate}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            'View Certificate'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-700">
                    <button 
                      onClick={handleDeleteDocument}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-red-700 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Delete Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents; 