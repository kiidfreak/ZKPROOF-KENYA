import React from 'react';
import { useParams } from 'react-router-dom';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const DocumentDetail = () => {
  const { id } = useParams();

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
        <h2 className="text-lg font-medium text-gray-100 mb-4">Document Information</h2>
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
};

export default DocumentDetail; 