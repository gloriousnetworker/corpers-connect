'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // When video ends, fade out then navigate
    const onEnded = () => {
      setFadeOut(true);
      setTimeout(() => router.replace('/onboarding'), 600);
    };

    // Fallback: if video can't play or takes too long, skip after 8s
    const fallback = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => router.replace('/onboarding'), 600);
    }, 8000);

    video.addEventListener('ended', onEnded);
    video.play().catch(() => {
      // Autoplay blocked — skip to onboarding
      router.replace('/onboarding');
    });

    return () => {
      video.removeEventListener('ended', onEnded);
      clearTimeout(fallback);
    };
  }, [isAuthenticated, user, router]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{
        transition: 'opacity 0.6s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      <video
        ref={videoRef}
        src="/splashvideo.mp4"
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
