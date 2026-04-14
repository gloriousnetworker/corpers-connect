'use client';

/**
 * useAgora — manages a single Agora RTC session.
 *
 * All Agora SDK imports happen inside callbacks / useEffect so the module is
 * never evaluated on the server (Next.js App Router still SSR-renders
 * 'use client' components during hydration).
 *
 * Call flow:
 *   1. join(appId, channelName, token, uid, callType) — creates tracks + publishes
 *   2. Remote participant auto-subscribed via 'user-published' event
 *   3. leave() — stops/closes all tracks and disconnects from channel
 */

import { useRef, useState, useCallback, useEffect } from 'react';

// --- Agora type aliases (avoid top-level SDK import) -------------------------
type IAgoraRTCClient       = import('agora-rtc-sdk-ng').IAgoraRTCClient;
type IMicrophoneAudioTrack = import('agora-rtc-sdk-ng').IMicrophoneAudioTrack;
type ILocalVideoTrack      = import('agora-rtc-sdk-ng').ILocalVideoTrack;
type IRemoteVideoTrack     = import('agora-rtc-sdk-ng').IRemoteVideoTrack;

// Loader — call once; result is cached by the module system
async function loadAgora() {
  const mod = await import('agora-rtc-sdk-ng');
  return mod.default;
}

export interface UseAgoraOptions {
  /**
   * Called when the Agora token is about to expire (~30 s before expiry).
   * Should return a fresh token from the backend.
   */
  onTokenWillExpire?: () => Promise<string>;
}

export function useAgora({ onTokenWillExpire }: UseAgoraOptions = {}) {
  const clientRef         = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef     = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef     = useRef<ILocalVideoTrack | null>(null);
  const remoteVideoRef    = useRef<IRemoteVideoTrack | null>(null);

  // DOM container refs for video playback
  const localVideoElRef  = useRef<HTMLDivElement | null>(null);
  const remoteVideoElRef = useRef<HTMLDivElement | null>(null);

  const [isJoined,         setIsJoined]         = useState(false);
  const [isMuted,          setIsMuted]          = useState(false);
  const [isCameraOff,      setIsCameraOff]      = useState(false);
  const [permissionErr,    setPermissionErr]    = useState<string | null>(null);
  const [cameraBlocked,    setCameraBlocked]    = useState(false);
  const [remoteHasVideo,   setRemoteHasVideo]   = useState(false);

  // ── join ──────────────────────────────────────────────────────────────────

  const join = useCallback(async (
    appId:       string,
    channelName: string,
    token:       string,
    uid:         number,
    callType:    'VOICE' | 'VIDEO',
  ) => {
    try {
      setPermissionErr(null);
      const AgoraRTC = await loadAgora();
      AgoraRTC.setLogLevel(4); // Error only — reduces console noise

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // ── Remote track subscription ────────────────────────────────────────
      client.on('user-published', async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play();
        }
        if (mediaType === 'video' && remoteUser.videoTrack) {
          remoteVideoRef.current = remoteUser.videoTrack;
          setRemoteHasVideo(true);
          if (remoteVideoElRef.current) {
            remoteUser.videoTrack.play(remoteVideoElRef.current);
          }
        }
      });

      client.on('user-unpublished', (_remoteUser, mediaType) => {
        if (mediaType === 'video') {
          remoteVideoRef.current = null;
          setRemoteHasVideo(false);
        }
      });

      // ── Token renewal ────────────────────────────────────────────────────
      client.on('token-privilege-will-expire', async () => {
        if (onTokenWillExpire) {
          try {
            const newToken = await onTokenWillExpire();
            await client.renewToken(newToken);
          } catch { /* best-effort */ }
        }
      });

      // ── Join channel (20 s timeout so UI never hangs forever) ───────────
      await Promise.race([
        client.join(appId, channelName, token, uid),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out')), 20_000)
        ),
      ]);

      // ── Create and publish local tracks ──────────────────────────────────
      // Always create microphone first — this must succeed.
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioRef.current = audioTrack;

      if (callType === 'VIDEO') {
        try {
          // Use getUserMedia + createCustomVideoTrack — the most compatible path
          // across all browsers and platforms (desktop Chrome, mobile Safari, etc.).
          // createCameraVideoTrack can silently fail on some laptops/OS combos.
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          });
          const videoTrack = AgoraRTC.createCustomVideoTrack({
            mediaStreamTrack: videoStream.getVideoTracks()[0],
          });
          localVideoRef.current = videoTrack;
          await client.publish([audioTrack, videoTrack]);
          if (localVideoElRef.current) {
            videoTrack.play(localVideoElRef.current);
          }
        } catch {
          // Camera unavailable/denied — continue call with audio only.
          setCameraBlocked(true);
          await client.publish([audioTrack]);
        }
      } else {
        await client.publish([audioTrack]);
      }

      setIsJoined(true);
    } catch (err: unknown) {
      const e = err as Error;
      if (
        e.name === 'NotAllowedError' ||
        e.message?.includes('Permission denied') ||
        e.message?.includes('NotAllowedError')
      ) {
        const isVideo = callType === 'VIDEO';
        setPermissionErr(isVideo
          ? 'Camera and microphone access was denied. Please allow access in your browser settings.'
          : 'Microphone access was denied. Please allow access in your browser settings.'
        );
      } else {
        setPermissionErr('Unable to connect to the call. Please try again.');
      }
      // Clean up partial state
      localAudioRef.current?.stop();
      localAudioRef.current?.close();
      localAudioRef.current = null;
      localVideoRef.current?.stop();
      localVideoRef.current?.close();
      localVideoRef.current = null;
      if (clientRef.current) {
        try { await clientRef.current.leave(); } catch { /* ignore */ }
        clientRef.current = null;
      }
    }
  }, [onTokenWillExpire]);

  // ── leave ─────────────────────────────────────────────────────────────────

  const leave = useCallback(async () => {
    localAudioRef.current?.stop();
    localAudioRef.current?.close();
    localAudioRef.current = null;

    localVideoRef.current?.stop();
    localVideoRef.current?.close();
    localVideoRef.current = null;

    remoteVideoRef.current = null;

    if (clientRef.current) {
      try { await clientRef.current.leave(); } catch { /* ignore */ }
      clientRef.current = null;
    }

    setIsJoined(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setRemoteHasVideo(false);
    setPermissionErr(null);
    setCameraBlocked(false);
  }, []);

  // ── controls ──────────────────────────────────────────────────────────────

  const toggleMute = useCallback(async () => {
    if (!localAudioRef.current) return;
    const next = !isMuted;
    await localAudioRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    if (!localVideoRef.current) return;
    const next = !isCameraOff;
    await localVideoRef.current.setMuted(next);
    setIsCameraOff(next);
  }, [isCameraOff]);

  const switchCamera = useCallback(async () => {
    if (!localVideoRef.current) return;
    try {
      // Swap the underlying MediaStreamTrack using getUserMedia with rear camera
      const facing = isCameraOff ? 'user' : 'environment';
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      const newTrack = stream.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (localVideoRef.current as unknown as any).replaceTrack?.(newTrack);
    } catch { /* device switching not supported on this device */ }
  }, [isCameraOff]);

  /**
   * Request camera access mid-call (for when permission was initially denied).
   * Creates a new camera track, publishes it, and plays it locally.
   * Returns 'granted' | 'denied' | 'no-client'.
   */
  const enableCamera = useCallback(async (): Promise<'granted' | 'denied' | 'no-client'> => {
    if (!clientRef.current) return 'no-client';
    try {
      const AgoraRTC = await loadAgora();
      // getUserMedia triggers the browser Allow/Block dialog and immediately
      // provides the stream — we hand the track directly to Agora so there
      // is no "release + re-acquire" race that can fail on some laptops.
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const videoTrack = AgoraRTC.createCustomVideoTrack({
        mediaStreamTrack: videoStream.getVideoTracks()[0],
      });
      localVideoRef.current = videoTrack;
      await clientRef.current.publish([videoTrack]);
      if (localVideoElRef.current) {
        videoTrack.play(localVideoElRef.current);
      }
      setCameraBlocked(false);
      return 'granted';
    } catch {
      return 'denied';
    }
  }, []);

  const renewToken = useCallback(async (token: string) => {
    if (clientRef.current) {
      await clientRef.current.renewToken(token);
    }
  }, []);

  // ── video container setters (called from ref callbacks in JSX) ────────────

  const setLocalVideoEl = useCallback((el: HTMLDivElement | null) => {
    localVideoElRef.current = el;
    if (el && localVideoRef.current) {
      localVideoRef.current.play(el);
    }
  }, []);

  const setRemoteVideoEl = useCallback((el: HTMLDivElement | null) => {
    remoteVideoElRef.current = el;
    if (el && remoteVideoRef.current) {
      remoteVideoRef.current.play(el);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { leave(); }, [leave]);

  return {
    join,
    leave,
    toggleMute,
    toggleCamera,
    switchCamera,
    renewToken,
    setLocalVideoEl,
    setRemoteVideoEl,
    isJoined,
    isMuted,
    isCameraOff,
    remoteHasVideo,
    permissionErr,
    cameraBlocked,
    enableCamera,
  };
}
