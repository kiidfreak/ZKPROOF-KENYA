import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  LockClosedIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      name: 'Blockchain Identity Verification',
      description: 'A secure and verifiable blockchain-based identity verification system',
      icon: ShieldCheckIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Electronic Document Signing',
      description: 'Secure digital signatures stored on the blockchain',
      icon: DocumentTextIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Security & Privacy',
      description: 'Top-level encryption and data protection',
      icon: LockClosedIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Global Standard',
      description: 'Identity verification system compliant with international standards',
      icon: GlobeAltIcon,
      color: 'bg-orange-500'
    }
  ];

  const benefits = [
    'Blockchain-based identity verification that cannot be tampered with',
    'Real-time signature verification and history tracking',
    'Security enhancement with multi-signature support',
    'Mobile-friendly interface',
    'Compliance with international standards (eIDAS, ISO)',
    '24/7 system monitoring and support'
  ];

  return (
    <div className="bg-[#181c2a] min-h-screen text-gray-100">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold text-gray-100">BKC Verify</span>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="btn-primary"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-gray-300 hover:text-gray-100 font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="btn-primary"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero section */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-100 sm:text-5xl md:text-6xl">
              <span className="block">Blockchain-based</span>
              <span className="block text-blue-400">Identity Verification & Electronic Document Signing</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              A platform that leverages blockchain technology for secure identity verification and electronic document signing. It provides tamper-proof digital identity certificates and secure electronic signatures.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              {!user && (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-3"
                  >
                    Start for Free
                  </Link>
                  <Link
                    to="/login"
                    className="btn-secondary text-lg px-8 py-3"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 bg-[#23272f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-100 sm:text-4xl">
              Key Features
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Innovative identity verification and electronic document signing system leveraging blockchain technology
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="bg-[#232c3a] card text-center border border-gray-700">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-100">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits section */}
      <div className="py-24 bg-[#23272f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-100 sm:text-4xl">
                Why Choose BKC Verify?
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                We provide a secure and reliable identity verification and electronic document signing service by leveraging the advantages of blockchain technology.
              </p>
              <div className="mt-8">
                <div className="grid grid-cols-1 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                      <span className="text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              {!user && (
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="btn-primary inline-flex items-center"
                  >
                    Start Now
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="text-center">
                <ShieldCheckIcon className="mx-auto h-16 w-16 text-blue-400" />
                <h3 className="mt-4 text-xl font-medium text-gray-100">
                  Blockchain Security
                </h3>
                <p className="mt-2 text-gray-300">
                  All identity verification and signing data are securely stored on the blockchain, making it impossible to tamper with and can be verified at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      {!user && (
        <div className="bg-blue-900">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Start Now
              </h2>
              <p className="mt-4 text-lg text-blue-200">
                Experience the blockchain-based identity verification and electronic document signing system for free.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <Link
                  to="/register"
                  className="bg-[#23272f] text-blue-100 px-8 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Free Registration
                </Link>
                <Link
                  to="/login"
                  className="border border-gray-700 text-blue-100 px-8 py-3 rounded-lg font-medium hover:bg-gray-700 hover:text-blue-200 transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#181c2a]">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold text-white">BKC Verify</span>
            </div>
            <p className="mt-4 text-gray-400">
              Blockchain-based identity verification and electronic document signing system
            </p>
            <p className="mt-2 text-sm text-gray-500">
              © 2024 BKC Verify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 