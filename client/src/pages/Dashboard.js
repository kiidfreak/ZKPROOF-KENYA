import React, { useState, useEffect } from 'react';
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
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [stats, setStats] = useState([
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
      value: 'Loading...',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/documents'
    },
    {
      name: 'Pending Signatures',
      value: 'Loading...',
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/signatures'
    }
  ]);

  // Fetch document and signature counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch documents count
        const documentsResponse = await fetch('/api/documents', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        let documentsCount = 0;
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          documentsCount = documentsData.documents?.length || 0;
        }

        // Fetch pending signatures count (only documents user can sign)
        const signaturesResponse = await fetch('/api/signatures/pending', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        let signaturesCount = 0;
        if (signaturesResponse.ok) {
          const signaturesData = await signaturesResponse.json();
          console.log('Signatures response:', signaturesData);
          // Only count documents where user is not the owner (can actually sign)
          signaturesCount = signaturesData.documents?.filter(doc => 
            doc.owner?._id !== user?._id
          ).length || 0;
          console.log('Signatures count:', signaturesCount);
        } else {
          console.error('Signatures response not ok:', signaturesResponse.status);
        }

        // Update stats with real data
        setStats([
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
            value: `${documentsCount} document${documentsCount !== 1 ? 's' : ''}`,
            icon: DocumentTextIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            href: '/documents'
          },
          {
            name: 'Pending Signatures',
            value: `${signaturesCount} signature${signaturesCount !== 1 ? 's' : ''}`,
            icon: ClipboardDocumentListIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            href: '/signatures'
          }
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set fallback values on error
        setStats(prevStats => prevStats.map(stat => {
          if (stat.name === 'My Documents') {
            return { ...stat, value: '0 documents' };
          }
          if (stat.name === 'Pending Signatures') {
            return { ...stat, value: '0 signatures' };
          }
          return stat;
        }));
      }
    };

    fetchStats();
  }, [user?.identityVerified]);

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setActivitiesLoading(true);
        
        // Fetch recent documents
        const documentsResponse = await fetch('/api/documents?limit=5', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        let activities = [];
        
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          const documents = documentsData.documents || [];
          
          // Convert documents to activities
          documents.forEach(doc => {
            activities.push({
              id: doc._id,
              type: 'document_upload',
              title: `Uploaded "${doc.title}"`,
              description: `Document uploaded with status: ${doc.status}`,
              timestamp: new Date(doc.createdAt),
              icon: PlusIcon,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
              href: `/documents/${doc._id}`
            });
            
            // Add signature activities if document is signed
            if (doc.status === 'signed' && doc.signatures && doc.signatures.length > 0) {
              doc.signatures.forEach(sig => {
                activities.push({
                  id: `${doc._id}-sig-${sig.signedAt}`,
                  type: 'document_signed',
                  title: `Signed "${doc.title}"`,
                  description: `Document signed by ${sig.signer?.firstName || 'Unknown'} ${sig.signer?.lastName || ''}`,
                  timestamp: new Date(sig.signedAt),
                  icon: CheckCircleIcon,
                  color: 'text-green-600',
                  bgColor: 'bg-green-100',
                  href: `/documents/${doc._id}`
                });
              });
            }
            
            // Add status change activities
            if (doc.status === 'pending' && doc.submittedAt) {
              activities.push({
                id: `${doc._id}-submitted`,
                type: 'document_submitted',
                title: `Submitted "${doc.title}" for Signing`,
                description: 'Document submitted and awaiting signatures',
                timestamp: new Date(doc.submittedAt),
                icon: ClockIcon,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100',
                href: `/documents/${doc._id}`
              });
            }
          });
        }
        
        // Add identity verification activity if verified
        if (user?.identityVerified && user?.verificationData?.verificationDate) {
          activities.push({
            id: 'identity-verification',
            type: 'identity_verified',
            title: 'Identity Verification Completed',
            description: 'Your identity has been verified on the blockchain',
            timestamp: new Date(user.verificationData.verificationDate),
            icon: ShieldCheckIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            href: '/identity'
          });
        }
        
        // Add profile update activity if user has been updated recently
        if (user?.updatedAt) {
          const updatedAt = new Date(user.updatedAt);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          if (updatedAt > oneDayAgo) {
            activities.push({
              id: 'profile-update',
              type: 'profile_updated',
              title: 'Profile Updated',
              description: 'Your profile information was updated',
              timestamp: updatedAt,
              icon: UserIcon,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100',
              href: '/profile'
            });
          }
        }
        
        // Sort activities by timestamp (most recent first) and take the latest 10
        activities.sort((a, b) => b.timestamp - a.timestamp);
        activities = activities.slice(0, 10);
        
        setRecentActivities(activities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setRecentActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchRecentActivities();
  }, [user?.identityVerified, user?.verificationData?.verificationDate]);

  // Helper function to format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

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
      <div className="bg-white dark:bg-[#23272f] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Hello, {user?.firstName}!
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
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
          <div key={stat.name} className="bg-white dark:bg-[#23272f] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={stat.href}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
              >
                View Details
                <ArrowRightIcon className="inline h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-[#23272f] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`relative rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${action.color} rounded-md p-2`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
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
      <div className="bg-white dark:bg-[#23272f] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {activitiesLoading ? (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-5 w-5 mr-3 animate-spin" />
              <span className="text-sm">Loading recent activities...</span>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">No recent activity yet.</span>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <Link
                key={activity.id}
                to={activity.href}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2f3b] transition-colors duration-200"
              >
                <div className={`flex-shrink-0 ${activity.bgColor} rounded-full p-2`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))
          )}
          {recentActivities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/documents"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
              >
                View All Activities
                <ArrowRightIcon className="inline h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Blockchain Status */}
      <div className="bg-white dark:bg-[#23272f] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Blockchain Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#232c3a] rounded-lg transition-colors duration-200">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Network</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Sepolia Testnet</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#232c3a] rounded-lg transition-colors duration-200">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Wallet Address</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
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