import React, { useState } from 'react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const Signatures = () => {
  // State to hold blockchain transaction result after signing
  const [signResult, setSignResult] = useState(null);

  // Example: Call this function after a successful sign API call
  // const handleSign = async (documentId, signature, signatureHash) => {
  //   const response = await signaturesAPI.sign(documentId, signature, signatureHash);
  //   setSignResult(response.data.blockchainTransaction);
  // };

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
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-100">No pending signature documents</h3>
          <p className="mt-1 text-sm text-gray-400">
            No documents require signature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signatures; 