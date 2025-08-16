import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

class SocketService {
  private socket: any = null;
  private static instance: SocketService;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(token: string): any {
    if (!this.socket) {
      // Get socket URL from environment or default to backend URL
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('Connecting to socket at:', socketUrl);
      
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): any {
    return this.socket;
  }

  // Message handling
  sendMessage(conversationId: string, text: string, attachments: any[] = []): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('send_message', {
      conversationId,
      text,
      attachments
    });
  }

  joinConversation(conversationId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join_conversation', conversationId);
  }

  // Typing indicators
  sendTypingStart(conversationId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('typing_start', conversationId);
  }

  sendTypingStop(conversationId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('typing_stop', conversationId);
  }

  // Read receipts
  markMessagesAsRead(conversationId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('mark_messages_read', conversationId);
  }

  // Match notifications
  sendMatchNotification(matchData: any): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('match_created', matchData);
  }
}

export default SocketService.getInstance();