'use client';

/**
 * OutboundCallOverlay — shown to the caller while waiting for the receiver
 * to pick up. Displays the receiver's avatar + a "Calling…" label.
 * Cancel sends call:no-answer which marks the call MISSED on the backend.
 */

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { PhoneOff, Phone, Video } from 'lucide-react';
import { getExistingSocket } from '@/lib/socket';
import { useCallsStore } from '@/store/calls.store';
import { getInitials } from '@/lib/utils';
import type { OutboundCallData } from '@/store/calls.store';

const RING_TIMEOUT_MS = 45_000; // Cancel automatically after 45 s

interface OutboundCallOverlayProps {
  call: OutboundCallData;
}

export default function OutboundCallOverlay({ call }: OutboundCallOverlayProps) {
  const setOutbound = useCallsStore((s) => s.setOutboundCall);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const socket = getExistingSocket();
    socket?.emit('call:no-answer', { callId: call.callId });
    setOutbound(null);
  };

  // Auto-cancel when caller waits too long
  useEffect(() => {
    timeoutRef.current = setTimeout(cancel, RING_TIMEOUT_MS);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const partnerName = `${call.partner.firstName} ${call.partner.lastName}`;
  const initials    = getInitials(call.partner.firstName, call.partner.lastName);
  const isVideo     = call.type === 'VIDEO';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-[#011a11] to-[#003320] px-6 py-safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-20">
        {/* Call type label */}
        <div className="flex items-center gap-1.5 text-green-300 text-sm font-medium">
          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>{isVideo ? 'Video' : 'Voice'} call</span>
        </div>

        {/* Partner avatar */}
        <div className="relative mt-4">
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping scale-110" />
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping scale-125 animation-delay-300" />
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center border-4 border-primary/50">
            {call.partner.profilePicture ? (
              <Image
                src={call.partner.profilePicture}
                alt={partnerName}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <span className="text-4xl font-bold text-white uppercase">{initials}</span>
            )}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-2">{partnerName}</h2>
        <p className="text-green-300 text-base animate-pulse">Calling…</p>
      </div>

      {/* Cancel button */}
      <div className="flex flex-col items-center gap-2 pb-16">
        <button
          onClick={cancel}
          className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:bg-red-600 transition-colors"
          aria-label="Cancel call"
        >
          <PhoneOff className="w-9 h-9 text-white" />
        </button>
        <span className="text-white/70 text-sm">Cancel</span>
      </div>
    </div>
  );
}
