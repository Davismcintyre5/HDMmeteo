import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, accessToken, tenant } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io({
      path: '/socket.io',
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (tenant?.id) {
        socket.emit('join', { role: 'user', tenantId: tenant.id });
      }
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    for (const [event, handlers] of listenersRef.current) {
      for (const h of handlers) socket.on(event, h);
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, accessToken, tenant?.id]);

  const on = useCallback((event, handler) => {
    const set = listenersRef.current.get(event) || new Set();
    set.add(handler);
    listenersRef.current.set(event, set);

    const socket = socketRef.current;
    if (socket) socket.on(event, handler);

    return () => {
      const s = listenersRef.current.get(event);
      if (s) {
        s.delete(handler);
        if (s.size === 0) listenersRef.current.delete(event);
      }
      const sk = socketRef.current;
      if (sk) sk.off(event, handler);
    };
  }, []);

  const off = useCallback((event, handler) => {
    const s = listenersRef.current.get(event);
    if (s) s.delete(handler);
    const socket = socketRef.current;
    if (socket) socket.off(event, handler);
  }, []);

  const value = useMemo(
    () => ({ socket: socketRef.current, connected, on, off }),
    [connected, on, off]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}