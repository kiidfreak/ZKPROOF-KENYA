import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { identityAPI } from '../services/api';
import { ShieldCheckIcon, CheckCircleIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const IdentityVerification = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    idType: 'passport',
    idNumber: '',
    dateOfBirth: '',
    nationality: '',
    idFile: null
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        idFile: file
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!formData.idFile) {
      toast.error('Please upload your ID proof');
      return;
    }
    if (!formData.idNumber.trim()) {
      toast.error('Please enter your ID number');
      return;
    }
    if (!formData.dateOfBirth) {
      toast.error('Please enter your date of birth');
      return;
    }
    if (!formData.nationality.trim()) {
      toast.error('Please enter your nationality');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('idFile', formData.idFile);
      submitData.append('idType', formData.idType);
      submitData.append('idNumber', formData.idNumber);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('nationality', formData.nationality);
      submitData.append('fullName', `${user.firstName} ${user.lastName}`);

      const response = await fetch('/api/identity/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Identity verification submitted successfully!');
        setVerificationStatus(result);
        setShowForm(false);
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit identity verification');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to submit identity verification');
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

      {user?.identityVerified ? (
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
          <form onSubmit={handleVerification} className="space-y-4">
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