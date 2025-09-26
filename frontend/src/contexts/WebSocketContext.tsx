import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { CryptoPrice } from '../types';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  prices: CryptoPrice[];
  subscribedSymbols: Set<string>;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());

  useEffect(() => {
    const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';
    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    newSocket.on('price-update', (data: CryptoPrice[]) => {
      setPrices(data);
    });

    newSocket.on('alert-triggered', (alert: any) => {
      toast.success(
        `Alert triggered: ${alert.symbol} ${alert.condition} - Current price: $${alert.currentPrice.toLocaleString()}`,
        { duration: 5000 }
      );
    });

    newSocket.on('system-notification', (notification: any) => {
      if (notification.type === 'error') {
        toast.error(notification.message);
      } else if (notification.type === 'warning') {
        toast.error(notification.message);
      } else {
        toast(notification.message);
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribeToSymbol = (symbol: string) => {
    if (socket && !subscribedSymbols.has(symbol)) {
      socket.emit('subscribe-to-symbol', symbol);
      setSubscribedSymbols(prev => new Set([...Array.from(prev), symbol]));
    }
  };

  const unsubscribeFromSymbol = (symbol: string) => {
    if (socket && subscribedSymbols.has(symbol)) {
      socket.emit('unsubscribe-from-symbol', symbol);
      setSubscribedSymbols(prev => {
        const newSet = new Set(prev);
        newSet.delete(symbol);
        return newSet;
      });
    }
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    prices,
    subscribedSymbols,
    subscribeToSymbol,
    unsubscribeFromSymbol,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};