'use client';

/**
 * ActiveCallScreen — full-screen overlay for an ongoing call.
 *
 * VOICE call: dark background, large partner avatar, duration timer, controls.
 * VIDEO call: remote video fills screen, local video pip (top-right), controls.
 *
 * Both parties can end the call; the ending party emits call:end and the
 * other party is notified via call:ended (handled in useCallSocket).
 */

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { getExistingCallsSocket } from '@/lib/socket';
import { useCallsStore } from '@/store/calls.store';
import { useAgora } from '@/hooks/useAgora';
import { refreshCallToken } from '@/lib/api/calls';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import CallDurationTimer from './CallDurationTimer';
import CallControls from './CallControls';
import type { ActiveCallData } from '@/store/calls.store';

interface ActiveCallScreenProps {
  call: ActiveCallData;
}

export default function ActiveCallScreen({ call }: ActiveCallScreenProps) {
  const clearCalls = useCallsStore((s) => s.clearCalls);

  const [cameraEnabling, setCameraEnabling] = useState(false);
  const [cameraHardBlocked, setCameraHardBlocked] = useState(false);

  const {
    join,
    leave,
    toggleMute,
    toggleCamera,
    switchCamera,
    enableCamera,
    startRecording,
    stopRecording,
    isMuted,
    isCameraOff,
    isJoined,
    permissionErr,
    cameraBlocked,
    remoteHasVideo,
    isRecording,
    recordingDuration,
    setLocalVideoEl,
    setRemoteVideoEl,
  } = useAgora({
    onTokenWillExpire: async () => {
      const res = await refreshCallToken(call.callId);
      return res.token;
    },
  });

  // Join Agora channel on mount
  useEffect(() => {
    join(call.appId, call.channelName, call.token, call.uid, call.type);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  const handleEnableCamera = useCallback(async () => {
    setCameraEnabling(true);
    setCameraHardBlocked(false);
    const result = await enableCamera();
    if (result === 'denied') setCameraHardBlocked(true);
    setCameraEnabling(false);
  }, [enableCamera]);

  const handleEnd = async () => {
    if (call.isGroup) {
      // Group call — just disconnect locally; the channel stays alive for others
      await leave();
      clearCalls();
    } else {
      // 1:1 call — notify the other party so their screen closes too
      const socket = getExistingCallsSocket();
      socket?.emit('call:end', { callId: call.callId });
      await leave();
      clearCalls();
    }
  };

  const partnerName = `${call.partner.firstName} ${call.partner.lastName}`;
  const initials    = getInitials(call.partner.firstName, call.partner.lastName);
  const isVideo     = call.type === 'VIDEO';

  return (
    <div className="fixed inset-0 z-[100] bg-[#011a11] flex flex-col overflow-hidden">

      {/* ── Camera permission banner ──────────────────────────────────────── */}
      {isVideo && cameraBlocked && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-black/80 border border-yellow-400/60 text-white rounded-2xl px-4 py-4 flex flex-col gap-3 shadow-xl">
          <div>
            <p className="font-semibold text-sm text-yellow-300">Camera access needed</p>
            {cameraHardBlocked ? (
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Camera access is blocked. In your browser, go to{' '}
                <strong>Settings → Privacy &amp; Security → Site Settings → Camera</strong>{' '}
                and allow <em>this site</em>, then refresh the page.
              </p>
            ) : (
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Your browser needs permission to use the camera. Tap the button below
                and click <strong>Allow</strong> when prompted.
              </p>
            )}
          </div>
          {!cameraHardBlocked && (
            <button
              onClick={handleEnableCamera}
              disabled={cameraEnabling}
              className="self-start bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 disabled:opacity-60 text-black font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
            >
              {cameraEnabling ? 'Requesting…' : 'Enable Camera'}
            </button>
          )}
        </div>
      )}

      {/* ── VIDEO: remote feed fills screen ──────────────────────────────── */}
      {isVideo && (
        <>
          {/* Remote video (full screen) */}
          <div
            ref={setRemoteVideoEl}
            className="absolute inset-0 bg-black [&_video]:absolute [&_video]:inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          >
            {!remoteHasVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                  {call.partner.profilePicture ? (
                    <Image
                      src={getAvatarUrl(call.partner.profilePicture, 192)}
                      alt={partnerName}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white uppercase">{initials}</span>
                  )}
                </div>
                <p className="text-white/60 text-sm">Camera off</p>
              </div>
            )}
          </div>

          {/* Local video PiP (top-right) */}
          <div
            ref={setLocalVideoEl}
            className="absolute top-16 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 bg-black z-10 [&_video]:absolute [&_video]:inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />
        </>
      )}

      {/* ── VOICE: avatar + gradient ─────────────────────────────────────── */}
      {!isVideo && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#011a11] to-[#003320]">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center border-4 border-primary/30">
            {call.partner.profilePicture ? (
              <Image
                src={getAvatarUrl(call.partner.profilePicture, 224)}
                alt={partnerName}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-4xl font-bold text-white uppercase">{initials}</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">{partnerName}</h2>
          {permissionErr ? (
            <p className="text-red-300 text-sm text-center px-6">{permissionErr}</p>
          ) : isJoined ? (
            <CallDurationTimer startedAt={call.startedAt} className="text-green-300 text-lg tabular-nums" />
          ) : (
            <p className="text-green-300 text-sm animate-pulse">Connecting…</p>
          )}
        </div>
      )}

      {/* ── VIDEO: name + timer overlay (bottom strip) ───────────────────── */}
      {isVideo && (
        <div className="absolute bottom-36 left-0 right-0 flex flex-col items-center gap-1 z-10">
          <p className="text-white font-semibold text-lg drop-shadow">{partnerName}</p>
          {isJoined ? (
            <CallDurationTimer startedAt={call.startedAt} className="text-green-300 text-sm tabular-nums drop-shadow" />
          ) : (
            <p className="text-green-300 text-sm animate-pulse drop-shadow">Connecting…</p>
          )}
        </div>
      )}

      {/* ── Controls (always at bottom) ──────────────────────────────────── */}
      <div className={`${isVideo ? 'absolute bottom-10 left-0 right-0 z-10' : ''} pb-safe-bottom`}>
        <CallControls
          callType={isVideo ? 'VIDEO' : 'VOICE'}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={isVideo ? toggleCamera : undefined}
          onSwitchCamera={isVideo ? switchCamera : undefined}
          onEnd={handleEnd}
          endLabel={call.isGroup ? 'Leave' : undefined}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          onStartRecording={!isVideo ? startRecording : undefined}
          onStopRecording={!isVideo ? stopRecording : undefined}
        />
      </div>
    </div>
  );
}
