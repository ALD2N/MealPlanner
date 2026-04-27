import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService } from '../services/AuthService';
import { IWebSocketPayloads } from '@dndmeal/shared';

export function setupWebSocketHandlers(io: SocketIOServer) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error'));
    }

    (socket as any).userId = decoded.userId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User ${(socket as any).userId} connected`);

    socket.on('disconnect', () => {
      console.log(`User ${(socket as any).userId} disconnected`);
    });
  });
}

export function broadcastMealSelected(
  io: SocketIOServer,
  payload: IWebSocketPayloads['meal:selected']
) {
  io.emit('meal:selected', payload);
}

export function broadcastRecipeAdded(
  io: SocketIOServer,
  payload: IWebSocketPayloads['recipe:added']
) {
  io.emit('recipe:added', payload);
}

export function broadcastRecipeUpdated(
  io: SocketIOServer,
  payload: IWebSocketPayloads['recipe:updated']
) {
  io.emit('recipe:updated', payload);
}

export function broadcastRecipeDeleted(
  io: SocketIOServer,
  payload: IWebSocketPayloads['recipe:deleted']
) {
  io.emit('recipe:deleted', payload);
}

export function broadcastRatingAdded(
  io: SocketIOServer,
  payload: IWebSocketPayloads['rating:added']
) {
  io.emit('rating:added', payload);
}

export function broadcastMealConfirmed(
  io: SocketIOServer,
  payload: IWebSocketPayloads['meal:confirmed']
) {
  io.emit('meal:confirmed', payload);
}

export function broadcastMealUpdated(
  io: SocketIOServer,
  payload: IWebSocketPayloads['meal:updated']
) {
  io.emit('meal:updated', payload);
}

export function broadcastMealDeselected(io: SocketIOServer) {
  io.emit('meal:deselected', {});
}
