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
  sendMessage(matchId: string, content: string, attachments: any[] = []): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('private_message', {
      matchId,
      content,
      attachments
    });
  }

  joinMatchRoom(matchId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join_match', matchId);
  }

  // Typing indicators
  sendTypingStart(matchId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('typing_start', matchId);
  }

  sendTypingStop(matchId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('typing_stop', matchId);
  }

  // Read receipts
  markMessageAsRead(messageId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('mark_read', messageId);
  }

  // Match notifications
  sendMatchNotification(matchedUserId: string): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('new_match', { matchedUserId });
  }
}

export default SocketService.getInstance();