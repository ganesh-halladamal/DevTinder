import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socket';
import { messagesAPI } from '../services/api';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface ChatPartner {
  id: string;
  name: string;
  avatar: string;
  status?: 'online' | 'offline';
}

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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load initial messages and setup socket
  useEffect(() => {
    if (!matchId) return;
    
    const loadMessages = async () => {
      try {
        // Simulated API call
        // const response = await messagesAPI.getMessages(matchId);
        // setMessages(response.data.messages);
        // setPartner(response.data.partner);
        
        // Mock data
        setTimeout(() => {
          setPartner({
            id: 'user2',
            name: 'Sarah Chen',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            status: 'online'
          });
          
          setMessages([
            {
              id: '1',
              senderId: 'user2',
              content: 'Hi there! I saw your profile and I really like your project on React state management.',
              timestamp: '2023-05-20T10:15:00Z',
              read: true
            },
            {
              id: '2',
              senderId: user?.id || '',
              content: 'Thanks! I appreciate that. I noticed you have great experience with UI/UX design.',
              timestamp: '2023-05-20T10:17:00Z',
              read: true
            },
            {
              id: '3',
              senderId: 'user2',
              content: "Yes, I've been working on design systems for the past 3 years. Would you be interested in collaborating on something?",
              timestamp: '2023-05-20T10:20:00Z',
              read: true
            }
          ]);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setIsLoading(false);
      }
    };
    
    loadMessages();
    
    // Socket event handlers
    if (socket) {
      socket?.on(`message:${matchId}`, (newMessage: Message) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
      
      socket?.on(`status:${partner?.id}`, (status: 'online' | 'offline') => {
        setPartner((prev) => prev ? { ...prev, status } : null);
      });
      
      // Clean up
      return () => {
        socket?.off(`message:${matchId}`);
        socket?.off(`status:${partner?.id}`);
      };
    }
  }, [matchId, socket, partner?.id, user?.id]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !matchId || !user) return;
    
    const newMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    try {
      // Add message to UI immediately for better UX
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputMessage('');
      
      // Send to API/socket
      // await messagesAPI.sendMessage(matchId, inputMessage.trim());
      
      // If using sockets
      // socket?.emit('message:send', {
      //   matchId,
      //   content: inputMessage.trim()
      // });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could revert the message or show an error
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading conversation...</div>;
  }
  
  if (!partner) {
    return <div className="text-center p-8">Match not found</div>;
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <div className="bg-white shadow p-4 flex items-center">
        <button 
          onClick={() => navigate('/matches')}
          className="mr-4 text-gray-600"
        >
          ← Back
        </button>
        <img 
          src={partner.avatar} 
          alt={partner.name} 
          className="w-10 h-10 rounded-full mr-3"
        />
        <div className="flex-1">
          <h2 className="font-semibold">{partner.name}</h2>
          <div className="flex items-center text-sm">
            <span 
              className={`w-2 h-2 rounded-full mr-2 ${
                partner.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-600">
              {partner.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            
            return (
              <div 
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                    isOwnMessage 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p>{message.content}</p>
                  <div 
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { 
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
        className="bg-white border-t border-gray-200 p-4 flex"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="ml-3 bg-indigo-600 text-white rounded-full px-5 py-2 font-medium hover:bg-indigo-700"
          disabled={!inputMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat; 