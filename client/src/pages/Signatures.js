import React, { useState, useEffect } from 'react';
import { ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Signatures = () => {
  const { user } = useAuth();
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [signedDocuments, setSignedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [signResult, setSignResult] = useState(null);

  // Fetch pending signature documents
  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Pending documents:', data);
        setPendingDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch pending documents');
      }
    } catch (error) {
      console.error('Error fetching pending documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch draft documents that need to be submitted
  const [draftDocuments, setDraftDocuments] = useState([]);
  
  // Fetch previously signed documents
  const fetchSignedDocuments = async () => {
    try {
      const response = await fetch('/api/documents?status=signed', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Signed documents:', data);
        setSignedDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch signed documents');
      }
    } catch (error) {
      console.error('Error fetching signed documents:', error);
    }
  };
  
  const fetchDraftDocuments = async () => {
    try {
      const response = await fetch('/api/documents?status=draft', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDraftDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching draft documents:', error);
    }
  };

  useEffect(() => {
    fetchPendingDocuments();
    fetchSignedDocuments();
    fetchDraftDocuments();
  }, []);

  // Handle document signing
  const handleSignDocument = async (documentId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/signatures/sign/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signature: 'digital_signature_data', // This would be generated
          signatureHash: 'signature_hash' // This would be generated
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSignResult(result.blockchainTransaction);
        toast.success('Document signed successfully!');
        fetchPendingDocuments(); // Refresh the list
        fetchSignedDocuments(); // Refresh signed documents list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to sign document');
      }
    } catch (error) {
      console.error('Sign document error:', error);
      toast.error('Failed to sign document');
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing signed document details
  const handleViewSignedDocument = (documentId) => {
    window.location.href = `/documents/${documentId}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Signature Management</h1>
            <p className="text-gray-300">Manage your electronic document signatures</p>
          </div>
        </div>
      </div>

      {signResult && (
        <div className="bg-[#232c3a] border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-100 mb-2">Blockchain Transaction</h3>
          <div className="space-y-1">
            <div>
              <span className="font-medium text-blue-200">Transaction Hash: </span>
              <span className="font-mono text-xs text-blue-300">{signResult.transactionHash}</span>
            </div>
            <div>
              <span className="font-medium text-blue-200">Block Number: </span>
              <span className="font-mono text-xs text-blue-300">{signResult.blockNumber}</span>
            </div>
            {signResult.signatureHash && (
              <div>
                <span className="font-medium text-blue-200">Signature Hash: </span>
                <span className="font-mono text-xs text-blue-300">{signResult.signatureHash}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Pending Signature Documents</h2>
        {loading ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            <h3 className="mt-2 text-sm font-medium text-gray-100">Loading pending documents...</h3>
          </div>
        ) : pendingDocuments.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-100">No pending signature documents</h3>
            <p className="mt-1 text-sm text-gray-400">
              No documents require signature.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingDocuments.map((doc) => (
              <div key={doc.id} className="bg-[#2a2f3b] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-100">{doc.title}</h3>
                  <p className="text-sm text-gray-300">{doc.description}</p>
                  <p className="text-sm text-gray-400">
                    Created by {doc.createdBy?.username || 'Unknown'} on {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleSignDocument(doc.id)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing...' : 'Sign Document'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previously Signed Documents Section */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          Previously Signed Documents
        </h2>
        {signedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-100">No previously signed documents</h3>
            <p className="mt-1 text-sm text-gray-400">
              Documents you sign will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {signedDocuments.map((doc) => (
              <div key={doc.id} className="bg-[#2a2f3b] rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-100">{doc.title}</h3>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Signed
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{doc.description || 'No description'}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Created: {new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span>Signed: {doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : 'Not signed yet'}</span>
                    <span>Signatures: {doc.signatureCount || 0}</span>
                  </div>
                  {doc.signatures && doc.signatures.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Signed by: {doc.signatures.map(sig => 
                          `${sig.signer?.firstName || 'Unknown'} ${sig.signer?.lastName || ''}`
                        ).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleViewSignedDocument(doc.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draft Documents Section */}
      {draftDocuments.length > 0 && (
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4">Draft Documents (Need to Submit for Signing)</h2>
          <div className="grid gap-4">
            {draftDocuments.map((doc) => (
              <div key={doc.id} className="bg-[#2a2f3b] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-100">{doc.title}</h3>
                  <p className="text-sm text-gray-300">{doc.description || 'No description'}</p>
                  <p className="text-sm text-gray-400">
                    Created on {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Draft
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.location.href = '/documents'}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Go to Documents
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> To get documents ready for signing, go to the Documents page, 
              click on a draft document, and click "Submit for Signing".
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signatures; 