import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { identityAPI } from '../services/api';
import { ShieldCheckIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const IdentityVerification = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isVerified, setIsVerified] = useState(user?.identityVerified || false);
  
  // Check verification status on component mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await identityAPI.getStatus();
        setIsVerified(response.data.verified);
        if (response.data.verified) {
          setVerificationStatus(response.data);
        }
      } catch (error) {
        console.error('Failed to check verification status:', error);
      }
    };
    
    checkVerificationStatus();
  }, []);
  
  const [formData, setFormData] = useState({
    idType: 'passport',
    idNumber: '',
    dateOfBirth: '',
    nationality: '',
    fullName: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submitData = new FormData();
    submitData.append('idFile', selectedFile);
    submitData.append('idType', formData.idType);
    submitData.append('idNumber', formData.idNumber);
    submitData.append('dateOfBirth', formData.dateOfBirth);
    submitData.append('nationality', formData.nationality);
    submitData.append('fullName', `${user.firstName} ${user.lastName}`);

    try {
      const response = await identityAPI.verify(submitData);
      toast.success('Identity verification submitted successfully!');
      
      // Update local state
      setIsVerified(true);
      setVerificationStatus(response.data);
      setShowForm(false);
      
      // Update user context if available
      if (updateUser) {
        updateUser({ ...user, identityVerified: true });
      }
      
      setFormData({
        idType: 'passport',
        idNumber: '',
        dateOfBirth: '',
        nationality: '',
        fullName: ''
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Verification error:', error);
      
      // Enhanced error handling for document validation
      if (error.response?.data?.error === 'Document validation failed') {
        const details = error.response.data.details;
        const validationScore = error.response.data.validationScore;
        
        let errorMessage = 'Document validation failed:\n';
        
        if (Array.isArray(details)) {
          details.forEach(detail => {
            errorMessage += `• ${detail}\n`;
          });
        }
        
        if (validationScore !== undefined) {
          errorMessage += `\nValidation Score: ${(validationScore * 100).toFixed(1)}%`;
        }
        
        setError(errorMessage);
        toast.error('Document validation failed. Please check your document and input data.');
      } else {
        const errorMsg = error.response?.data?.error || 'Identity verification failed. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Identity Verification</h1>
            <p className="text-gray-300">Submit your government-issued ID for blockchain-based identity verification.</p>
          </div>
        </div>
      </div>

      {isVerified || user?.identityVerified ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h2 className="text-lg font-medium text-green-900">Identity Verified</h2>
              <p className="text-green-700">Your identity has been successfully verified.</p>
            </div>
          </div>
          {verificationStatus && verificationStatus.blockchainTransaction && (
            <div className="bg-[#232c3a] border border-blue-700 rounded-lg p-6 mt-4">
              <h3 className="text-lg font-medium text-blue-100 mb-2">Blockchain Transaction</h3>
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-blue-200">Transaction Hash: </span>
                  <span className="font-mono text-xs text-blue-300">{verificationStatus.blockchainTransaction.transactionHash}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-200">Block Number: </span>
                  <span className="font-mono text-xs text-blue-300">{verificationStatus.blockchainTransaction.blockNumber}</span>
                </div>
                {verificationStatus.blockchainTransaction.verificationHash && (
                  <div>
                    <span className="font-medium text-blue-200">Verification Hash: </span>
                    <span className="font-mono text-xs text-blue-300">{verificationStatus.blockchainTransaction.verificationHash}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h2 className="text-lg font-medium text-yellow-900">Identity Verification Required</h2>
                <p className="text-yellow-700">Please complete identity verification to use all features.</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Start Verification
            </button>
          </div>
        </div>
      )}

      {/* Identity Verification Form */}
      {showForm && (
        <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4">Identity Verification Form</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                ID Type *
              </label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="drivers_license">Driver's License</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                ID Number *
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your ID number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                Nationality *
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your nationality"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={`${user.firstName} ${user.lastName}`}
                className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-300 cursor-not-allowed"
                disabled
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">
                Your name from registration will be used for verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-1">
                ID Proof File *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-[#232c3a] border border-gray-700 rounded-lg text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: PDF, JPG, PNG (Max 10MB)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                <h3 className="text-sm font-medium mb-1">Error:</h3>
                <p className="text-xs">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Identity Verification Information</h2>
        <div className="space-y-4">
          <p className="text-gray-300">
            Identity verification is required to use all features. Your identity information will be securely stored on the blockchain and cannot be tampered with.
          </p>
          <div className="bg-[#232c3a] rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-100 mb-2">What happens after verification?</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Your identity data is cryptographically signed and stored on the blockchain</li>
              <li>• Your verification status is permanently recorded</li>
              <li>• You can download a digital verification certificate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerification; 