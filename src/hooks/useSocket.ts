// hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const connect = async () => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    if (status !== 'authenticated' || !session?.user?._id) {
      console.log('Cannot connect socket: not authenticated');
      return;
    }

    try {
      console.log('Connecting socket...');
      
      // Get a dedicated socket token
      const response = await fetch('/api/socket-token');
      if (!response.ok) {
        throw new Error('Failed to get socket token');
      }
      
      const { socketToken } = await response.json();
      if (!socketToken) {
        throw new Error('No socket token received');
      }

      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          token: socketToken
        },
        autoConnect: false,
        transports: ['websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        onConnect?.();
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        onDisconnect?.();
        
        if (reason === 'io server disconnect') {
          setTimeout(() => newSocket.connect(), 1000);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        onError?.(error);
        toast.error('Connection failed. Retrying...');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        toast.success('Connection restored');
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error occurred');
      });

      // Connect the socket
      newSocket.connect();
      
      socketRef.current = newSocket;
      setSocket(newSocket);

    } catch (error) {
      console.error('Error creating socket:', error);
      onError?.(error);
      toast.error('Failed to establish connection');
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log('Disconnecting socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit: socket not connected');
      toast.error('Not connected. Please refresh the page.');
    }
  };

  // Auto-connect when session is ready
  useEffect(() => {
    if (autoConnect && status === 'authenticated' && session?.user?._id) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [status, session?.user?._id, autoConnect]);

  // Handle session changes
  useEffect(() => {
    if (status === 'unauthenticated' && socketRef.current) {
      disconnect();
    }
  }, [status]);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    emit
  };
};