'use client';

/**
 * useCallSocket — subscribes to call-related Socket.IO events and updates
 * the calls store. Mounted once inside SocketInitializer (authenticated shell).
 *
 * Events handled (server → client):
 *   call:incoming   → store incomingCall (receiver overlay)
 *   call:rejected   → clear outbound call, show toast
 *   call:ended      → clear active call (other party ended)
 *   call:missed     → clear incoming (caller cancelled / no-answer)
 *   call:busy       → clear outbound, show busy toast
 *   call:error      → show error toast
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getExistingCallsSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { useCallsStore } from '@/store/calls.store';
import { CallType } from '@/types/enums';
import type { User } from '@/types/models';

interface IncomingCallPayload {
  callId:      string;
  callerId:    string;
  caller:      User;
  type:        'VOICE' | 'VIDEO';
  channelName: string;
  token:       string;
  appId:       string;
}

export function useCallSocket() {
  const user           = useAuthStore((s) => s.user);
  const setIncoming    = useCallsStore((s) => s.setIncomingCall);
  const setOutbound    = useCallsStore((s) => s.setOutboundCall);
  const setActive      = useCallsStore((s) => s.setActiveCall);
  const clearCalls     = useCallsStore((s) => s.clearCalls);
  const outboundCall   = useCallsStore((s) => s.outboundCall);
  const activeCall     = useCallsStore((s) => s.activeCall);
  // Use refs so the effect doesn't re-run on every store change
  const outboundRef    = useRef(outboundCall);
  const activeRef      = useRef(activeCall);
  outboundRef.current  = outboundCall;
  activeRef.current    = activeCall;

  useEffect(() => {
    if (!user) return;

    const onIncoming = (payload: IncomingCallPayload) => {
      // If already in an active call → auto-send busy
      if (activeRef.current) {
        const socket = getExistingCallsSocket();
        socket?.emit('call:busy', { callId: payload.callId });
        return;
      }
      setIncoming({
        callId:      payload.callId,
        callerId:    payload.callerId,
        caller:      payload.caller,
        type:        payload.type as CallType,
        channelName: payload.channelName,
        token:       payload.token,
        appId:       payload.appId,
      });
    };

    const onRejected = ({ callId }: { callId: string }) => {
      if (outboundRef.current?.callId === callId) {
        setOutbound(null);
        toast('Call declined', { description: 'The other person declined your call.' });
      }
    };

    const onEnded = ({ callId, duration }: { callId: string; duration?: number }) => {
      const isActive  = activeRef.current?.callId  === callId;
      const isOutbound = outboundRef.current?.callId === callId;
      if (isActive || isOutbound) {
        clearCalls();
        if (duration != null && duration > 0) {
          const mins = Math.floor(duration / 60);
          const secs = duration % 60;
          const label = mins > 0
            ? `${mins}m ${secs}s`
            : `${secs}s`;
          toast('Call ended', { description: `Duration: ${label}` });
        } else {
          toast('Call ended');
        }
      }
    };

    const onMissed = ({ callId }: { callId: string }) => {
      // Receiver: caller cancelled before we answered — clear if it matches
      const current = useCallsStore.getState().incomingCall;
      if (current?.callId === callId) setIncoming(null);
    };

    const onBusy = ({ callId }: { callId: string }) => {
      if (outboundRef.current?.callId === callId) {
        setOutbound(null);
        toast('Line busy', { description: 'The other person is currently in a call.' });
      }
    };

    const onError = ({ message }: { callId?: string; message: string }) => {
      toast.error('Call error', { description: message });
      // Clear any pending state
      if (outboundRef.current || activeRef.current) clearCalls();
    };

    // Accept from the caller side: receiver accepted, move outbound → active
    const onAccepted = (payload: {
      callId:      string;
      channelName: string;
      token:       string; // Note: backend sends receiver's token here; caller uses their own stored token
      appId:       string;
    }) => {
      const ob = outboundRef.current;
      if (!ob || ob.callId !== payload.callId) return;
      // Promote outbound → active (caller uses uid=1 and the token from call:initiate ack)
      setActive({
        callId:      ob.callId,
        channelName: ob.channelName,
        token:       ob.token,
        appId:       ob.appId,
        type:        ob.type,
        partner:     ob.partner,
        uid:         ob.uid ?? 1,
        startedAt:   Date.now(),
      });
      setOutbound(null);
    };

    const socket = getExistingCallsSocket();
    if (!socket) return;

    socket.on('call:incoming',  onIncoming);
    socket.on('call:rejected',  onRejected);
    socket.on('call:ended',     onEnded);
    socket.on('call:missed',    onMissed);
    socket.on('call:busy',      onBusy);
    socket.on('call:error',     onError);
    socket.on('call:accepted',  onAccepted);

    return () => {
      socket.off('call:incoming',  onIncoming);
      socket.off('call:rejected',  onRejected);
      socket.off('call:ended',     onEnded);
      socket.off('call:missed',    onMissed);
      socket.off('call:busy',      onBusy);
      socket.off('call:error',     onError);
      socket.off('call:accepted',  onAccepted);
    };
  // Only re-subscribe when user changes; outbound/active read via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setIncoming, setOutbound, setActive, clearCalls]);
}
