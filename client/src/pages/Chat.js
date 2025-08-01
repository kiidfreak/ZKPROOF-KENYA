import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { UserIcon } from '@heroicons/react/24/solid';

const Chat = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);

  // 유저 목록 불러오기
  useEffect(() => {
    fetch('/api/auth/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setUsers(data.users.filter(u => u.id !== user.id)));
  }, [user]);

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
      const res = await chatAPI.sendMessage(selectedUser.id, input);
      setMessages((prev) => [...prev, res.data.message]);
      setInput('');
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
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{u.firstName?.charAt(0)}</span>
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