import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socket';
import { messagesAPI, matchesAPI, API_URL } from '../services/api';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
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

interface Match {
  _id: string;
  users: MatchUser[];
  matchScore: number;
  status: string;
  lastMessage?: any;
}

// Response interfaces for TypeScript type safety
interface MatchResponse {
  match: Match;
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
          if (matchData.match) {
            // Find the other user in the match
            const otherUser = matchData.match.users.find(u => u._id !== user.id);
            
            if (otherUser) {
              setPartner({
                _id: otherUser._id,
                name: otherUser.name,
                avatar: formatAvatarUrl(otherUser.avatar),
                status: 'offline' // Default status
              });
              
              // Now load messages
              const messagesResponse = await messagesAPI.getMessages(matchId);
              if (messagesResponse.data) {
                const messagesData = messagesResponse.data as MessagesResponse;
                setMessages(messagesData.messages || []);
              }

              // Join match room for socket events
              if (socket && socket.connected) {
                socket.emit('join_match', matchId);
                console.log('Joined match room:', matchId);
              }
            } else {
              setError('Could not identify chat partner');
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
        if (newMessage.sender._id !== user.id) {
          messagesAPI.markAsRead(matchId).catch(console.error);
        }
      };

      const handleUserStatus = (data: {userId: string, status: 'online' | 'offline'}) => {
        if (partner && partner._id === data.userId) {
          setPartner((prev) => prev ? { ...prev, status: data.status } : null);
        }
      };
      
      socket.on(`message:${matchId}`, handleNewMessage);
      socket.on('user_status', handleUserStatus);
      
      // Clean up
      return () => {
        socket.off(`message:${matchId}`, handleNewMessage);
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
        sender: {
          _id: user.id || '',
          name: user.name || 'Unknown',
          avatar: formatAvatarUrl(user.avatar || '')
        },
        content: inputMessage.trim(),
        createdAt: new Date().toISOString(),
        status: 'sent'
      };
      
      setMessages((prevMessages) => [...prevMessages, tempMessage]);
      setInputMessage('');
      
      // Send to API
      const response = await messagesAPI.sendMessage(matchId, inputMessage.trim());
      
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
    <div className="flex flex-col h-screen bg-background">
      {/* Chat header */}
      <div className="bg-background border-b border-border shadow-sm p-4 flex items-center">
        <button
          onClick={() => navigate('/matches')}
          className="mr-4 text-foreground hover:text-primary transition-colors"
        >
          ← Back
        </button>
        <img
          src={partner.avatar}
          alt={partner.name}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{partner.name}</h2>
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
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender._id === user?.id;
            
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border border-border'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-background border-t border-border p-4 flex"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-input bg-background text-foreground px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="submit"
          className="ml-3 bg-primary text-primary-foreground rounded-lg px-5 py-2 font-medium hover:bg-primary/90 disabled:opacity-50"
          disabled={!inputMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat; 