import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@hooks/useAuth';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
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
    const isSender = message.sender.id === user?.id;

    return (
      <div
        key={message.id}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isSender && (
          <div className="flex-shrink-0 mr-3">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
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

        <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-4 py-2 rounded-lg max-w-[70%] ${
              isSender
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground'
            }`}
          >
            <p className="text-sm">{message.content}</p>
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
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            {isSender && (
              <span className="text-xs text-muted-foreground">
                {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        {isTyping && (
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="animate-pulse">•••</span>
            <span className="ml-2">{otherUser.name} is typing</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow; 