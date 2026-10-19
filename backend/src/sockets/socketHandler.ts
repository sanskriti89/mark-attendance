import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer, corsOrigin: string = '*'): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // Join room for specific course or session
    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`👤 Client ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave_room', (room: string) => {
      socket.leave(room);
      console.log(`👤 Client ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};
