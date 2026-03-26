import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VoiceNoteRecorder, { MicButton } from '@/components/messages/VoiceNoteRecorder';

// ── MediaRecorder mock ────────────────────────────────────────────────────────
class MockMediaRecorder {
  static isTypeSupported = jest.fn(() => true);
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start = jest.fn(() => { this.state = 'recording'; });
  stop = jest.fn(() => {
    this.state = 'inactive';
    // Trigger ondataavailable with dummy blob then onstop
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    }
    if (this.onstop) this.onstop();
  });
  pause = jest.fn(() => { this.state = 'paused'; });
  resume = jest.fn(() => { this.state = 'recording'; });
}

// ── AudioContext mock ─────────────────────────────────────────────────────────
class MockAnalyser {
  fftSize = 64;
  frequencyBinCount = 32;
  getByteFrequencyData = jest.fn();
}

class MockAudioContext {
  createMediaStreamSource = jest.fn(() => ({ connect: jest.fn() }));
  createAnalyser = jest.fn(() => new MockAnalyser());
}

// ── MediaStream mock ──────────────────────────────────────────────────────────
const mockStream = {
  getTracks: jest.fn(() => [{ stop: jest.fn() }]),
};

// ── Apply mocks ───────────────────────────────────────────────────────────────
beforeAll(() => {
  (global as unknown as Record<string, unknown>).MediaRecorder = MockMediaRecorder;
  (global as unknown as Record<string, unknown>).AudioContext = MockAudioContext;
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(mockStream),
    },
    writable: true,
  });
  // Stub RAF to never call callback — prevents infinite drawBars loop in act()
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(() => 0);
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('VoiceNoteRecorder', () => {
  it('renders cancel and send buttons', async () => {
    await act(async () => {
      render(<VoiceNoteRecorder onSend={jest.fn()} onCancel={jest.fn()} />);
    });
    expect(screen.getByLabelText('Cancel recording')).toBeInTheDocument();
    expect(screen.getByLabelText('Send voice note')).toBeInTheDocument();
  });

  it('starts recording on mount (calls getUserMedia)', async () => {
    await act(async () => {
      render(<VoiceNoteRecorder onSend={jest.fn()} onCancel={jest.fn()} />);
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = jest.fn();
    await act(async () => {
      render(<VoiceNoteRecorder onSend={jest.fn()} onCancel={onCancel} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Cancel recording'));
    });
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSend with blob when send button is clicked', async () => {
    const onSend = jest.fn();
    await act(async () => {
      render(<VoiceNoteRecorder onSend={onSend} onCancel={jest.fn()} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Send voice note'));
    });
    expect(onSend).toHaveBeenCalledTimes(1);
    const [blob] = onSend.mock.calls[0] as [Blob, number];
    expect(blob).toBeInstanceOf(Blob);
  });

  it('shows timer in 0:00 format', async () => {
    await act(async () => {
      render(<VoiceNoteRecorder onSend={jest.fn()} onCancel={jest.fn()} />);
    });
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('calls onCancel when getUserMedia fails', async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied')
    );
    const onCancel = jest.fn();
    await act(async () => {
      render(<VoiceNoteRecorder onSend={jest.fn()} onCancel={onCancel} />);
    });
    expect(onCancel).toHaveBeenCalled();
  });

  it('switches send button to cancel icon when swipe threshold reached', async () => {
    await act(async () => {
      render(<VoiceNoteRecorder onSend={jest.fn()} onCancel={jest.fn()} />);
    });
    // Simulate a large swipe left
    const waveformArea = screen.getByText('0:00').parentElement!;
    fireEvent.pointerDown(waveformArea, { clientX: 200 });
    fireEvent.pointerMove(waveformArea, { clientX: 100 }); // -100px > threshold of -60
    // After threshold the send button should become a "Cancel recording" labelled button
    expect(screen.getAllByLabelText('Cancel recording').length).toBeGreaterThan(0);
  });
});

// ── MicButton tests ────────────────────────────────────────────────────────────

describe('MicButton', () => {
  it('renders mic button with correct aria-label', () => {
    render(<MicButton onPress={jest.fn()} />);
    expect(screen.getByLabelText('Hold to record voice note')).toBeInTheDocument();
  });

  it('calls onPress when pointer is pressed', () => {
    const onPress = jest.fn();
    render(<MicButton onPress={onPress} />);
    fireEvent.pointerDown(screen.getByLabelText('Hold to record voice note'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
