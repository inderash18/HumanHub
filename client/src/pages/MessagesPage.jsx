import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  Search, 
  X,
  UserPlus
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';

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
      navigate('/?mode=signin');
      return;
    }
    fetchConversations();
  }, [isAuthenticated]);

  // Check if a specific user was requested via query param ?user=...
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
    e.preventDefault();
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
      toast.error('Failed to deliver message');
    }
  };

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
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-6rem)] my-4 px-4 sm:px-6 select-none flex">
      <div className="w-full h-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Sidebar: Conversations & User Search */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[var(--border)] flex flex-col bg-[var(--surface-elevated)]/30">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="font-display font-bold text-base text-[var(--text-primary)] mb-3">
              Direct Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search people to message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/50">
            {searchQuery.trim() ? (
              <div className="p-2 space-y-1">
                <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] px-3 py-1.5 font-mono">
                  People
                </p>
                {searchUserResults.length > 0 ? (
                  searchUserResults.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => handleSelectConversation(u)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                    >
                      <UserAvatar src={u.avatar} name={u.displayName || u.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{u.displayName || u.username}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] truncate">@{u.username}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No users found</p>
                )}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const partner = conv.user || {};
                const isSelected = selectedUser && selectedUser._id === partner._id;
                return (
                  <div
                    key={conv.id || partner._id}
                    onClick={() => handleSelectConversation(partner)}
                    className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[var(--surface-elevated)] border-l-4 border-l-[var(--accent)]' : 'hover:bg-[var(--surface-elevated)]/50'
                    }`}
                  >
                    <UserAvatar src={partner.avatar} name={partner.displayName || partner.username} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {partner.displayName || partner.username}
                        </p>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{formatTimestamp(conv.time)}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                        {conv.lastMsg || 'Started a conversation'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-[var(--text-tertiary)]">
                No active conversations. Search above to start chatting with anyone on HumanHub.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Message Thread View */}
        <div className="flex-1 flex flex-col bg-[var(--surface)]">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-elevated)]/30">
                <div 
                  onClick={() => navigate(`/u/${selectedUser.username}`)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <UserAvatar src={selectedUser.avatar} name={selectedUser.displayName || selectedUser.username} size="sm" />
                  <div>
                    <h3 className="font-display font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {selectedUser.displayName || selectedUser.username}
                    </h3>
                    <p className="text-[10px] text-[var(--text-tertiary)]">@{selectedUser.username}</p>
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length > 0 ? (
                  messages.map((m) => {
                    const isMe = user && (m.sender?._id === user._id || m.sender === user._id);
                    return (
                      <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-[var(--accent)] text-white rounded-br-none'
                            : 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-none'
                        }`}>
                          <p>{m.body || m.text}</p>
                          <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                            {formatTimestamp(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <EmptyState
                      icon={MessageSquare}
                      title={`Conversation with @${selectedUser.username}`}
                      description="Say hello to break the ice!"
                    />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border)] bg-[var(--surface-elevated)]/40 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <EmptyState
                icon={MessageSquare}
                title="Your Messages"
                description="Send private moments, chats, and thoughts to friends and creators."
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
