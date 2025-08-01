const express = require('express');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 1:1 메시지 목록 조회 (본인과 상대방 간)
router.get('/messages/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  const myId = req.user._id;
  // 내게 온 메시지 중 아직 읽지 않은 것들 읽음 처리
  await Message.updateMany({ from: userId, to: myId, read: false }, { $set: { read: true, readAt: new Date() } });
  const messages = await Message.find({
    $or: [
      { from: myId, to: userId },
      { from: userId, to: myId }
    ]
  }).sort({ timestamp: 1 });
  res.json({ messages });
});

// 메시지 전송
router.post('/messages/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  const myId = req.user._id;
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }
  const message = await Message.create({
    from: myId,
    to: userId,
    content
  });
  res.json({ message });
});

// 메시지 삭제 (본인만)
router.delete('/messages/:messageId', authenticate, async (req, res) => {
  const { messageId } = req.params;
  const myId = req.user._id;
  const msg = await Message.findById(messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.from.toString() !== myId.toString()) {
    return res.status(403).json({ error: 'You can only delete your own messages.' });
  }
  await msg.deleteOne();
  res.json({ message: 'Message deleted' });
});

module.exports = router; 