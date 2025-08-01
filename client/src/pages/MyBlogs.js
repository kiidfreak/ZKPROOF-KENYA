import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const MyBlogs = () => {
  const { user } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editPostId, setEditPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchMyPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await axios.get('/api/forum/posts');
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
    <div className="max-w-screen-xl mx-auto py-12 px-2 sm:px-6 lg:px-8">
      <div className="bg-[#23272f] rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-blue-100 mb-6">My Blogs</h2>
        {loadingPosts ? (
          <div className="text-gray-400">Loading...</div>
        ) : myPosts.length === 0 ? (
          <div className="text-gray-400">No posts found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {myPosts.map(post => (
              <div key={post._id} className="bg-[#181a20] border border-gray-700 rounded-xl p-5 flex flex-col justify-between shadow-md min-h-[180px]">
                {editPostId === post._id ? (
                  <form onSubmit={handleEditSubmit} className="space-y-2 flex-1 flex flex-col">
                    <input
                      className="form-input bg-[#23272f] border-gray-700 text-blue-100 w-full"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      required
                    />
                    <textarea
                      className="form-input bg-[#23272f] border-gray-700 text-blue-100 w-full"
                      rows={4}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      required
                    />
                    <select
                      className="form-input bg-[#23272f] border-gray-700 text-blue-100 w-full"
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Q&A">Q&amp;A</option>
                      <option value="Announcement">Announcement</option>
                      <option value="Discussion">Discussion</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                    {editError && <div className="text-red-400 text-sm">{editError}</div>}
                    <div className="flex gap-2 justify-end items-center mt-2 min-h-[2.5rem]">
                      <button type="button" className="btn-secondary btn-xs h-7 px-3 flex items-center justify-center leading-none" onClick={cancelEdit}>Cancel</button>
                      <button type="submit" className="btn-primary btn-xs h-7 px-3 flex items-center justify-center leading-none">Save</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-blue-100 text-lg truncate" title={post.title}>{post.title}</div>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700 ml-2">{post.category}</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{new Date(post.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-200 mb-4 line-clamp-3 min-h-[3.5em]">{post.content}</div>
                    </div>
                    <div className="flex gap-2 justify-end items-center mt-2 min-h-[2.5rem]">
                      <button className="btn-secondary btn-xs h-7 px-3 flex items-center justify-center leading-none" onClick={() => startEdit(post)}>Edit</button>
                      <button className="btn-danger btn-xs h-7 px-3 flex items-center justify-center leading-none" onClick={() => handleDelete(post._id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBlogs; 