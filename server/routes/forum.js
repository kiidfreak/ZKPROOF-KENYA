const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer setup for forum attachments
const forumStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/forum/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `forum-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const uploadForum = multer({ storage: forumStorage });

// List all posts (with optional category filter and sort)
router.get('/posts', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    let posts = await Post.find(filter)
      .populate('author', 'firstName lastName email')
      .populate('comments')
      .lean();
    // Add comment count
    posts.forEach(post => {
      post.commentCount = post.comments ? post.comments.length : 0;
    });
    // Sort
    if (req.query.sort === 'comments') {
      posts.sort((a, b) => b.commentCount - a.commentCount || b.pinned - a.pinned || new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      posts.sort((a, b) => b.pinned - a.pinned || new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get post detail
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'firstName lastName email' },
        options: { sort: { createdAt: 1 } }
      });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create a new post (with attachments)
router.post('/posts', authenticate, uploadForum.array('attachments', 5), [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').optional().isString().trim(),
  body('pinned').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }
  try {
    if (req.body.pinned && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can pin posts' });
    }
    const attachments = (req.files || []).map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.user._id,
      category: req.body.category || 'General',
      pinned: req.body.pinned || false,
      attachments
    });
    await post.save();
    await post.populate('author', 'firstName lastName email');
    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Add a comment to a post
router.post('/posts/:id/comments', authenticate, [
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comment = new Comment({
      content: req.body.content,
      author: req.user._id,
      post: post._id
    });
    await comment.save();
    post.comments.push(comment._id);
    await post.save();
    await comment.populate('author', 'firstName lastName email');
    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Edit a post
router.patch('/posts/:id', authenticate, [
  body('title').optional().notEmpty().withMessage('Title is required'),
  body('content').optional().notEmpty().withMessage('Content is required'),
  body('category').optional().isString().trim(),
  body('pinned').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not the author of this post' });
    }
    if (typeof req.body.pinned === 'boolean' && req.body.pinned !== post.pinned && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can pin/unpin posts' });
    }
    if (req.body.title) post.title = req.body.title;
    if (req.body.content) post.content = req.body.content;
    if (req.body.category) post.category = req.body.category;
    if (typeof req.body.pinned === 'boolean') post.pinned = req.body.pinned;
    await post.save();
    await post.populate('author', 'firstName lastName email');
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Pin/unpin a post (admins only)
router.patch('/posts/:id/pin', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can pin/unpin posts' });
    }
    post.pinned = !post.pinned;
    await post.save();
    res.json({ pinned: post.pinned });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

// Delete a post
router.delete('/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Edit a comment
router.patch('/posts/:postId/comments/:commentId', authenticate, [
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not the author of this comment' });
    }
    comment.content = req.body.content;
    await comment.save();
    await comment.populate('author', 'firstName lastName email');
    res.json({ comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
router.delete('/posts/:postId/comments/:commentId', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not the author of this comment' });
    }
    await comment.deleteOne();
    // Remove comment from post's comments array
    await Post.findByIdAndUpdate(req.params.postId, { $pull: { comments: comment._id } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Delete an attachment from a post
router.delete('/posts/:postId/attachments/:filename', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not the author of this post' });
    }
    const fileIdx = post.attachments.findIndex(f => f.filename === req.params.filename);
    if (fileIdx === -1) return res.status(404).json({ error: 'File not found' });
    const filePath = `uploads/forum/${req.params.filename}`;
    // Remove file from filesystem
    fs.unlink(filePath, err => {
      // Ignore error if file doesn't exist
    });
    // Remove from attachments array
    post.attachments.splice(fileIdx, 1);
    await post.save();
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Secure download route for forum attachments
router.get('/files/:filename', async (req, res) => {
  try {
    const post = await Post.findOne({ 'attachments.filename': req.params.filename });
    if (!post) return res.status(404).json({ error: 'File not found' });
    const file = post.attachments.find(f => f.filename === req.params.filename);
    if (!file) return res.status(404).json({ error: 'File not found' });
    const filePath = path.join('uploads/forum', file.filename);
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename=\"${file.originalname}\"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Report a post
router.post('/posts/:id/report', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.reports.includes(req.user._id)) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }
    post.reports.push(req.user._id);
    if (post.reports.length >= 3) post.blinded = true;
    await post.save();
    res.json({ message: post.blinded ? 'Post has been blinded' : 'Post reported' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to report post' });
  }
});

// Report a comment
router.post('/posts/:postId/comments/:commentId/report', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.reports.includes(req.user._id)) {
      return res.status(400).json({ error: 'You have already reported this comment' });
    }
    comment.reports.push(req.user._id);
    if (comment.reports.length >= 3) comment.blinded = true;
    await comment.save();
    res.json({ message: comment.blinded ? 'Comment has been blinded' : 'Comment reported' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to report comment' });
  }
});

// Like a post
router.post('/posts/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ error: 'You have already liked this post' });
    }
    post.likes.push(req.user._id);
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Unlike a post
router.post('/posts/:id/unlike', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.likes = post.likes.filter(uid => uid.toString() !== req.user._id.toString());
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// Like a comment
router.post('/posts/:postId/comments/:commentId/like', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.likes.includes(req.user._id)) {
      return res.status(400).json({ error: 'You have already liked this comment' });
    }
    comment.likes.push(req.user._id);
    await comment.save();
    res.json({ likes: comment.likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Unlike a comment
router.post('/posts/:postId/comments/:commentId/unlike', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    comment.likes = comment.likes.filter(uid => uid.toString() !== req.user._id.toString());
    await comment.save();
    res.json({ likes: comment.likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlike comment' });
  }
});

module.exports = router; 