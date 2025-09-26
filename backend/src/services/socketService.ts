import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { SocketEvents, CryptoPriceData } from '../types';

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, { socket: Socket; subscribedSymbols: Set<string> }> = new Map();

  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    logger.info('Socket.IO server initialized');
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      // Initialize client data
      this.connectedClients.set(socket.id, {
        socket,
        subscribedSymbols: new Set()
      });

      // Send connection status
      socket.emit('connection-status', {
        connected: true,
        timestamp: Date.now()
      });
 
      socket.on('subscribe-to-symbol', (symbol: string) => {
        this.subscribeToSymbol(socket.id, symbol);
      });

      socket.on('unsubscribe-from-symbol', (symbol: string) => {
        this.unsubscribeFromSymbol(socket.id, symbol);
      });

      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedClients.delete(socket.id);
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  
  private subscribeToSymbol(socketId: string, symbol: string): void {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    client.subscribedSymbols.add(symbol.toUpperCase());
    client.socket.join(`symbol:${symbol.toUpperCase()}`);
    
    logger.debug(`Client ${socketId} subscribed to ${symbol}`);
    
    // Send confirmation
    client.socket.emit('subscription-confirmed', {
      symbol: symbol.toUpperCase(),
      subscribed: true
    });
  }

  
  private unsubscribeFromSymbol(socketId: string, symbol: string): void {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    client.subscribedSymbols.delete(symbol.toUpperCase());
    client.socket.leave(`symbol:${symbol.toUpperCase()}`);
    
    logger.debug(`Client ${socketId} unsubscribed from ${symbol}`);
    
    // Send confirmation
    client.socket.emit('subscription-confirmed', {
      symbol: symbol.toUpperCase(),
      subscribed: false
    });
  }

  
  broadcastPriceUpdate(priceData: CryptoPriceData[]): void {
    if (!this.io) return;

    // Broadcast to all clients
    this.io.emit('price-update', priceData);

    // Broadcast to specific symbol rooms
    priceData.forEach(data => {
      const room = `symbol:${data.symbol.toUpperCase()}`;
      const io = this.io;
      if (io) {
        io.to(room).emit('symbol-price-update', data);
      }
    });

    logger.debug(`Broadcasted price updates for ${priceData.length} cryptocurrencies`);
  }

  
  sendAlert(alert: any, targetSocketId?: string): void {
    if (!this.io) return;

    const alertData = {
      ...alert,
      timestamp: Date.now()
    };

    if (targetSocketId) {
      const client = this.connectedClients.get(targetSocketId);
      if (client) {
        client.socket.emit('alert-triggered', alertData);
      }
    } else {
      // Broadcast to all clients
      this.io.emit('alert-triggered', alertData);
    }

    logger.info(`Alert sent for ${alert.symbol}: ${alert.condition}`);
  }

  
  getStats() {
    const totalClients = this.connectedClients.size;
    const subscriptionStats: Record<string, number> = {};

    this.connectedClients.forEach(client => {
      client.subscribedSymbols.forEach(symbol => {
        subscriptionStats[symbol] = (subscriptionStats[symbol] || 0) + 1;
      });
    });

    return {
      totalClients,
      subscriptionStats,
      connectedAt: Date.now()
    };
  }

  
  broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.io) return;

    this.io.emit('system-notification', {
      message,
      type,
      timestamp: Date.now()
    });

    logger.info(`System notification sent: ${message}`);
  }

  
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();