import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
        const result = await response.json();
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
              <div key={doc._id} className="bg-[#232c3a] rounded-lg p-4 border border-gray-700">
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
                  <p>Size: {(doc.fileSize / 1024).toFixed(1)} KB</p>
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
    </div>
  );
};

export default Documents; 