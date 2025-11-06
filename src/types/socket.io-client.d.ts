import { Socket as OriginalSocket } from 'socket.io-client';

declare module 'socket.io-client' {
  export interface Socket extends OriginalSocket {
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener?: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
  }
  
  export function io(uri?: string, opts?: any): Socket;
}

export type { Socket };