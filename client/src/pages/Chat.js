import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { chatAPI } from '../services/api';
import { UserIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected, emit, on, off } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // 유저 목록 불러오기
  useEffect(() => {
    fetch('/api/auth/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setUsers(data.users.filter(u => u.id !== user.id)));
  }, [user]);

  // Real-time message handling
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming private messages
    const handlePrivateMessage = (data) => {
      console.log('Received real-time message:', data);
      
      // Add message to current chat if it's from the selected user
      if (selectedUser && data.from === selectedUser.id) {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(), // Temporary ID
          from: data.from,
          to: user.id,
          content: data.message,
          timestamp: data.timestamp,
          read: false
        }]);
        
        // Show notification if chat is not focused
        if (document.hidden) {
          toast.success(`New message from ${selectedUser.firstName} ${selectedUser.lastName}`);
        }
      }
    };

    // Listen for online/offline status updates
    const handleUserStatus = (data) => {
      if (data.type === 'online') {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      } else if (data.type === 'offline') {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    on('private_message', handlePrivateMessage);
    on('user_status', handleUserStatus);

    return () => {
      off('private_message', handlePrivateMessage);
      off('user_status', handleUserStatus);
    };
  }, [socket, selectedUser, user.id, on, off]);

  // 상대방 선택 시 메시지 불러오기
  useEffect(() => {
    if (selectedUser) {
      chatAPI.getMessages(selectedUser.id)
        .then(res => setMessages(res.data.messages))
        .catch(() => setMessages([]));
    }
  }, [selectedUser]);

  // 메시지 전송
  const sendMessage = async () => {
    if (selectedUser && input.trim()) {
      try {
        // Send via HTTP API (for persistence)
        const res = await chatAPI.sendMessage(selectedUser.id, input);
        const newMessage = res.data.message;
        
        // Add to local messages immediately
        setMessages((prev) => [...prev, newMessage]);
        setInput('');
        
        // Send real-time message via socket
        if (isConnected) {
          emit('private_message', {
            to: selectedUser.id,
            message: input
          });
        }
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message. Please try again.');
      }
    }
  };

  // 메시지 삭제
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatAPI.deleteMessage(msgId);
      setMessages((prev) => prev.filter(m => m._id !== msgId));
    } catch (e) {
      alert('Failed to delete message');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[80vh] bg-[#181a20] rounded-lg overflow-hidden border border-gray-700 shadow-lg">
      {/* 유저 목록 */}
      <div className="w-1/4 bg-[#23272f] p-4 border-r border-gray-700 flex flex-col">
        <h2 className="text-lg text-blue-100 mb-4 font-semibold">Users</h2>
        <ul className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <li className="text-gray-400 text-sm">No other users online.</li>
          ) : (
            users.map(u => (
              <li key={u.id}
                  className={`flex items-center gap-3 p-2 mb-2 cursor-pointer rounded transition-colors duration-150 ${selectedUser?.id === u.id ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-gray-700'}`}
                  onClick={() => setSelectedUser(u)}>
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{u.firstName?.charAt(0)}</span>
                  </div>
                  {/* Online status indicator */}
                  <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-800 ${
                    onlineUsers.has(u.id) ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <span className="font-medium flex items-center gap-1 min-w-[90px]">
                  {u.firstName} {u.lastName}
                  {u.identityVerified && (
                    <span className="ml-1 px-2 py-0.5 rounded bg-green-600 text-xs text-white">Verified</span>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
      {/* 채팅창 */}
      <div className="flex-1 flex flex-col bg-[#23272f]">
        {/* 채팅방 헤더 */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-700 bg-[#232c3a]">
          {/* Connection Status */}
          <div className="absolute top-2 right-4 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {selectedUser ? (
            <div className="w-full">
              <div className="grid grid-cols-4 gap-4 mb-1 text-xs text-gray-400 font-semibold items-center">
                <span className="col-span-1">Name</span>
                <span className="col-span-1">Email</span>
                <span className="col-span-1">Phone</span>
                <span className="col-span-1">Joined</span>
              </div>
              <div className="grid grid-cols-4 gap-4 items-center w-full">
                <span className="col-span-1 font-semibold text-blue-100 flex items-center gap-2">
                  {selectedUser.firstName} {selectedUser.lastName}
                  {selectedUser.identityVerified && (
                    <span className="ml-1 px-2 py-0.5 rounded bg-green-600 text-xs text-white">Verified</span>
                  )}
                </span>
                <span className="col-span-1 text-xs text-gray-400">{selectedUser.email}</span>
                <span className="col-span-1 text-xs text-gray-400">{selectedUser.phone || '-'}</span>
                <span className="col-span-1 text-xs text-gray-400">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 h-full flex items-center">Select a user to start chatting.</div>
          )}
        </div>
        {/* 메시지 영역 */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-2">
          {selectedUser ? (
            messages.length === 0 ? (
              <div className="text-gray-500 text-center mt-10">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.from === user.id || msg.from === user._id;
                // 메시지 전송 성공: 항상 체크, 읽음: 파란 체크
                const isRead = !!msg.read;
                return (
                  <div
                    key={msg._id || i}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    onMouseEnter={() => setHoveredMsgId(msg._id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                  >
                    {!isMe && (
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center mr-2 mt-auto">
                        <span className="text-sm font-medium text-white">{selectedUser.firstName?.charAt(0)}</span>
                      </div>
                    )}
                    <div className={`relative max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-blue-100 rounded-bl-none'}`}>
                      <div className="whitespace-pre-line break-words">{msg.content}</div>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs text-gray-300">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        {isMe && (
                          <span className={`ml-1 text-xs flex items-center ${isRead ? 'text-blue-400' : 'text-gray-400'}`}
                                title={isRead ? (msg.readAt ? `Read at ${new Date(msg.readAt).toLocaleTimeString()}` : 'Read') : 'Delivered'}>
                            {/* 유니코드 체크표식 */}
                            ✓
                          </span>
                        )}
                      </div>
                      {/* 삭제 버튼: 내 메시지에 한해, 마우스 오버 시 우상단에 표시 */}
                      {isMe && hoveredMsgId === msg._id && (
                        <button
                          className="absolute top-1 right-1 text-xs text-gray-300 hover:text-red-400 bg-transparent border-none p-0 m-0"
                          title="Delete message"
                          onClick={() => handleDeleteMessage(msg._id)}
                          style={{ zIndex: 2 }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {isMe && (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center ml-2 mt-auto">
                        <span className="text-sm font-medium text-white">{user.firstName?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            <div className="text-gray-400 text-center mt-10">Select a user to start chatting.</div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* 입력창 */}
        {selectedUser && (
          <div className="p-4 border-t border-gray-700 bg-[#232c3a] flex items-center gap-2">
            <input
              className="flex-1 px-4 py-2 rounded-full bg-[#181a20] text-blue-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
            />
            <button
              className="ml-2 px-5 py-2 rounded-full bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 