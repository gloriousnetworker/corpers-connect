'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Mic, Trash2, Send, ChevronLeft } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSend: (blob: Blob, durationMs: number) => void;
  onCancel: () => void;
}

const WAVEFORM_BARS = 20;
const CANCEL_THRESHOLD = -60; // px swipe left to cancel

export default function VoiceNoteRecorder({ onSend, onCancel }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const [bars, setBars] = useState<number[]>(Array(WAVEFORM_BARS).fill(3));
  const [swipeX, setSwipeX] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startXRef = useRef<number | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up analyser for waveform
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArr = new Uint8Array(analyser.frequencyBinCount);

      const drawBars = () => {
        analyser.getByteFrequencyData(dataArr);
        const step = Math.floor(dataArr.length / WAVEFORM_BARS);
        const newBars = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
          const val = dataArr[i * step] ?? 0;
          return Math.max(3, Math.round((val / 255) * 28));
        });
        setBars(newBars);
        rafRef.current = requestAnimationFrame(drawBars);
      };
      rafRef.current = requestAnimationFrame(drawBars);

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(100);

      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsed(0);
      setSwipeX(0);
      setCancelled(false);

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 200);
    } catch {
      onCancel();
    }
  }, [onCancel]);

  const stopAndSend = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;
    const duration = Date.now() - startTimeRef.current;
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      stopStream();
      setIsRecording(false);
      onSend(blob, duration);
    };
    mr.stop();
  }, [stopStream, onSend]);

  const cancelRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
    stopStream();
    setIsRecording(false);
    setCancelled(false);
    setBars(Array(WAVEFORM_BARS).fill(3));
    onCancel();
  }, [stopStream, onCancel]);

  useEffect(() => {
    startRecording();
    return () => {
      // Cleanup on unmount without sending
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') mr.stop();
      stopStream();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isRecording || startXRef.current === null) return;
    const delta = e.clientX - startXRef.current;
    if (delta < 0) {
      setSwipeX(delta);
      setCancelled(delta <= CANCEL_THRESHOLD);
    }
  }, [isRecording]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface border-t border-border">
      {/* Cancel / swipe hint */}
      <button
        onClick={cancelRecording}
        className="p-2 rounded-full text-foreground-muted hover:bg-surface-alt transition-colors flex-shrink-0"
        aria-label="Cancel recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Waveform + timer */}
      <div
        className="flex-1 flex items-center gap-2 min-w-0"
        style={{ transform: `translateX(${Math.max(CANCEL_THRESHOLD, swipeX)}px)`, transition: 'transform 0.05s' }}
        onPointerMove={handlePointerMove}
        onPointerDown={(e) => { startXRef.current = e.clientX; }}
        onPointerUp={() => { startXRef.current = null; setSwipeX(0); }}
      >
        {/* Recording dot */}
        <span className="w-2 h-2 rounded-full bg-danger animate-pulse flex-shrink-0" />

        {/* Waveform bars */}
        <div className="flex items-center gap-px flex-1 overflow-hidden" aria-hidden="true">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-75 ${cancelled ? 'bg-danger' : 'bg-primary'}`}
              style={{ height: `${h}px`, minWidth: '2px' }}
            />
          ))}
        </div>

        {/* Timer */}
        <span className="text-xs text-foreground-muted tabular-nums flex-shrink-0">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Swipe-to-cancel hint */}
      <div className="flex items-center gap-1 text-xs text-foreground-muted flex-shrink-0">
        <ChevronLeft className="w-3 h-3" />
        <span className="hidden sm:inline">slide to cancel</span>
      </div>

      {/* Send / confirm cancel */}
      <button
        onClick={cancelled ? cancelRecording : stopAndSend}
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${
          cancelled
            ? 'bg-danger text-white'
            : 'bg-primary text-white hover:bg-primary-dark'
        }`}
        aria-label={cancelled ? 'Cancel recording' : 'Send voice note'}
      >
        {cancelled
          ? <Trash2 className="w-5 h-5" />
          : <Send className="w-5 h-5" />
        }
      </button>
    </div>
  );
}

// ── Trigger button shown in MessageInput when no text is typed ─────────────────
export function MicButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onPointerDown={onPress}
      className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0 transition-all hover:bg-primary-dark active:scale-95"
      aria-label="Hold to record voice note"
    >
      <Mic className="w-5 h-5 text-white" />
    </button>
  );
}
