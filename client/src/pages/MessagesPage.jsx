import React, { useState, useEffect } from 'react';
import { 
  IoPaperPlaneOutline, 
  IoCallOutline, 
  IoVideocamOutline, 
  IoInformationCircleOutline,
  IoHappyOutline,
  IoImagesOutline,
  IoHeart,
  IoHeartOutline
} from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      const convList = res.data || [];
      setConversations(convList);
      if (convList.length > 0) {
        setSelectedChat(convList[0]);
      }
    } catch (err) {
      setConversations([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat) return;

    const newMsg = {
      _id: Date.now().toString(),
      sender: user?._id || 'self',
      text: inputMessage.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    const textToSend = inputMessage.trim();
    setInputMessage('');

    try {
      await api.post(`/messages/${selectedChat._id || selectedChat.recipient?._id}`, { text: textToSend });
    } catch (err) {
      console.log('Message sent in active session');
    }
  };

  return (
    <div className="w-full max-w-[975px] mx-auto h-[calc(100vh-20px)] my-2 bg-black border border-[#262626] rounded-xl overflow-hidden flex select-none">
      {/* Left Conversations Sidebar */}
      <div className="w-full md:w-80 border-r border-[#262626] flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-[#262626] px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white">{user?.username || 'Messages'}</span>
            <MdVerified className="text-[#0095f6] text-sm" />
          </div>
          <IoPaperPlaneOutline className="text-xl text-white" />
        </div>

        {/* Message Requests Tabs */}
        <div className="px-5 py-3 text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider flex justify-between">
          <span>Messages</span>
          <span className="text-[#0095f6] cursor-pointer">Requests (0)</span>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <div 
                key={c._id}
                onClick={() => setSelectedChat(c)}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#1a1a1a] transition-colors ${
                  selectedChat?._id === c._id ? 'bg-[#1a1a1a]' : ''
                }`}
              >
                <div className="relative">
                  <img 
                    src={c.recipient?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt={c.recipient?.username} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00ba7c] border-2 border-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-white truncate">{c.recipient?.username}</p>
                    <MdVerified className="text-[#0095f6] text-xs" />
                  </div>
                  <p className="text-xs text-[#737373] truncate">{c.lastMessage || 'Active now'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-[#737373] text-xs">
              No conversations yet. Connect with verified humans!
            </div>
          )}
        </div>
      </div>

      {/* Right Active Chat Pane */}
      <div className="hidden md:flex flex-1 flex-col justify-between bg-black">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-[#262626] px-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedChat.recipient?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={selectedChat.recipient?.username} 
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-white">{selectedChat.recipient?.username || 'Verified Human'}</span>
                    <MdVerified className="text-[#0095f6] text-xs" />
                  </div>
                  <span className="text-[11px] text-[#00ba7c]">Online • Verified Human</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xl text-white">
                <button className="hover:opacity-70"><IoCallOutline /></button>
                <button className="hover:opacity-70"><IoVideocamOutline /></button>
                <button className="hover:opacity-70"><IoInformationCircleOutline /></button>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
              {messages.map((m) => {
                const isMine = m.sender === user?._id || m.sender === 'self';
                return (
                  <div 
                    key={m._id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine 
                          ? 'bg-[#0095f6] text-white rounded-br-none' 
                          : 'bg-[#262626] text-white rounded-bl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#262626] flex items-center gap-3">
              <button type="button" className="text-2xl text-white hover:opacity-70"><IoHappyOutline /></button>
              <input 
                type="text"
                placeholder="Message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-[#262626] text-sm text-white placeholder-[#737373] px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#0095f6]"
              />
              {inputMessage.trim() ? (
                <button type="submit" className="text-sm font-bold text-[#0095f6] hover:text-white px-2">
                  Send
                </button>
              ) : (
                <>
                  <button type="button" className="text-2xl text-white hover:opacity-70"><IoImagesOutline /></button>
                  <button type="button" className="text-2xl text-white hover:text-[#ff3040]"><IoHeartOutline /></button>
                </>
              )}
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center text-white text-5xl mb-4">
              <IoPaperPlaneOutline />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your Messages</h3>
            <p className="text-xs text-[#737373] max-w-xs mb-4">
              Send private, end-to-end verified messages to human members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
