import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const DocumentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/documents/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setDocument(data.document);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch document');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Failed to fetch document');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'text-yellow-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: ClockIcon };
      case 'pending':
        return { color: 'text-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: ClockIcon };
      case 'signed':
        return { color: 'text-green-500', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircleIcon };
      case 'expired':
        return { color: 'text-red-500', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: ClockIcon };
      case 'cancelled':
        return { color: 'text-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: ClockIcon };
      default:
        return { color: 'text-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: ClockIcon };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Document Detail</h1>
              <p className="text-gray-300">Document ID: {id}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            <h3 className="mt-2 text-sm font-medium text-gray-100">Loading document...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Document Detail</h1>
              <p className="text-gray-300">Document ID: {id}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-100">Document not found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Document Detail</h1>
              <p className="text-gray-300">Document ID: {id}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-100">Document not found</h3>
            <p className="mt-1 text-sm text-gray-400">
              The requested document could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(document.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{document.title}</h1>
              <p className="text-gray-300">Document ID: {document._id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
              <statusInfo.icon className="h-4 w-4 mr-1" />
              {document.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Document Information */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Document Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <p className="text-gray-100">{document.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <p className="text-gray-100">{document.description || 'No description provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">File Name</label>
              <p className="text-gray-100">{document.fileName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">File Size</label>
              <p className="text-gray-100">{(document.fileSize / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Created</label>
              <p className="text-gray-100">{new Date(document.createdAt).toLocaleString()}</p>
            </div>
            {document.submittedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Submitted</label>
                <p className="text-gray-100">{new Date(document.submittedAt).toLocaleString()}</p>
              </div>
            )}
            {document.signedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Signed</label>
                <p className="text-gray-100">{new Date(document.signedAt).toLocaleString()}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <p className="text-gray-100">{document.status.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Owner */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 text-blue-400 mr-2" />
          Document Owner
        </h2>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {document.owner?.firstName?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <p className="text-gray-100 font-medium">
              {document.owner?.firstName} {document.owner?.lastName}
            </p>
            <p className="text-gray-400 text-sm">{document.owner?.email}</p>
          </div>
        </div>
      </div>

      {/* Signatures */}
      {document.signatures && document.signatures.length > 0 && (
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            Signatures ({document.signatures.length})
          </h2>
          <div className="space-y-4">
            {document.signatures.map((signature, index) => (
              <div key={index} className="bg-[#2a2f3b] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {signature.signer?.firstName?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-100 font-medium">
                        {signature.signer?.firstName} {signature.signer?.lastName}
                      </p>
                      <p className="text-gray-400 text-sm">{signature.signer?.email}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(signature.signedAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-gray-400 mb-1">Signature Hash</label>
                    <p className="text-gray-100 font-mono text-xs break-all">{signature.signatureHash}</p>
                  </div>
                  {signature.blockchainTransactionHash && (
                    <div>
                      <label className="block text-gray-400 mb-1">Blockchain TX</label>
                      <p className="text-gray-100 font-mono text-xs break-all">{signature.blockchainTransactionHash}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required Signers */}
      {document.requiredSigners && document.requiredSigners.length > 0 && (
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4">Required Signers</h2>
          <div className="space-y-2">
            {document.requiredSigners.map((signer, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {signer.firstName?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-100">
                    {signer.firstName} {signer.lastName}
                  </p>
                  <p className="text-gray-400 text-sm">{signer.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Signers */}
      {document.optionalSigners && document.optionalSigners.length > 0 && (
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4">Optional Signers</h2>
          <div className="space-y-2">
            {document.optionalSigners.map((signer, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {signer.firstName?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-100">
                    {signer.firstName} {signer.lastName}
                  </p>
                  <p className="text-gray-400 text-sm">{signer.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail; 