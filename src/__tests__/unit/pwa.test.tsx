/**
 * Unit tests for Phase 11 — PWA, Performance & Polish
 * Covers: useHaptic, useServiceWorker, UpdateBanner, AppImage, offline page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
}));

// Default: no update available — individual tests override via mockImplementation
jest.mock('@/hooks/useServiceWorker', () => ({
  useServiceWorker: jest.fn(() => ({ updateAvailable: false, applyUpdate: jest.fn() })),
}));

jest.mock('@/components/shared/Logo', () => ({
  __esModule: true,
  default: ({ size }: { size?: string }) => <div data-testid="logo" data-size={size} />,
}));

// next/image mock — renders a plain img for tests
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, onClick, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; blurDataURL?: string; placeholder?: string; sizes?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src as string} alt={alt} className={className} onClick={onClick} data-testid="next-image" />
  ),
}));

// ── useHaptic ─────────────────────────────────────────────────────────────────

describe('useHaptic', () => {
  const vibrateMock = jest.fn();

  beforeEach(() => {
    vibrateMock.mockClear();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });
  });

  async function getHaptic() {
    const { useHaptic } = await import('@/hooks/useHaptic');
    return useHaptic;
  }

  it('light() calls vibrate with 20ms', async () => {
    const useHaptic = await getHaptic();
    const { result } = renderHook(() => useHaptic());
    result.current.light();
    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it('medium() calls vibrate with 40ms', async () => {
    const useHaptic = await getHaptic();
    const { result } = renderHook(() => useHaptic());
    result.current.medium();
    expect(vibrateMock).toHaveBeenCalledWith(40);
  });

  it('heavy() calls vibrate with 70ms', async () => {
    const useHaptic = await getHaptic();
    const { result } = renderHook(() => useHaptic());
    result.current.heavy();
    expect(vibrateMock).toHaveBeenCalledWith(70);
  });

  it('success() calls vibrate with double-pulse pattern', async () => {
    const useHaptic = await getHaptic();
    const { result } = renderHook(() => useHaptic());
    result.current.success();
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30]);
  });

  it('error() calls vibrate with triple-buzz pattern', async () => {
    const useHaptic = await getHaptic();
    const { result } = renderHook(() => useHaptic());
    result.current.error();
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
  });

  it('custom() passes arbitrary pattern to vibrate', async () => {
    const useHaptic = await getHaptic();
    const { result } = renderHook(() => useHaptic());
    result.current.custom([100, 50, 100]);
    expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('does not throw if vibrate is not available', async () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const useHaptic = await getHaptic();
    const { result } = renderHook(() => useHaptic());
    expect(() => result.current.medium()).not.toThrow();
  });
});

// ── useServiceWorker ──────────────────────────────────────────────────────────

describe('useServiceWorker', () => {
  it('returns updateAvailable=false when no waiting worker', async () => {
    // serviceWorker not in navigator by default in jsdom
    const { useServiceWorker } = await import('@/hooks/useServiceWorker');
    const { result } = renderHook(() => useServiceWorker());
    expect(result.current.updateAvailable).toBe(false);
  });

  it('applyUpdate is a function', async () => {
    const { useServiceWorker } = await import('@/hooks/useServiceWorker');
    const { result } = renderHook(() => useServiceWorker());
    expect(typeof result.current.applyUpdate).toBe('function');
  });

  it('applyUpdate does not throw when no waiting worker', async () => {
    const { useServiceWorker } = await import('@/hooks/useServiceWorker');
    const { result } = renderHook(() => useServiceWorker());
    expect(() => result.current.applyUpdate()).not.toThrow();
  });
});

// ── UpdateBanner ──────────────────────────────────────────────────────────────

describe('UpdateBanner', () => {
  let useServiceWorkerMock: jest.Mock;

  beforeEach(async () => {
    const mod = await import('@/hooks/useServiceWorker');
    useServiceWorkerMock = mod.useServiceWorker as jest.Mock;
    useServiceWorkerMock.mockReturnValue({ updateAvailable: false, applyUpdate: jest.fn() });
  });

  it('renders nothing when no update available', async () => {
    const { default: UpdateBanner } = await import('@/components/pwa/UpdateBanner');
    const { container } = render(<UpdateBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when update is available', async () => {
    useServiceWorkerMock.mockReturnValue({ updateAvailable: true, applyUpdate: jest.fn() });
    const { default: UpdateBanner } = await import('@/components/pwa/UpdateBanner');
    render(<UpdateBanner />);
    expect(screen.getByTestId('update-banner')).toBeInTheDocument();
    expect(screen.getByText('A new version is available')).toBeInTheDocument();
  });

  it('shows Update button when update is available', async () => {
    useServiceWorkerMock.mockReturnValue({ updateAvailable: true, applyUpdate: jest.fn() });
    const { default: UpdateBanner } = await import('@/components/pwa/UpdateBanner');
    render(<UpdateBanner />);
    expect(screen.getByRole('button', { name: /update app/i })).toBeInTheDocument();
  });

  it('calls applyUpdate on button click', async () => {
    const applyUpdate = jest.fn();
    useServiceWorkerMock.mockReturnValue({ updateAvailable: true, applyUpdate });
    const { default: UpdateBanner } = await import('@/components/pwa/UpdateBanner');
    render(<UpdateBanner />);
    fireEvent.click(screen.getByRole('button', { name: /update app/i }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('has correct role and aria-live for accessibility', async () => {
    useServiceWorkerMock.mockReturnValue({ updateAvailable: true, applyUpdate: jest.fn() });
    const { default: UpdateBanner } = await import('@/components/pwa/UpdateBanner');
    render(<UpdateBanner />);
    const banner = screen.getByTestId('update-banner');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });
});

// ── AppImage ──────────────────────────────────────────────────────────────────

describe('AppImage', () => {
  async function getAppImage() {
    const { default: AppImage } = await import('@/components/shared/AppImage');
    return AppImage;
  }

  it('renders next/image when src is provided', async () => {
    const AppImage = await getAppImage();
    render(<AppImage src="https://res.cloudinary.com/test.jpg" alt="test" width={100} height={100} />);
    expect(screen.getByTestId('next-image')).toBeInTheDocument();
    expect(screen.getByTestId('next-image')).toHaveAttribute('alt', 'test');
  });

  it('renders placeholder div when src is null', async () => {
    const AppImage = await getAppImage();
    const { container } = render(<AppImage src={null} alt="missing" width={100} height={100} />);
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders placeholder div when src is undefined', async () => {
    const AppImage = await getAppImage();
    const { container } = render(<AppImage src={undefined} alt="missing" width={100} height={100} />);
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders placeholder div when src is empty string', async () => {
    const AppImage = await getAppImage();
    const { container } = render(<AppImage src="" alt="empty" width={100} height={100} />);
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes onClick handler to the image', async () => {
    const onClick = jest.fn();
    const AppImage = await getAppImage();
    render(<AppImage src="https://res.cloudinary.com/img.jpg" alt="click" width={50} height={50} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('next-image'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', async () => {
    const AppImage = await getAppImage();
    render(<AppImage src="https://res.cloudinary.com/img.jpg" alt="cls" width={50} height={50} className="rounded-full" />);
    expect(screen.getByTestId('next-image').className).toContain('rounded-full');
  });
});

// ── Offline Page ──────────────────────────────────────────────────────────────

describe('OfflinePage', () => {
  const originalOnline = Object.getOwnPropertyDescriptor(navigator, 'onLine');

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
  });

  afterEach(() => {
    if (originalOnline) {
      Object.defineProperty(navigator, 'onLine', originalOnline);
    }
  });

  async function getOfflinePage() {
    const mod = await import('@/app/offline/page');
    return mod.default;
  }

  it('renders offline heading', async () => {
    const Page = await getOfflinePage();
    render(<Page />);
    expect(await screen.findByText("You're offline")).toBeInTheDocument();
  });

  it('renders the logo', async () => {
    const Page = await getOfflinePage();
    render(<Page />);
    expect(await screen.findByTestId('logo')).toBeInTheDocument();
  });

  it('renders try again button', async () => {
    const Page = await getOfflinePage();
    render(<Page />);
    expect(await screen.findByRole('button', { name: /retry connection/i })).toBeInTheDocument();
  });

  it('shows offline tips section', async () => {
    const Page = await getOfflinePage();
    render(<Page />);
    expect(await screen.findByText('While you wait')).toBeInTheDocument();
  });

  it('shows checking connection text while retrying', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
    const Page = await getOfflinePage();
    render(<Page />);
    const btn = await screen.findByRole('button', { name: /retry connection/i });
    fireEvent.click(btn);
    expect(await screen.findByText('Checking connection…')).toBeInTheDocument();
  });

  it('button is disabled while retrying', async () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    const Page = await getOfflinePage();
    render(<Page />);
    const btn = await screen.findByRole('button', { name: /retry connection/i });
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
  });
});
