'use client';

import { useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, RotateCcw, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface CallControlsProps {
  callType:      'VOICE' | 'VIDEO';
  isMuted:       boolean;
  isCameraOff:   boolean;
  onToggleMute:  () => void;
  onToggleCamera?: () => void;
  onSwitchCamera?: () => void;
  onEnd:         () => void;
}

export default function CallControls({
  callType,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  onEnd,
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

      {/* End call */}
      <button
        onClick={onEnd}
        className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg"
        aria-label="End call"
      >
        <PhoneOff className="w-7 h-7" />
      </button>
    </div>
  );
}
