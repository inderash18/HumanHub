import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/common/UserAvatar';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUserResults, setSearchUserResults] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Real-time incoming / outgoing socket messages
  useEffect(() => {
    const handleIncomingMessage = (e) => {
      const msg = e.detail;
      if (!msg) return;

      const otherUserId = msg.sender?._id || msg.sender;
      if (selectedUser && selectedUser._id === otherUserId.toString()) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConversations();
    };

    window.addEventListener('message:received:event', handleIncomingMessage);
    return () => window.removeEventListener('message:received:event', handleIncomingMessage);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoadingConv(true);
      const res = await api.get('/messages/conversations');
      const convList = res.data || [];
      setConversations(convList);
      if (convList.length > 0 && !selectedUser) {
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
      setMessages(res.data || []);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (partner) => {
    setSelectedUser(partner);
    fetchThreadMessages(partner._id);
    setIsSearching(false);
    setSearchQuery('');
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
      receiver: {
        _id: selectedUser._id,
        username: selectedUser.username,
        displayName: selectedUser.displayName,
        avatar: selectedUser.avatar
      },
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await api.post('/messages', {
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
        setSearchUserResults(res.data || []);
      } catch (err) {
        setSearchUserResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-2rem)] my-4 px-4 sm:px-6 select-none flex">
      {/* Outer Shell Card */}
      <div className="w-full h-full bg-hub-surface border border-hub-border rounded-3xl overflow-hidden shadow-2xl flex">
        {/* Left Threads Column */}
        <div className="w-full md:w-80 border-r border-hub-border flex flex-col bg-hub-surface">
          {/* Channel Header */}
          <div className="p-4 border-b border-hub-border flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-hub-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-hub-accent" />
              Messages
            </h2>
            <button 
              onClick={() => setIsSearching(!isSearching)}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-colors ${
                isSearching 
                  ? 'bg-hub-accent text-white border-hub-accent' 
                  : 'bg-hub-surface-elevated border-hub-border text-hub-text-secondary hover:text-hub-text-primary'
              }`}
            >
              {isSearching ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* User Search Bar in Drawer */}
          {isSearching && (
            <div className="p-3 border-b border-hub-border bg-hub-surface-elevated animate-fade-in">
              <input 
                type="text" 
                placeholder="Search person to message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-hub-surface border border-hub-border text-hub-text-primary text-xs rounded-xl px-3 py-2 outline-none focus:border-hub-accent placeholder:text-hub-text-tertiary"
              />

              {searchUserResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1 bg-hub-surface border border-hub-border rounded-xl p-1.5 shadow-xl">
                  {searchUserResults.map((u) => (
                    <div 
                      key={u._id}
                      onClick={() => handleSelectConversation(u)}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-hub-surface-elevated cursor-pointer"
                    >
                      <UserAvatar 
                        src={u.avatar} 
                        name={u.displayName || u.username}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-hub-text-primary truncate">{u.displayName || u.username}</p>
                        <p className="text-[10px] text-hub-text-tertiary">@{u.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-hub-border-subtle">
            {loadingConv ? (
              <div className="p-8 text-center text-xs text-hub-text-tertiary">
                Loading conversations...
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((c) => {
                const partner = c.user || {};
                const isSelected = selectedUser?._id === partner._id;

                return (
                  <div 
                    key={c.id || partner._id}
                    onClick={() => handleSelectConversation(partner)}
                    className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-hub-surface-elevated border-l-4 border-hub-accent' : 'hover:bg-hub-surface-elevated/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar 
                        src={partner.avatar} 
                        name={partner.displayName || partner.username} 
                        size="sm"
                      />
                      {c.unread && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-hub-accent rounded-full border-2 border-hub-surface" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-hub-text-primary truncate">{partner.displayName || partner.username}</p>
                      </div>
                      <p className={`text-xs truncate ${c.unread ? 'font-bold text-hub-text-primary' : 'text-hub-text-tertiary'}`}>
                        {c.lastMsg || 'Started a conversation'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-hub-text-tertiary">
                No active conversations yet. Search to start a chat.
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Pane */}
        <div className="flex-1 flex flex-col bg-hub-surface-elevated/20">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-hub-border flex items-center justify-between bg-hub-surface/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    src={selectedUser.avatar} 
                    name={selectedUser.displayName || selectedUser.username} 
                    size="sm"
                  />
                  <div>
                    <span className="font-display font-bold text-xs sm:text-sm text-hub-text-primary block">
                      {selectedUser.displayName || selectedUser.username}
                    </span>
                    <span className="text-[10px] text-hub-text-tertiary">@{selectedUser.username}</span>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-hub-text-tertiary">
                    Loading messages...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m, idx) => {
                    const isMe = (m.sender?._id || m.sender)?.toString() === user?._id?.toString();
                    return (
                      <div 
                        key={m._id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMe 
                              ? 'bg-hub-accent text-white rounded-br-none' 
                              : 'bg-hub-surface border border-hub-border text-hub-text-primary rounded-bl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-hub-text-tertiary mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <MessageSquare className="w-10 h-10 text-hub-text-tertiary mb-2" />
                    <p className="text-xs text-hub-text-secondary">No messages yet with @{selectedUser.username}.</p>
                    <p className="text-[10px] text-hub-text-tertiary mt-0.5">Send a message to say hello!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="p-3.5 sm:p-4 border-t border-hub-border bg-hub-surface flex items-center gap-2.5">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message @${selectedUser.username}...`}
                  className="flex-1 bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-hub-accent placeholder:text-hub-text-tertiary"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-hub-accent hover:bg-hub-accent-hover text-white transition-colors disabled:opacity-40 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-12 h-12 text-hub-text-tertiary mb-3" />
              <h3 className="font-display text-sm font-bold text-hub-text-primary mb-1">Your Messages</h3>
              <p className="text-xs text-hub-text-secondary max-w-xs">
                Select a conversation from the left or search for someone to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
