
import { useEffect, useRef } from 'react';
import { WS_BASE } from '../constants';

export function useWebSocketNotifications(token, onNotification, onUsersList) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const backoffRef = useRef(1000);

  useEffect(() => {
    if (!token) return;

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => { backoffRef.current = 1000; };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'new-notification') {
            window.dispatchEvent(new CustomEvent('new-notification', { detail: msg.detail }));
            onNotification?.(msg.detail);
          } else if (msg.type === 'users_list') {
            onUsersList?.(msg.data || []);
          } else if (msg.type === 'notification') {
            window.dispatchEvent(new CustomEvent('new-notification', { detail: msg.data }));
            onNotification?.(msg.data);
          }
        } catch (e) { console.error(e); }
      };

      ws.onclose = (e) => {
        if (e.code !== 1008 && token) {
          reconnectTimeoutRef.current = setTimeout(() => {
            backoffRef.current = Math.min(backoffRef.current * 2, 30000);
            connect();
          }, backoffRef.current);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [token, onNotification, onUsersList]);
}