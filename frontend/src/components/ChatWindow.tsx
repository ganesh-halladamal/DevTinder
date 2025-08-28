import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@hooks/useAuth';
import type { Socket } from 'socket.io-client';

interface Message {
  _id: string;
  conversationId: string;
  text: string;
  content?: string; // For backward compatibility
  sender: {
    _id: string;
    id?: string; // Optional for backward compatibility
    name: string;
    avatar?: string;
  };
  receiver?: {
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
  read?: boolean;
}

interface ChatWindowProps {
  matchId: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  messages: Message[];
  socket: Socket;
  onSendMessage: (content: string, attachments?: Message['attachments']) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  matchId,
  otherUser,
  messages,
  socket,
  onSendMessage
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    const handleTyping = () => {
      socket.emit('typing_start', matchId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', matchId);
      }, 1000);
    };

    socket.on('user_typing', () => setIsTyping(true));
    socket.on('user_stop_typing', () => setIsTyping(false));

    return () => {
      socket.off('user_typing');
      socket.off('user_stop_typing');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, matchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const renderMessage = (message: Message) => {
    const isSender = message.sender.id === (user?._id || user?.id) || message.sender._id === (user?._id || user?.id);
    
    return (
      <div
        key={message._id}
        className={`w-full flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {/* Receiver avatar on the left (only show for receiver messages) */}
        {!isSender && (
          <div className="flex-shrink-0 mr-3">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  {message.sender.name[0]}
                </span>
              </div>
            )}
          </div>
        )}

        <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
          {/* Receiver name label for non-own messages */}
          {!isSender && (
            <div className="text-xs font-medium text-gray-600 mb-1">
              {message.sender.name}
            </div>
          )}
          
          <div
            className={`px-4 py-2 max-w-[70%] shadow-sm ${
              isSender
                ? 'bg-blue-500 text-white rounded-[20px] rounded-br-[5px]'
                : 'bg-gray-100 text-gray-900 rounded-[20px] rounded-bl-[5px]'
            }`}
          >
            <p className="text-sm">{message.text || message.content}</p>
            {message.attachments.map((attachment, index) => (
              <div key={index} className="mt-2">
                {attachment.type === 'image' && (
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="max-w-full rounded"
                  />
                )}
                {attachment.type === 'link' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline"
                  >
                    {attachment.preview || attachment.url}
                  </a>
                )}
                {attachment.type === 'code' && (
                  <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                    <code>{attachment.preview}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
          
          <div className={`flex items-center mt-1 ${isSender ? 'justify-end' : 'justify-start'} w-full max-w-[70%]`}>
            <span className={`text-xs ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            {isSender && (
              <span className="text-xs text-blue-100 ml-2">
                {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* Sender avatar on the right (only show for own messages) */}
        {isSender && (
          <div className="flex-shrink-0 ml-3">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-sm font-medium text-blue-700">
                  {message.sender.name[0]}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map(renderMessage)}
        {isTyping && (
          <div className="flex items-center text-sm text-gray-500 ml-4">
            <span className="animate-pulse">•••</span>
            <span className="ml-2">{otherUser.name} is typing</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-gray-50 text-gray-900 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-6 py-3 rounded-full disabled:opacity-50 hover:bg-blue-600 font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow; 