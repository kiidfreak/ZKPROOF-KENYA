import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Identity Verification Status',
      value: user?.identityVerified ? 'Verified' : 'Not Verified',
      icon: ShieldCheckIcon,
      color: user?.identityVerified ? 'text-green-600' : 'text-yellow-600',
      bgColor: user?.identityVerified ? 'bg-green-100' : 'bg-yellow-100',
      href: '/identity'
    },
    {
      name: 'My Documents',
      value: '0 documents',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/documents'
    },
    {
      name: 'Pending Signatures',
      value: '0 signatures',
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/signatures'
    }
  ];

  const quickActions = [
    {
      name: 'Identity Verification',
      description: 'Complete identity verification on the blockchain',
      href: '/identity',
      icon: ShieldCheckIcon,
      color: 'bg-blue-500',
      disabled: user?.identityVerified
    },
    {
      name: 'Upload Document',
      description: 'Upload a new document and request signature',
      href: '/documents',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      disabled: false
    },
    {
      name: 'Pending Signature Documents',
      description: 'Check documents that need signatures',
      href: '/signatures',
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500',
      disabled: false
    },
    {
      name: 'Profile Management',
      description: 'Manage personal information and settings',
      href: '/profile',
      icon: UserIcon,
      color: 'bg-gray-500',
      disabled: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              Hello, {user?.firstName}!
            </h1>
            <p className="mt-1 text-gray-300">
              Welcome to BKC Verify, the blockchain-based identity verification and electronic document signing system.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {user?.identityVerified ? (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Identity Verified</span>
              </div>
            ) : (
              <div className="flex items-center text-yellow-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Identity Verification Needed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-4">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-300 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-100">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={stat.href}
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                View Details
                <ArrowRightIcon className="inline h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`relative rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${action.color} rounded-md p-2`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-100">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {action.description}
                  </p>
                </div>
              </div>
              {action.disabled && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center text-gray-400">
            <ClockIcon className="h-5 w-5 mr-3" />
            <span className="text-sm">No recent activity yet.</span>
          </div>
        </div>
      </div>

      {/* Blockchain Status */}
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-100 mb-4">Blockchain Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-[#232c3a] rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-100">Network</p>
              <p className="text-sm text-gray-300">Sepolia Testnet</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm text-green-400">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#232c3a] rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-100">Wallet Address</p>
              <p className="text-sm text-gray-300 font-mono">
                {user?.walletAddress ? 
                  `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 
                  'Generating...'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 