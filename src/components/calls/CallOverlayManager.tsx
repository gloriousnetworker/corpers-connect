'use client';

/**
 * CallOverlayManager — single mount point for all call overlays.
 *
 * Priority (highest → lowest):
 *   1. activeCall   → ActiveCallScreen  (both parties connected)
 *   2. outboundCall → OutboundCallOverlay (caller waiting)
 *   3. incomingCall → IncomingCallOverlay (receiver ringing)
 *
 * Renders nothing when idle.
 */

import { useCallsStore } from '@/store/calls.store';
import dynamic from 'next/dynamic';

// Dynamic imports keep heavy Agora SDK out of the initial bundle
const IncomingCallOverlay  = dynamic(() => import('./IncomingCallOverlay'),  { ssr: false });
const OutboundCallOverlay  = dynamic(() => import('./OutboundCallOverlay'),  { ssr: false });
const ActiveCallScreen     = dynamic(() => import('./ActiveCallScreen'),     { ssr: false });

export default function CallOverlayManager() {
  const activeCall   = useCallsStore((s) => s.activeCall);
  const outboundCall = useCallsStore((s) => s.outboundCall);
  const incomingCall = useCallsStore((s) => s.incomingCall);

  if (activeCall)   return <ActiveCallScreen    call={activeCall}   />;
  if (outboundCall) return <OutboundCallOverlay call={outboundCall} />;
  if (incomingCall) return <IncomingCallOverlay call={incomingCall} />;

  return null;
}
