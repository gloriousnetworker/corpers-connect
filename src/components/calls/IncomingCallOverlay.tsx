'use client';

/**
 * IncomingCallOverlay — full-screen overlay shown when another user calls you.
 *
 * Auto-dismisses with call:no-answer after RING_TIMEOUT_MS if not answered.
 * Accepts → joins Agora channel → mounts ActiveCallScreen via store.
 * Rejects → emits call:reject → dismisses.
 */

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { getExistingSocket } from '@/lib/socket';
import { useCallsStore, type ActiveCallData } from '@/store/calls.store';
import { useAgora } from '@/hooks/useAgora';
import { refreshCallToken } from '@/lib/api/calls';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import type { IncomingCallData } from '@/store/calls.store';

const RING_TIMEOUT_MS = 30_000;

interface IncomingCallOverlayProps {
  call: IncomingCallData;
}

export default function IncomingCallOverlay({ call }: IncomingCallOverlayProps) {
  const setIncoming = useCallsStore((s) => s.setIncomingCall);
  const setActive   = useCallsStore((s) => s.setActiveCall);

  const { join } = useAgora({
    onTokenWillExpire: async () => {
      const res = await refreshCallToken(call.callId);
      return res.token;
    },
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIncoming(null);
  }, [setIncoming]);

  const handleReject = useCallback(() => {
    const socket = getExistingSocket();
    socket?.emit('call:reject', { callId: call.callId });
    dismiss();
  }, [call.callId, dismiss]);

  const handleAccept = useCallback(async () => {
    const socket = getExistingSocket();
    if (!socket) return;

    dismiss();

    socket.emit(
      'call:accept',
      { callId: call.callId },
      async (res: { success: boolean; data?: { callId: string; channelName: string; token: string; appId: string }; error?: string }) => {
        if (!res.success || !res.data) return;
        const { callId, channelName, token, appId } = res.data;

        // Join Agora as receiver (uid = 2)
        await join(appId, channelName, token, 2, call.type);

        const active: ActiveCallData = {
          callId,
          channelName,
          token,
          appId,
          type:      call.type,
          partner:   call.caller,
          uid:       2,
          startedAt: Date.now(),
        };
        setActive(active);
      },
    );
  }, [call, dismiss, join, setActive]);

  // Auto-timeout
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      const socket = getExistingSocket();
      // Receiver side: just dismiss; backend marks MISSED when caller sends call:no-answer
      dismiss();
    }, RING_TIMEOUT_MS);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [dismiss]);

  const callerName  = `${call.caller.firstName} ${call.caller.lastName}`;
  const initials    = getInitials(call.caller.firstName, call.caller.lastName);
  const isVideo     = call.type === 'VIDEO';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-[#011a11] to-[#003320] px-6 py-safe-bottom">
      {/* Top spacer */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-20">
        {/* Call type label */}
        <div className="flex items-center gap-1.5 text-green-300 text-sm font-medium">
          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Incoming {isVideo ? 'video' : 'voice'} call</span>
        </div>

        {/* Caller avatar — pulsing ring */}
        <div className="relative mt-4">
          {/* Pulse rings */}
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping scale-110" />
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping scale-125 animation-delay-300" />
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center border-4 border-primary/50">
            {call.caller.profilePicture ? (
              <Image
                src={getAvatarUrl(call.caller.profilePicture, 256)}
                alt={callerName}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <span className="text-4xl font-bold text-white uppercase">{initials}</span>
            )}
          </div>
        </div>

        {/* Caller name */}
        <h2 className="text-3xl font-bold text-white mt-2">{callerName}</h2>
        <p className="text-green-300 text-base animate-pulse">Ringing…</p>
      </div>

      {/* Action buttons */}
      <div className="w-full flex justify-around items-center pb-16">
        {/* Reject */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleReject}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:bg-red-600 transition-colors"
            aria-label="Decline call"
          >
            <PhoneOff className="w-9 h-9 text-white" />
          </button>
          <span className="text-white/70 text-sm">Decline</span>
        </div>

        {/* Accept */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleAccept}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg active:bg-primary/80 transition-colors"
            aria-label="Accept call"
          >
            <Phone className="w-9 h-9 text-white" />
          </button>
          <span className="text-white/70 text-sm">Accept</span>
        </div>
      </div>
    </div>
  );
}
