import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../middlewares/auth.middleware';

export class SocketService {
  private io: SocketServer;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.frontendUrl,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO authentication middleware
   */
  private setupAuthentication() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      console.log(`[Socket.IO] User ${userId} connected (socket: ${socket.id})`);

      // Track user's socket
      this.addUserSocket(userId, socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`[Socket.IO] User ${userId} disconnected (socket: ${socket.id})`);
        this.removeUserSocket(userId, socket.id);
      });

      // Handle typing indicators (for comments)
      socket.on('typing:start', (data: { videoId: string }) => {
        socket.to(`video:${data.videoId}`).emit('user:typing', {
          userId,
          videoId: data.videoId,
        });
      });

      socket.on('typing:stop', (data: { videoId: string }) => {
        socket.to(`video:${data.videoId}`).emit('user:stopped-typing', {
          userId,
          videoId: data.videoId,
        });
      });

      // Join video room (for real-time comments)
      socket.on('video:join', (data: { videoId: string }) => {
        socket.join(`video:${data.videoId}`);
      });

      socket.on('video:leave', (data: { videoId: string }) => {
        socket.leave(`video:${data.videoId}`);
      });
    });
  }

  /**
   * Track user socket
   */
  private addUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socketId);
    this.userSockets.set(userId, sockets);
  }

  /**
   * Remove user socket
   */
  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || [];
    const filtered = sockets.filter((id) => id !== socketId);

    if (filtered.length === 0) {
      this.userSockets.delete(userId);
    } else {
      this.userSockets.set(userId, filtered);
    }
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Send notification to specific user
   */
  public sendNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Send new comment notification to video room
   */
  public sendNewComment(videoId: string, comment: any) {
    this.io.to(`video:${videoId}`).emit('comment:new', comment);
  }

  /**
   * Send new like notification
   */
  public sendLikeNotification(userId: string, data: any) {
    this.io.to(`user:${userId}`).emit('like:new', data);
  }

  /**
   * Send new follower notification
   */
  public sendFollowerNotification(userId: string, follower: any) {
    this.io.to(`user:${userId}`).emit('follower:new', follower);
  }

  /**
   * Broadcast to all connected users
   */
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Get online users count
   */
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get Socket.IO instance
   */
  public getIO(): SocketServer {
    return this.io;
  }
}

// Export singleton instance (will be initialized in server.ts)
let socketService: SocketService | null = null;

export const initializeSocketService = (httpServer: HttpServer): SocketService => {
  socketService = new SocketService(httpServer);
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized');
  }
  return socketService;
};
