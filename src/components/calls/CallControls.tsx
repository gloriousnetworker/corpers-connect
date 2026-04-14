'use client';

import { useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, RotateCcw, PhoneOff, Volume2, VolumeX, Circle, StopCircle } from 'lucide-react';

interface CallControlsProps {
  callType:        'VOICE' | 'VIDEO';
  isMuted:         boolean;
  isCameraOff:     boolean;
  onToggleMute:    () => void;
  onToggleCamera?: () => void;
  onSwitchCamera?: () => void;
  onEnd:           () => void;
  endLabel?:       string;
  isRecording?:    boolean;
  recordingDuration?: number;
  onStartRecording?: () => void;
  onStopRecording?:  () => void;
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallControls({
  callType,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  onEnd,
  endLabel,
  isRecording = false,
  recordingDuration = 0,
  onStartRecording,
  onStopRecording,
}: CallControlsProps) {
  const [speakerOff, setSpeakerOff] = useState(false);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOff;
    setSpeakerOff(next);
    // Mute/unmute all audio elements on the page (Agora plays remote audio via HTMLAudioElement)
    document.querySelectorAll('audio').forEach((el) => {
      el.muted = next;
    });
  }, [speakerOff]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-semibold tabular-nums">
            REC {formatDuration(recordingDuration)}
          </span>
        </div>
      )}
    <div className="flex items-center justify-center gap-5">
      {/* Mute / Unmute mic */}
      <button
        onClick={onToggleMute}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
          isMuted
            ? 'bg-red-500/90 text-white'
            : 'bg-white/20 text-white hover:bg-white/30'
        }`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      {/* Speaker toggle */}
      <button
        onClick={toggleSpeaker}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
          speakerOff
            ? 'bg-red-500/90 text-white'
            : 'bg-white/20 text-white hover:bg-white/30'
        }`}
        aria-label={speakerOff ? 'Unmute speaker' : 'Mute speaker'}
      >
        {speakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      {/* Camera toggle (VIDEO only) */}
      {callType === 'VIDEO' && onToggleCamera && (
        <button
          onClick={onToggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isCameraOff
              ? 'bg-red-500/90 text-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          aria-label={isCameraOff ? 'Camera on' : 'Camera off'}
        >
          {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
      )}

      {/* Flip camera (VIDEO only) */}
      {callType === 'VIDEO' && onSwitchCamera && (
        <button
          onClick={onSwitchCamera}
          className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Flip camera"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      )}

      {/* Record button (VOICE only — video recording is a separate feature) */}
      {callType === 'VOICE' && (onStartRecording || onStopRecording) && (
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isRecording
              ? 'bg-red-500/90 text-white animate-pulse'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <StopCircle className="w-6 h-6" /> : <Circle className="w-5 h-5 fill-current" />}
        </button>
      )}

      {/* End / Leave call */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg"
          aria-label={endLabel ?? 'End call'}
        >
          <PhoneOff className="w-7 h-7" />
        </button>
        {endLabel && (
          <span className="text-white/70 text-xs">{endLabel}</span>
        )}
      </div>
    </div>
    </div>
  );
}
