'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(skipTimer);
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force play on mount — try multiple times for mobile compatibility
    const attemptPlay = () => {
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    };

    attemptPlay();

    // Retry after a short delay in case first attempt fails
    const retryTimer = setTimeout(attemptPlay, 300);

    return () => clearTimeout(retryTimer);
  }, []);

  const handleSkip = () => {
    router.replace('/onboarding');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        className="w-full h-full object-cover"
        style={{ display: 'block' }}
      >
        <source src="/splashvideo.mp4" type="video/mp4" />
      </video>

      {/* Skip button — appears after 2 seconds */}
      {showSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-12 right-5 z-10 px-4 py-2 rounded-full
                     bg-black/50 backdrop-blur-sm border border-white/20
                     text-white text-sm font-medium
                     transition-opacity duration-500 animate-fadeIn
                     active:bg-black/70"
        >
          Skip →
        </button>
      )}
    </div>
  );
}
