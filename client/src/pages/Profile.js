import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    profile: {
      bio: user?.profile?.bio || '',
      company: user?.profile?.company || '',
      position: user?.profile?.position || ''
    }
  });
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editPostId, setEditPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editError, setEditError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile updated!');
      } else {
        toast.error('Failed to update profile.');
      }
    } catch (error) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 내 게시글 불러오기
    const fetchMyPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await axios.get('/api/forum/posts');
        // 본인이 작성한 글만 필터링
        setMyPosts(res.data.posts.filter(post => post.author?._id === user.id));
      } catch (e) {
        setMyPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchMyPosts();
  }, [user.id]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await axios.delete(`/api/forum/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMyPosts(myPosts.filter(p => p._id !== postId));
    } catch (e) {
      alert('Failed to delete post');
    }
  };

  const startEdit = (post) => {
    setEditPostId(post._id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category || 'General');
    setEditError('');
  };

  const cancelEdit = () => {
    setEditPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditCategory('General');
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError('Title and content are required.');
      return;
    }
    try {
      await axios.patch(`/api/forum/posts/${editPostId}`, {
        title: editTitle,
        content: editContent,
        category: editCategory
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMyPosts(myPosts.map(p => p._id === editPostId ? { ...p, title: editTitle, content: editContent, category: editCategory } : p));
      cancelEdit();
    } catch (e) {
      setEditError(e.response?.data?.error || 'Failed to update post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center">
          <UserIcon className="h-8 w-8 text-blue-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Profile</h1>
            <p className="text-gray-300">Manage your personal information and settings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Personal Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="form-label text-gray-100">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input bg-[#232c3a] border-gray-700 text-gray-100 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="form-label text-gray-100">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input bg-[#232c3a] border-gray-700 text-gray-100 placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="form-label text-gray-100">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input bg-[#232c3a] border-gray-700 text-gray-100 placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="profile.bio" className="form-label text-gray-100">Bio</label>
                <textarea
                  id="profile.bio"
                  name="profile.bio"
                  rows={3}
                  value={formData.profile.bio}
                  onChange={handleChange}
                  className="form-input bg-[#232c3a] border-gray-700 text-gray-100 placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">A short introduction about yourself (optional). This will be visible to other users.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile.company" className="form-label text-gray-100">Company</label>
                  <input
                    type="text"
                    id="profile.company"
                    name="profile.company"
                    value={formData.profile.company}
                    onChange={handleChange}
                    className="form-input bg-[#232c3a] border-gray-700 text-gray-100 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="profile.position" className="form-label text-gray-100">Position</label>
                  <input
                    type="text"
                    id="profile.position"
                    name="profile.position"
                    value={formData.profile.position}
                    onChange={handleChange}
                    className="form-input bg-[#232c3a] border-gray-700 text-gray-100 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Info */}
        <div className="space-y-6">
          <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-300">Email</label>
                <p className="text-sm text-gray-100">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Full Name</label>
                <p className="text-sm text-gray-100">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Phone Number</label>
                <p className="text-sm text-gray-100">{user?.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Wallet Address</label>
                <p className="text-sm text-gray-100 font-mono">
                  {user?.walletAddress ? 
                    `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 
                    'Generating...'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Joined</label>
                <p className="text-sm text-gray-100">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Identity Verification</h2>
            <div className="flex items-center">
              <ShieldCheckIcon className={`h-5 w-5 mr-2 ${
                user?.identityVerified ? 'text-green-500' : 'text-yellow-500'
              }`} />
              <span className={`text-sm font-medium ${
                user?.identityVerified ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {user?.identityVerified ? 'Completed' : 'Not Completed'}
              </span>
            </div>
            {!user?.identityVerified && (
              <p className="text-sm text-gray-300 mt-2">
                Please complete identity verification for electronic document signing.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 