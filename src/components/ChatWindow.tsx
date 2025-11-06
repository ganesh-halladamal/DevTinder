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
    const currentUserId = user?._id || user?.id;
    const messageSenderId = message.sender.id || message.sender._id;
    const isSender = currentUserId === messageSenderId;
    
    return (
      <div
        key={message._id}
        className={`w-full flex ${isSender ? 'justify-end' : 'justify-start'} mb-6`}
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
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background shadow-sm">
                <span className="text-sm font-medium text-foreground">
                  {message.sender.name[0]}
                </span>
              </div>
            )}
          </div>
        )}

        <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
          {/* Receiver name label for non-own messages */}
          {!isSender && (
            <div className="text-xs font-semibold text-foreground mb-2 tracking-wide">
              {message.sender.name}
            </div>
          )}
          
          <div
            className={`px-4 py-3 max-w-[70%] shadow-sm transition-all duration-200 hover:shadow-md ${
              isSender
                ? 'bg-muted text-foreground rounded-[20px] rounded-br-[5px] ml-auto'
                : 'bg-muted text-foreground rounded-[20px] rounded-bl-[5px] border border-border mr-auto'
            }`}
          >
            <p className="text-sm leading-relaxed text-foreground">{message.text || message.content}</p>
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
          
          <div className={`flex items-center mt-2 ${isSender ? 'justify-end' : 'justify-start'} w-full max-w-[70%]`}>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            {isSender && (
              <span className="flex items-center ml-2">
                {message.status === 'read' ? (
                  <>
                    <span className="text-xs">✓</span>
                    <span className="text-xs">✓</span>
                  </>
                ) : message.status === 'delivered' ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <span className="animate-pulse text-xs">⚪</span>
                )}
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
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background shadow-sm">
                <span className="text-sm font-medium text-primary">
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
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] bg-background">
      {/* Fixed Header */}
      <div className="flex items-center px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center flex-1 min-w-0">
          {otherUser.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background shadow-sm">
              <span className="text-lg font-medium text-primary">
                {otherUser.name[0]}
              </span>
            </div>
          )}
          <div className="ml-3 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">
              {otherUser.name}
            </h2>
            {isTyping && (
              <p className="text-sm text-muted-foreground">
                typing...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background to-muted/20">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-muted text-foreground rounded-full px-4 py-2.5 sm:px-6 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-border"
          />
           <button
             type="submit"
             disabled={!newMessage.trim()}
             className="text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-full disabled:opacity-50 font-medium whitespace-nowrap transition-colors"
             style={{ 
               backgroundColor: 'rgb(79, 70, 229)',
               border: 'none',
               outline: 'none',
               boxShadow: 'none'
             }}
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

export default ChatWindow; 