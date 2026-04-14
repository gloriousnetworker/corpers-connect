import { create } from 'zustand';
import type { User } from '@/types/models';
import { CallType } from '@/types/enums';

/**
 * Data for an incoming call (receiver side) — shown in IncomingCallOverlay.
 */
export interface IncomingCallData {
  callId: string;
  callerId: string;
  caller: User;
  type: CallType;
  channelName: string;
  token: string;
  appId: string;
  /** UID assigned by the server for this participant in the Agora channel */
  uid?: number;
  /** True when this is a group call (no call:accept handshake needed) */
  isGroup?: boolean;
  groupName?: string;
}

/**
 * Data for an outbound call (caller side, waiting for answer) — shown in OutboundCallOverlay.
 */
export interface OutboundCallData {
  callId: string;
  type: CallType;
  partner: User;
  channelName: string;
  token: string;
  appId: string;
  /** UID for group calls where caller gets uid > 1; defaults to 1 for 1:1 calls */
  uid?: number;
}

/**
 * Data for an active (accepted) call — shown in ActiveCallScreen.
 */
export interface ActiveCallData {
  callId: string;
  channelName: string;
  token: string;
  appId: string;
  type: CallType;
  partner: User;
  /** 1 = caller, 2 = receiver — must match the UID used in the Agora token */
  uid: number;
  startedAt: number; // Date.now()
  /** True for group calls — ending only disconnects you, not the whole call */
  isGroup?: boolean;
}

interface CallsState {
  incomingCall: IncomingCallData | null;
  outboundCall: OutboundCallData | null;
  activeCall:   ActiveCallData   | null;

  setIncomingCall: (call: IncomingCallData | null) => void;
  setOutboundCall: (call: OutboundCallData | null) => void;
  setActiveCall:   (call: ActiveCallData   | null) => void;
  clearCalls:      () => void;
}

export const useCallsStore = create<CallsState>((set) => ({
  incomingCall: null,
  outboundCall: null,
  activeCall:   null,

  setIncomingCall: (call) => set({ incomingCall: call }),
  setOutboundCall: (call) => set({ outboundCall: call }),
  setActiveCall:   (call) => set({ activeCall: call }),
  clearCalls: () => set({ incomingCall: null, outboundCall: null, activeCall: null }),
}));
