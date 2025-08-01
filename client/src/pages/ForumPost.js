import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const HeartIcon = ({ filled, className }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
    />
  </svg>
);

const ForumPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editCommentError, setEditCommentError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [editCategory, setEditCategory] = useState('General');
  const [editPinned, setEditPinned] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState(null);
  const [reportingPost, setReportingPost] = useState(false);
  const [reportedPost, setReportedPost] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [reportedComments, setReportedComments] = useState([]);
  const [likingPost, setLikingPost] = useState(false);
  const [likedPost, setLikedPost] = useState(false);
  const [postLikes, setPostLikes] = useState(0);
  const [likingCommentId, setLikingCommentId] = useState(null);
  const [likedComments, setLikedComments] = useState([]);
  const [commentLikes, setCommentLikes] = useState({});
  const [imageModal, setImageModal] = useState({ open: false, src: '', alt: '' });

  const fetchPost = () => {
    setLoading(true);
    axios.get(`/api/forum/posts/${id}`)
      .then(res => setPost(res.data.post))
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (post) {
      setPostLikes(post.likes?.length || 0);
      setLikedPost(user && post.likes?.includes(user.id));
      const commentLikeMap = {};
      const likedArr = [];
      post.comments.forEach(c => {
        commentLikeMap[c._id] = c.likes?.length || 0;
        if (user && c.likes?.includes(user.id)) likedArr.push(c._id);
      });
      setCommentLikes(commentLikeMap);
      setLikedComments(likedArr);
    }
  }, [post, user]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/forum/posts/${id}/comments`, { content: comment }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setComment('');
      fetchPost();
    } catch {
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthor = user && post && user.id === post.author?._id;
  const startEdit = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category || 'General');
    setEditPinned(post.pinned || false);
    setEditError('');
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError('Title and content are required.');
      return;
    }
    try {
      await axios.patch(`/api/forum/posts/${id}`, { title: editTitle, content: editContent, category: editCategory, pinned: editPinned }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEditing(false);
      fetchPost();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update post');
    }
  };
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/forum/posts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate('/forum');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentContent(comment.content);
    setEditCommentError('');
  };
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
    setEditCommentError('');
  };
  const submitEditComment = async (commentId) => {
    if (!editCommentContent.trim()) {
      setEditCommentError('Content is required.');
      return;
    }
    try {
      await axios.patch(`/api/forum/posts/${id}/comments/${commentId}`, { content: editCommentContent }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      cancelEditComment();
      fetchPost();
    } catch (err) {
      setEditCommentError(err.response?.data?.error || 'Failed to update comment');
    }
  };
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      await axios.delete(`/api/forum/posts/${id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchPost();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleDeleteAttachment = async (filename) => {
    if (!window.confirm('Delete this attachment?')) return;
    setDeletingAttachment(filename);
    try {
      await axios.delete(`/api/forum/posts/${id}/attachments/${filename}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchPost();
    } catch (err) {
      alert('Failed to delete attachment');
    } finally {
      setDeletingAttachment(null);
    }
  };

  const handleReportPost = async () => {
    setReportingPost(true);
    try {
      await axios.post(`/api/forum/posts/${id}/report`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReportedPost(true);
      toast.success('Reported!');
      fetchPost();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report');
    } finally {
      setReportingPost(false);
    }
  };

  const handleReportComment = async (commentId) => {
    setReportingCommentId(commentId);
    try {
      await axios.post(`/api/forum/posts/${id}/comments/${commentId}/report`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReportedComments(prev => [...prev, commentId]);
      toast.success('Comment reported!');
      fetchPost();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report');
    } finally {
      setReportingCommentId(null);
    }
  };

  const handleLikePost = async () => {
    setLikingPost(true);
    try {
      if (likedPost) {
        const res = await axios.post(`/api/forum/posts/${id}/unlike`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setPostLikes(res.data.likes);
        setLikedPost(false);
      } else {
        const res = await axios.post(`/api/forum/posts/${id}/like`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setPostLikes(res.data.likes);
        setLikedPost(true);
      }
      fetchPost();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to like');
    } finally {
      setLikingPost(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    setLikingCommentId(commentId);
    try {
      if (likedComments.includes(commentId)) {
        const res = await axios.post(`/api/forum/posts/${id}/comments/${commentId}/unlike`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setCommentLikes(likes => ({ ...likes, [commentId]: res.data.likes }));
        setLikedComments(liked => liked.filter(cid => cid !== commentId));
      } else {
        const res = await axios.post(`/api/forum/posts/${id}/comments/${commentId}/like`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setCommentLikes(likes => ({ ...likes, [commentId]: res.data.likes }));
        setLikedComments(liked => [...liked, commentId]);
      }
      fetchPost();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to like');
    } finally {
      setLikingCommentId(null);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-400">{error}</div>;
  if (!post) return null;

  return (
    <div className="max-w-screen-2xl w-full mx-auto py-8 px-2">
      <div className="bg-[#23272f] rounded-lg shadow border border-gray-700 p-10 mb-10">
        {editing ? (
          <form onSubmit={handleEdit} className="space-y-4">
            <input
              type="text"
              className="form-input bg-[#181a20] border-gray-700 text-blue-100 placeholder-gray-400 w-full"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              disabled={deleting}
            />
            <textarea
              className="form-input bg-[#181a20] border-gray-700 text-blue-100 placeholder-gray-400 w-full"
              rows={8}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              disabled={deleting}
            />
            <div>
              <label className="form-label text-gray-100">Category</label>
              <select
                className="form-input bg-[#181a20] border-gray-700 text-blue-100 w-full"
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
                disabled={deleting}
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
                  id="editPinned"
                  checked={editPinned}
                  onChange={e => setEditPinned(e.target.checked)}
                  disabled={deleting}
                />
                <label htmlFor="editPinned" className="text-gray-100">Pin as announcement</label>
              </div>
            )}
            {editError && <div className="text-red-400 text-sm">{editError}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={deleting}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={deleting}>Save</button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-blue-100 mb-2 flex items-center gap-3">
              {post.title}
              <span className="px-2 py-0.5 rounded bg-blue-900 text-xs text-blue-200 border border-blue-700">{post.category}</span>
              {post.pinned && <span className="px-2 py-0.5 rounded bg-yellow-600 text-xs text-white border border-yellow-400">Pinned</span>}
            </h2>
            <div className="text-sm text-gray-400 mb-4">
              By {post.author?.firstName} {post.author?.lastName} · {new Date(post.createdAt).toLocaleDateString()}
            </div>
            {post.blinded && !user?.isAdmin ? (
              <div className="text-red-400 font-semibold mb-4">This post has been blinded due to multiple reports.</div>
            ) : (
              <>
                <div className="text-gray-200 whitespace-pre-line mb-2">{post.content}</div>
                {post.attachments && post.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-blue-200 mb-2">Attachments</h4>
                    <ul className="space-y-2">
                      {post.attachments.map((file, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          {file.mimetype && file.mimetype.startsWith('image') ? (
                            <button
                              type="button"
                              className="p-0 border-none bg-transparent"
                              onClick={() => setImageModal({ open: true, src: `/api/forum/files/${file.filename}`, alt: file.originalname })}
                            >
                              <img src={`/api/forum/files/${file.filename}`} alt={file.originalname} className="w-16 h-16 object-cover rounded border border-gray-700" />
                            </button>
                          ) : file.mimetype === 'application/pdf' ? (
                            <a href={`/api/forum/files/${file.filename}`} target="_blank" rel="noopener noreferrer">
                              <span className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded border border-gray-700 text-xs text-gray-400">PDF</span>
                            </a>
                          ) : (
                            <span className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded border border-gray-700 text-xs text-gray-400">{file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                          )}
                          <div className="flex-1">
                            <a href={`/api/forum/files/${file.filename}`} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">
                              {file.originalname}
                            </a>
                            <span className="ml-2 text-xs text-gray-500">({(file.size/1024).toFixed(1)} KB)</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {/* Image Modal */}
                    {imageModal.open && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setImageModal({ open: false, src: '', alt: '' })}>
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <img src={imageModal.src} alt={imageModal.alt} className="max-w-[90vw] max-h-[80vh] rounded shadow-lg" />
                          <button className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 text-white rounded-full px-3 py-1 text-lg" onClick={() => setImageModal({ open: false, src: '', alt: '' })}>&times;</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {editing && post.attachments && post.attachments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-blue-200 mb-2">Current Attachments</h4>
                    <ul className="space-y-2">
                      {post.attachments.map((file, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          {file.mimetype && file.mimetype.startsWith('image') ? (
                            <a href={`/api/forum/files/${file.filename}`} target="_blank" rel="noopener noreferrer">
                              <img src={`/api/forum/files/${file.filename}`} alt={file.originalname} className="w-12 h-12 object-cover rounded border border-gray-700" />
                            </a>
                          ) : (
                            <span className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded border border-gray-700 text-xs text-gray-400">{file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                          )}
                          <div className="flex-1">
                            <a href={`/api/forum/files/${file.filename}`} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">
                              {file.originalname}
                            </a>
                            <span className="ml-2 text-xs text-gray-500">({(file.size/1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            className="btn-danger btn-xs"
                            onClick={() => handleDeleteAttachment(file.filename)}
                            disabled={deletingAttachment === file.filename}
                          >
                            {deletingAttachment === file.filename ? 'Deleting...' : 'Delete'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {isAuthor && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn-secondary btn-xs text-xs px-2 py-1" onClick={startEdit} disabled={deleting}>Edit</button>
                    <button className="btn-danger btn-xs text-xs px-2 py-1" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
                  </div>
                )}
                {user && !isAuthor && !user.isAdmin && !post.blinded && !reportedPost && (
                  <button className="btn-danger btn-xs ml-2" onClick={handleReportPost} disabled={reportingPost}>
                    {reportingPost ? 'Reporting...' : 'Report'}
                  </button>
                )}
                {user && reportedPost && <span className="ml-2 text-xs text-pink-400">Reported</span>}
                <div className="flex items-center gap-2 mt-4">
                  <button className={`btn-xs ${likedPost ? 'bg-pink-600 text-white' : 'bg-gray-700 text-pink-300'} rounded`} onClick={handleLikePost} disabled={likingPost || !user}>
                    {likedPost ? 'Unlike' : 'Like'}
                  </button>
                  <span className="text-pink-400 font-semibold">{postLikes}</span>
                  {postLikes >= 5 && <span className="ml-2 px-2 py-0.5 rounded bg-pink-600 text-xs text-white border border-pink-400">Popular</span>}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <div className="bg-[#232c3a] rounded-xl border border-gray-800 p-8 mt-10">
        <h3 className="text-lg font-semibold text-blue-100 mb-4">Comments ({post.comments.length})</h3>
        {post.comments.length === 0 ? (
          <div className="text-gray-400 mb-4">No comments yet.</div>
        ) : (
          <ul className="mb-4">
            {post.comments.map((c, idx) => {
              const isCommentAuthor = user && c.author?._id === user.id;
              return (
                <li key={c._id} className={"py-2 " + (idx !== post.comments.length - 1 ? "border-b border-gray-700" : "")}>
                  <div className="text-sm text-gray-300 mb-1">{c.author?.firstName} {c.author?.lastName} · {new Date(c.createdAt).toLocaleDateString()}</div>
                  {c.blinded && !user?.isAdmin ? (
                    <div className="text-red-400 font-semibold">This comment has been blinded due to multiple reports.</div>
                  ) : (
                    <>
                      {editingCommentId === c._id ? (
                        <>
                          <textarea
                            className="form-input bg-[#181a20] border-gray-700 text-blue-100 placeholder-gray-400 w-full mb-2"
                            rows={3}
                            value={editCommentContent}
                            onChange={e => setEditCommentContent(e.target.value)}
                            disabled={deletingCommentId === c._id}
                          />
                          {editCommentError && <div className="text-red-400 text-sm mb-2">{editCommentError}</div>}
                          <div className="flex gap-2">
                            <button className="btn-secondary btn-xs text-xs px-2 py-1" onClick={cancelEditComment} disabled={deletingCommentId === c._id}>Cancel</button>
                            <button className="btn-primary btn-xs text-xs px-2 py-1" onClick={() => submitEditComment(c._id)} disabled={deletingCommentId === c._id}>Save</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-gray-100 whitespace-pre-line">{c.content}</div>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              className={`btn-xs text-xs p-1 h-6 w-6 flex items-center justify-center ${likedComments.includes(c._id) ? 'bg-pink-600 text-white' : 'bg-gray-700 text-pink-300'} rounded-full`}
                              onClick={() => handleLikeComment(c._id)}
                              disabled={likingCommentId === c._id || !user}
                              title={likedComments.includes(c._id) ? 'Unlike' : 'Like'}
                            >
                              <HeartIcon filled={likedComments.includes(c._id)} className="h-4 w-4" />
                            </button>
                            <span className="text-pink-400 font-semibold text-xs">{commentLikes[c._id] || 0}</span>
                            {commentLikes[c._id] >= 5 && <span className="ml-2 px-2 py-0.5 rounded bg-pink-600 text-xs text-white border border-pink-400">Popular</span>}
                          </div>
                          {isCommentAuthor && (
                            <div className="flex gap-2 mt-1">
                              <button className="btn-secondary btn-xs text-xs px-2 py-1" onClick={() => handleEditComment(c)} disabled={deletingCommentId === c._id}>Edit</button>
                              <button className="btn-danger btn-xs text-xs px-2 py-1" onClick={() => handleDeleteComment(c._id)} disabled={deletingCommentId === c._id}>{deletingCommentId === c._id ? 'Deleting...' : 'Delete'}</button>
                            </div>
                          )}
                          {user && c.author?._id !== user.id && !user.isAdmin && !c.blinded && !reportedComments.includes(c._id) && (
                            <button className="btn-danger btn-xs ml-2" onClick={() => handleReportComment(c._id)} disabled={reportingCommentId === c._id}>
                              {reportingCommentId === c._id ? 'Reporting...' : 'Report'}
                            </button>
                          )}
                          {user && reportedComments.includes(c._id) && <span className="ml-2 text-xs text-pink-400">Reported</span>}
                        </>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {user && (
          <form onSubmit={handleComment} className="flex items-end gap-2 mt-2 bg-[#181a20] rounded-xl p-3 shadow border border-gray-700">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-base select-none">
              {user.firstName?.charAt(0)}
            </div>
            <div className="flex-1">
              <textarea
                className="w-full resize-none bg-[#232c3a] border border-gray-700 rounded-lg px-3 py-1.5 text-blue-100 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition min-h-[36px] text-sm"
                rows={1}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                disabled={submitting}
                style={{lineHeight: '1.5'}}
              />
            </div>
            <button
              type="submit"
              className="ml-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !comment.trim()}
              title="Post Comment"
            >
              {submitting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
              )}
            </button>
          </form>
        )}
        {!user && <div className="text-gray-400 mt-2">Login to add a comment.</div>}
      </div>
    </div>
  );
};

export default ForumPost; 