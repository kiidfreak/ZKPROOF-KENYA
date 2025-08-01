import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ForumNew = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('General');
  const [pinned, setPinned] = useState(false);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      if (user?.isAdmin) {
        formData.append('pinned', pinned);
      }
      files.forEach(file => formData.append('attachments', file));
      const res = await axios.post('/api/forum/posts', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate(`/forum/${res.data.post._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-[#23272f] rounded-lg shadow border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-blue-100 mb-4">New Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <label className="form-label text-gray-100">Title</label>
            <input
              type="text"
              className="form-input bg-[#181a20] border-gray-700 text-blue-100 placeholder-gray-400 w-full"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="form-label text-gray-100">Content</label>
            <textarea
              className="form-input bg-[#181a20] border-gray-700 text-blue-100 placeholder-gray-400 w-full"
              rows={8}
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="form-label text-gray-100">Category</label>
            <select
              className="form-input bg-[#181a20] border-gray-700 text-blue-100 w-full"
              value={category}
              onChange={e => setCategory(e.target.value)}
              disabled={loading}
              required
            >
              <option value="General">General</option>
              <option value="Q&A">Q&amp;A</option>
              <option value="Announcement">Announcement</option>
              <option value="Discussion">Discussion</option>
              <option value="Feedback">Feedback</option>
            </select>
          </div>
          {user?.isAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={pinned}
                onChange={e => setPinned(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="pinned" className="text-gray-100">Pin as announcement</label>
            </div>
          )}
          <div>
            <label className="form-label text-gray-100">Attachments <span className="text-gray-400">(optional, up to 5 files)</span></label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="form-input bg-[#181a20] border-gray-700 text-blue-100 w-full"
            />
            {files.length > 0 && (
              <ul className="mt-2 text-xs text-gray-400 list-disc list-inside">
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
            {files.length === 0 && (
              <div className="mt-2 text-xs text-gray-500">You can create a post without uploading files.</div>
            )}
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForumNew; 