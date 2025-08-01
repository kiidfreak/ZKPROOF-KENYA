import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Forum = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportingId, setReportingId] = useState(null);
  const [reportedIds, setReportedIds] = useState([]);

  useEffect(() => {
    let url = '/api/forum/posts';
    const params = [];
    if (sort === 'comments') params.push('sort=comments');
    if (categoryFilter !== 'All') params.push('category=' + encodeURIComponent(categoryFilter));
    if (params.length) url += '?' + params.join('&');
    setLoading(true);
    axios.get(url)
      .then(res => setPosts(res.data.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line
  }, [sort, categoryFilter]);

  // Filter and sort posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = categoryFilter === 'All' || post.category === categoryFilter;
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === 'comments') return (b.comments?.length || 0) - (a.comments?.length || 0);
    return 0;
  });

  // Popular posts (5+ comments)
  const popularPosts = sortedPosts.filter(post => post.commentCount >= 5);

  const handleReport = async (postId) => {
    setReportingId(postId);
    try {
      await axios.post(`/api/forum/posts/${postId}/report`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReportedIds(prev => [...prev, postId]);
      toast.success('Reported!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report');
    } finally {
      setReportingId(null);
    }
  };

  // Filter out blinded posts for non-admins
  const visiblePosts = sortedPosts.filter(post => !post.blinded || user?.isAdmin);

  return (
    <div className="w-full min-h-screen py-8 px-4">
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex flex-1 gap-2">
          <select
            className="form-input bg-[#181a20] border-gray-700 text-blue-100 h-8 px-2 py-1 text-sm rounded"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="General">General</option>
            <option value="Q&A">Q&amp;A</option>
            <option value="Announcement">Announcement</option>
            <option value="Discussion">Discussion</option>
            <option value="Feedback">Feedback</option>
          </select>
          <input
            type="text"
            className="form-input bg-[#181a20] border-gray-700 text-blue-100 placeholder-gray-400 h-8 px-3 py-1 text-sm rounded"
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-input bg-[#181a20] border-gray-700 text-blue-100 h-8 px-2 py-1 text-sm rounded"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="comments">Popular</option>
          </select>
        </div>
        <button
          className="btn-primary h-8 px-4 text-sm"
          onClick={() => navigate('/forum/new')}
        >
          New Post
        </button>
      </div>
      <div className="bg-[#23272f] rounded-lg shadow border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Author</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Comments</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : visiblePosts.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No visible posts.</td></tr>
            ) : (
              visiblePosts.map(post => (
                <tr key={post._id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-2">
                    <Link to={`/forum/${post._id}`} className="text-blue-400 hover:underline font-medium">
                      {post.title}
                      {post.pinned && <span className="ml-2 px-2 py-0.5 rounded bg-yellow-600 text-xs text-white border border-yellow-400">Pinned</span>}
                      {post.commentCount >= 5 && <span className="ml-2 px-2 py-0.5 rounded bg-pink-600 text-xs text-white border border-pink-400">Popular</span>}
                      {post.blinded && user?.isAdmin && <span className="ml-2 px-2 py-0.5 rounded bg-red-600 text-xs text-white border border-red-400">Blinded</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-200">{post.author?.firstName} {post.author?.lastName}</td>
                  <td className="px-4 py-2 text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-gray-300 flex items-center gap-2">
                    {post.commentCount}
                    {user && post.author?._id !== user.id && !user.isAdmin && !post.blinded && !reportedIds.includes(post._id) && (
                      <button className="btn-danger btn-xs ml-2" onClick={() => handleReport(post._id)} disabled={reportingId === post._id}>
                        {reportingId === post._id ? 'Reporting...' : 'Report'}
                      </button>
                    )}
                    {user && reportedIds.includes(post._id) && <span className="ml-2 text-xs text-pink-400">Reported</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {popularPosts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-yellow-400 mb-2">Popular Posts</h2>
          <div className="bg-[#23272f] rounded-lg shadow border border-yellow-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Author</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Comments</th>
                </tr>
              </thead>
              <tbody>
                {popularPosts.map(post => (
                  <tr key={post._id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-2">
                      <Link to={`/forum/${post._id}`} className="text-blue-400 hover:underline font-medium">
                        {post.title}
                        <span className="ml-2 px-2 py-0.5 rounded bg-pink-600 text-xs text-white border border-pink-400">Popular</span>
                        {post.pinned && <span className="ml-2 px-2 py-0.5 rounded bg-yellow-600 text-xs text-white border border-yellow-400">Pinned</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-200">{post.author?.firstName} {post.author?.lastName}</td>
                    <td className="px-4 py-2 text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-gray-300">{post.commentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum; 