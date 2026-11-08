// hooks/useTicketSocket.js
import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

export const useTicketSocket = (ticketId, options = {}) => {
  const { onNewMessage, onReadUpdate, onMessageHistory, onError } = options;
  const { socket, isConnected, emit, on, off } = useSocket('/private');
  const joinedTicketIdRef = useRef(null);

  // Join room only when necessary
  useEffect(() => {
    if (!isConnected || !ticketId) return;
    const tid = Number(ticketId);
    if (joinedTicketIdRef.current === tid) return;

    emit('join-ticket', { ticket_id: tid });
    joinedTicketIdRef.current = tid;

    return () => {
      if (joinedTicketIdRef.current) {
        emit('leave-ticket', { ticket_id: joinedTicketIdRef.current });
        joinedTicketIdRef.current = null;
      }
    };
  }, [ticketId, isConnected, emit]);

  // Stable event listeners
  useEffect(() => {
    if (!on || !off) return;
    const handler = (data) => onNewMessage?.(data);
    on('new-ticket-message', handler);
    return () => off('new-ticket-message', handler);
  }, [on, off, onNewMessage]);

  useEffect(() => {
    if (!on || !off) return;
    const handler = (data) => onReadUpdate?.(data);
    on('ticket-read-update', handler);
    return () => off('ticket-read-update', handler);
  }, [on, off, onReadUpdate]);

  useEffect(() => {
    if (!on || !off) return;
    const handler = (data) => onMessageHistory?.(data);
    on('ticket-messages-history', handler);
    return () => off('ticket-messages-history', handler);
  }, [on, off, onMessageHistory]);

  useEffect(() => {
    if (!on || !off) return;
    const handler = (err) => onError?.(err);
    on('error', handler); // listen to generic error events
    return () => off('error', handler);
  }, [on, off, onError]);

  const sendMessage = useCallback(
    (message, isInternal = false) => {
      if (!isConnected) return false;
      emit('send-ticket-message', {
        ticket_id: Number(ticketId),
        message,
        is_internal: isInternal,
      });
      return true;
    },
    [ticketId, emit, isConnected]
  );

  const markAsRead = useCallback(() => {
    if (!isConnected) return;
    emit('mark-ticket-read', { ticket_id: Number(ticketId) });
  }, [ticketId, emit, isConnected]);

  const fetchHistory = useCallback(() => {
    if (!isConnected) return;
    emit('get-ticket-messages', { ticket_id: Number(ticketId) });
  }, [ticketId, emit, isConnected]);

  return { isConnected, sendMessage, markAsRead, fetchHistory };
};