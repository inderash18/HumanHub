import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Search, 
  Smile, 
  Image as ImageIcon, 
  Heart, 
  Info,
  ArrowLeft,
  Edit,
  Phone,
  Video
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/common/UserAvatar';

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUserResults, setSearchUserResults] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated]);

  // Check if target user requested via URL
  useEffect(() => {
    const targetUserId = searchParams.get('user');
    if (targetUserId) {
      api.get(`/users/profile/${targetUserId}`).then((res) => {
        const target = res.data?.profile || res.data?.user || res.data;
        if (target) {
          setSelectedUser(target);
          fetchThreadMessages(target._id);
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoadingConv(true);
      const res = await api.get('/messages/conversations');
      const convList = Array.isArray(res.data) ? res.data : [];
      setConversations(convList);
      if (convList.length > 0 && !selectedUser && !searchParams.get('user')) {
        setSelectedUser(convList[0].user);
        fetchThreadMessages(convList[0].user._id);
      }
    } catch (err) {
      setConversations([]);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchThreadMessages = async (userId) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/messages/${userId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (partner) => {
    setSelectedUser(partner);
    fetchThreadMessages(partner._id);
    setSearchQuery('');
    setSearchUserResults([]);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedUser?._id) return;

    const textToSend = inputText.trim();
    setInputText('');

    const optimisticMsg = {
      _id: Date.now().toString(),
      sender: {
        _id: user?._id,
        username: user?.username,
        displayName: user?.displayName,
        avatar: user?.avatar
      },
      recipient: {
        _id: selectedUser._id,
        username: selectedUser.username,
        displayName: selectedUser.displayName,
        avatar: selectedUser.avatar
      },
      body: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await api.post('/messages/send', {
        receiverId: selectedUser._id,
        text: textToSend
      });
      if (res.data) {
        setMessages((prev) => prev.map(m => m._id === optimisticMsg._id ? res.data : m));
      }
      fetchConversations();
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
      setInputText(textToSend);
      toast.error('Failed to deliver message');
    }
  };

  const sendHeartReaction = () => {
    setInputText('❤️');
  };

  // Socket listener for real-time messages
  useEffect(() => {
    const receive = ({ detail: message }) => {
      const sender = message.sender?._id || message.sender;
      const recipient = message.recipient?._id || message.recipient;
      if (selectedUser && (sender === selectedUser._id || recipient === selectedUser._id)) {
        setMessages(prev => prev.some(item => item._id === message._id) ? prev : [...prev, message]);
      }
      fetchConversations();
    };
    window.addEventListener('message:receive:event', receive);
    return () => window.removeEventListener('message:receive:event', receive);
  }, [selectedUser?._id]);

  // Search users for new conversation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchUserResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search/query?q=${encodeURIComponent(searchQuery)}`);
        setSearchUserResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setSearchUserResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-[975px] mx-auto h-[calc(100vh-50px)] md:h-[calc(100vh-20px)] md:my-2 px-0 md:px-4 select-none">
      <div className="w-full h-full bg-[var(--ig-bg)] md:border border-[var(--ig-border)] md:rounded-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Column: Conversations List (Hidden on mobile if user is active) */}
        <div className={`w-full md:w-[350px] border-r border-[var(--ig-border)] flex flex-col ${
          selectedUser ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Top Bar with username and new message icon */}
          <div className="h-14 px-6 border-b border-[var(--ig-border)] flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ig-text-primary)]">
              {user?.username || 'Messages'}
            </h2>
            <button className="text-[var(--ig-text-primary)] hover:opacity-70">
              <Edit className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-[var(--ig-border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ig-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--ig-elevated)] text-xs text-[var(--ig-text-primary)] placeholder:text-[var(--ig-text-tertiary)] rounded-lg pl-9 pr-3 py-2 outline-none"
              />
            </div>
          </div>

          {/* Conversations Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--ig-border-subtle)]">
            {searchQuery.trim() ? (
              <div className="p-2 space-y-1">
                {searchUserResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleSelectConversation(u)}
                    className="flex items-center gap-3 p-3 hover:bg-[var(--ig-hover)] cursor-pointer rounded-lg"
                  >
                    <UserAvatar src={u.avatar} name={u.displayName || u.username} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--ig-text-primary)] truncate">{u.username}</p>
                      <p className="text-xs text-[var(--ig-text-secondary)] truncate">{u.displayName || u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const partner = conv.user || {};
                const isSelected = selectedUser && selectedUser._id === partner._id;

                return (
                  <div
                    key={conv.id || partner._id}
                    onClick={() => handleSelectConversation(partner)}
                    className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[var(--ig-hover)]' : 'hover:bg-[var(--ig-hover)]'
                    }`}
                  >
                    <UserAvatar src={partner.avatar} name={partner.displayName || partner.username} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--ig-text-primary)] truncate">
                        {partner.username || partner.displayName}
                      </p>
                      <p className="text-xs text-[var(--ig-text-secondary)] truncate mt-0.5">
                        {conv.lastMsg || 'Sent a message'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[var(--ig-text-tertiary)]">
                No messages yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Thread */}
        <div className={`flex-1 flex flex-col bg-[var(--ig-surface)] ${
          !selectedUser ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="h-14 px-4 border-b border-[var(--ig-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden text-[var(--ig-text-primary)] mr-1"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>

                  <div 
                    onClick={() => navigate(`/u/${selectedUser.username}`)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <UserAvatar src={selectedUser.avatar} name={selectedUser.displayName || selectedUser.username} size="sm" />
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--ig-text-primary)] hover:opacity-80">
                        {selectedUser.username || selectedUser.displayName}
                      </h3>
                      <p className="text-[11px] text-[var(--ig-text-tertiary)]">Active now</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[var(--ig-text-primary)]">
                  <button title="Audio call" className="hover:opacity-70">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button title="Video call" className="hover:opacity-70">
                    <Video className="w-5 h-5" />
                  </button>
                  <button title="Details" className="hover:opacity-70">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {messages.map((m) => {
                  const isMe = user && (m.sender?._id === user._id || m.sender === user._id);

                  return (
                    <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-[var(--ig-primary-button)] text-white'
                          : 'bg-[var(--ig-elevated)] text-[var(--ig-text-primary)] border border-[var(--ig-border)]'
                      }`}>
                        <p>{m.body || m.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 border border-[var(--ig-border)] rounded-full px-4 py-2 bg-[var(--ig-bg)]">
                  <Smile className="w-6 h-6 text-[var(--ig-text-primary)] cursor-pointer hover:opacity-70 flex-shrink-0" />
                  
                  <input
                    type="text"
                    placeholder="Message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[var(--ig-text-primary)] placeholder:text-[var(--ig-text-tertiary)] outline-none"
                  />

                  {inputText.trim() ? (
                    <button
                      type="submit"
                      className="text-sm font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-primary-button-hover)] flex-shrink-0"
                    >
                      Send
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 text-[var(--ig-text-primary)] flex-shrink-0">
                      <ImageIcon className="w-6 h-6 cursor-pointer hover:opacity-70" />
                      <Heart 
                        onClick={sendHeartReaction} 
                        className="w-6 h-6 cursor-pointer hover:opacity-70 fill-none" 
                      />
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            /* Empty State when no conversation selected on desktop */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
              <div className="w-24 h-24 rounded-full border-2 border-[var(--ig-text-primary)] flex items-center justify-center mb-4 text-[var(--ig-text-primary)]">
                <Send className="w-12 h-12 stroke-[1.5] -translate-x-1 translate-y-1" />
              </div>
              <h3 className="text-xl font-normal text-[var(--ig-text-primary)] mb-1">
                Your messages
              </h3>
              <p className="text-sm text-[var(--ig-text-secondary)] mb-5 max-w-xs">
                Send private photos and messages to a friend or group.
              </p>
              <button
                onClick={() => {}}
                className="ig-btn-primary"
              >
                Send message
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
