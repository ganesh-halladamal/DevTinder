import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// import { useChat } from '../hooks/useChat';
import socketService from '../services/socket';
import { messagesAPI, matchesAPI, API_URL } from '../services/api';

interface Message {
  _id: string;
  conversationId: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
  };
  attachments: Array<{
    type: 'image' | 'link' | 'code';
    url: string;
    preview?: string;
    language?: string;
  }>;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
  read: boolean;
}

interface ChatPartner {
  _id: string;
  name: string;
  avatar: string;
  status?: 'online' | 'offline';
}

// Add Match interface
interface MatchUser {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
}

// interface Match {
//   _id: string;
//   users: MatchUser[];
//   matchScore: number;
//   status: string;
//   lastMessage?: any;
// }

// Response interfaces for TypeScript type safety
interface MatchResponse {
  displayUser: {
    _id: string;
    name: string;
    avatar?: string;
    bio?: string;
    location?: string;
    jobRole?: string;
    skills?: any[];
  };
}

interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface MessageResponse {
  message: Message;
}

interface ConversationResponse {
  conversation: {
    _id: string;
    members: MatchUser[];
    lastMessage?: Message;
    lastUpdated: string;
  };
}

// Function to format avatar URL correctly
const formatAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '/default-avatar.png';
  
  // If it's already an absolute URL, return it as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // If it's a relative path from uploads directory, prepend the API base URL
  // Remove the first slash if it exists to avoid double slashes
  const path = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
  return `${API_URL.replace('/api', '')}/${path}`;
};

const Chat: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = socketService.getSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load match details first to get partner info
  useEffect(() => {
    if (!matchId || !user) return;
    
    const loadMatchDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First get match details to identify the chat partner
        const matchResponse = await matchesAPI.getMatchDetails(matchId);
        
        if (matchResponse.data) {
          const matchData = matchResponse.data as MatchResponse;
          if (matchData.displayUser) {
            // Get the other user from the match display data
            const otherUser = matchData.displayUser;
            
            setPartner({
              _id: otherUser._id,
              name: otherUser.name,
              avatar: formatAvatarUrl(otherUser.avatar),
              status: 'offline' // Default status
            });
            
            // Get or create conversation
            const conversationResponse = await messagesAPI.getOrCreateConversation(otherUser._id);
            if (conversationResponse.data) {
              const conversationData = conversationResponse.data as ConversationResponse;
              setConversationId(conversationData.conversation._id);
              
              // Now load messages
              const messagesResponse = await messagesAPI.getMessages(conversationData.conversation._id);
              if (messagesResponse.data) {
                const messagesData = messagesResponse.data as MessagesResponse;
                setMessages(messagesData.messages || []);
              }

              // Join conversation room for socket events
              if (socket && socket.connected) {
                socketService.joinConversation(conversationData.conversation._id);
                console.log('Joined conversation room:', conversationData.conversation._id);
              }
            }
          } else {
            setError('Match details not found');
          }
        } else {
          setError('Failed to retrieve match data');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load match details or messages:', error);
        setError('Failed to load conversation');
        setIsLoading(false);
      }
    };
    
    loadMatchDetails();
    
    // Socket event handlers
    if (socket) {
      const handleNewMessage = (newMessage: Message) => {
        console.log('Received new message:', newMessage);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        
        // Mark message as read
        if (newMessage.sender._id !== user.id && conversationId) {
          messagesAPI.markAsRead(conversationId).catch(console.error);
        }
      };

      const handleUserStatus = (data: {userId: string, status: 'online' | 'offline'}) => {
        if (partner && partner._id === data.userId) {
          setPartner((prev) => prev ? { ...prev, status: data.status } : null);
        }
      };
      
      socket.on('receiveMessage', handleNewMessage);
      socket.on('user_status', handleUserStatus);
      
      // Clean up
      return () => {
        socket.off('receiveMessage', handleNewMessage);
        socket.off('user_status', handleUserStatus);
      };
    }
  }, [matchId, socket, user]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !matchId || !user) return;
    
    try {
      // Add message to UI immediately for better UX
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        conversationId: conversationId || '',
        sender: {
          _id: user?._id || user?.id || '',
          name: user?.name || 'Unknown',
          avatar: formatAvatarUrl(user?.avatar || '')
        },
        receiver: {
          _id: partner?._id || '',
          name: partner?.name || 'Unknown',
          avatar: partner?.avatar || ''
        },
        text: inputMessage.trim(),
        attachments: [],
        createdAt: new Date().toISOString(),
        status: 'sent',
        read: false
      };
      
      // Debug logging
      console.log('Creating temp message:', {
        currentUserId: user?._id || user?.id,
        tempMessageSenderId: tempMessage.sender._id,
        isSame: (user?._id || user?.id) === tempMessage.sender._id
      });
      
      setMessages((prevMessages) => [...prevMessages, tempMessage]);
      setInputMessage('');
      
      // Send to API
      if (conversationId) {
        const response = await messagesAPI.sendMessage(conversationId, inputMessage.trim());
        
        // Replace temp message with the real one from the server
        if (response.data) {
          const messageData = response.data as MessageResponse;
          if (messageData.message) {
            setMessages((prevMessages) =>
              prevMessages.map(msg =>
                msg._id === tempMessage._id ? messageData.message : msg
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could revert the message or show an error
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8 text-foreground">Loading conversation...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => navigate('/matches')}
          className="bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90"
        >
          Back to Matches
        </button>
      </div>
    );
  }
  
  if (!partner) {
    return <div className="text-center p-8 text-foreground">Match not found</div>;
  }
  
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      {/* Fixed Chat header */}
      <div className="flex-none z-10 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shadow-sm">
        <div className="p-4 flex items-center max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/matches')}
            className="mr-4 text-foreground hover:text-primary transition-colors"
          >
            ← Back
          </button>
          <img
            src={partner.avatar}
            alt={partner.name}
            className="w-10 h-10 rounded-full mr-3 border-2 border-background shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{partner.name}</h2>
            <div className="flex items-center text-sm">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  partner.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground'
                }`}
              />
              <span className="text-muted-foreground">
                {partner.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Messages Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 scrollbar-track-transparent">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          {messages.map((message) => {
            const currentUserId = user?._id || user?.id;
            const messageSenderId = message.sender._id;
            const isOwnMessage = currentUserId === messageSenderId;
            
            // Debug logging
            console.log('Message comparison:', {
              currentUserId,
              messageSenderId,
              isOwnMessage,
              messageText: message.text.substring(0, 50),
              senderName: message.sender.name
            });
            
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in`}
              >
                {/* Receiver avatar on the left (only show for receiver messages) */}
                {!isOwnMessage && (
                  <div className="flex-shrink-0 mr-3">
                    {message.sender.avatar ? (
                      <img
                        src={formatAvatarUrl(message.sender.avatar)}
                        alt={message.sender.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-sm font-medium text-accent-foreground">
                          {message.sender.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-xs md:max-w-md rounded-2xl px-5 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                    isOwnMessage
                      ? 'bg-muted text-foreground rounded-br-lg rounded-bl-none ml-auto'
                      : 'bg-muted text-foreground border border-border rounded-bl-lg rounded-br-none mr-auto'
                  }`}
                >
                  {/* Receiver name label for non-own messages */}
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold text-foreground mb-2 tracking-wide">
                      {message.sender.name}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-foreground">{message.text}</p>
                  <div
                    className="text-xs mt-3 flex items-center justify-end space-x-2 text-muted-foreground"
                  >
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {/* Message status indicators for own messages */}
                    {isOwnMessage && (
                      <span className="flex items-center space-x-0.5">
                        {message.status === 'read' ? (
                          <>
                            <span className="text-xs">✓</span>
                            <span className="text-xs">✓</span>
                          </>
                        ) : message.status === 'delivered' ? (
                          <span className="text-xs">✓</span>
                        ) : (
                          <span className="animate-pulse">⚪</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Sender avatar on the right (only show for own messages) */}
                {isOwnMessage && (
                  <div className="flex-shrink-0 ml-3">
                    {message.sender.avatar ? (
                      <img
                        src={formatAvatarUrl(message.sender.avatar)}
                        alt={message.sender.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {message.sender.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Fixed Message Input at Bottom */}
      <form
        onSubmit={handleSendMessage}
        className="flex-none z-10 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="max-w-6xl mx-auto p-4 flex items-center gap-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-input bg-background text-foreground px-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="flex-none text-white rounded-full px-6 py-3 font-semibold transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            style={{ 
              backgroundColor: 'rgb(79, 70, 229)',
              border: 'none',
              outline: 'none'
            }}
            disabled={!inputMessage.trim()}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'rgb(67, 56, 202)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'rgb(79, 70, 229)';
              }
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 