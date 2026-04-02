'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [phase, setPhase] = useState<'logo' | 'text' | 'tagline' | 'out'>('logo');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // Animation sequence
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('tagline'), 1400);
    const t3 = setTimeout(() => setPhase('out'), 3200);
    const t4 = setTimeout(() => router.replace('/onboarding'), 3900);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [isAuthenticated, user, router]);

  const firstName = user?.firstName ?? '';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #004d2e 0%, #008751 45%, #00b368 100%)',
        transition: 'opacity 0.7s ease',
        opacity: phase === 'out' ? 0 : 1,
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          background: 'rgba(255,255,255,0.04)',
          top: -140, right: -140,
          transition: 'transform 3s ease',
          transform: phase === 'out' ? 'scale(1.15)' : 'scale(1)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 320, height: 320,
          background: 'rgba(255,255,255,0.05)',
          bottom: -80, left: -80,
          transition: 'transform 3s ease',
          transform: phase === 'out' ? 'scale(1.2)' : 'scale(1)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          opacity: phase === 'logo' || phase === 'text' || phase === 'tagline' ? 1 : 0,
          transform: phase === 'logo' ? 'scale(0.7) translateY(12px)' : 'scale(1) translateY(0)',
          marginBottom: 28,
        }}
      >
        <div className="relative" style={{ width: 80, height: 80 }}>
          <Image
            src="/icons/icon-192x192.png"
            alt="Corpers Connect"
            fill
            sizes="80px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Welcome text */}
      <div
        style={{
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          opacity: phase === 'text' || phase === 'tagline' ? 1 : 0,
          transform: phase === 'text' || phase === 'tagline' ? 'translateY(0)' : 'translateY(16px)',
          textAlign: 'center',
          padding: '0 32px',
        }}
      >
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Welcome to
        </p>
        <h1
          style={{
            color: '#ffffff',
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: -0.5,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Corpers Connect
        </h1>
        {firstName && (
          <p
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 18,
              fontWeight: 500,
              marginTop: 10,
            }}
          >
            Hey {firstName}! 👋
          </p>
        )}
      </div>

      {/* Tagline */}
      <div
        style={{
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          opacity: phase === 'tagline' ? 1 : 0,
          transform: phase === 'tagline' ? 'translateY(0)' : 'translateY(12px)',
          textAlign: 'center',
          padding: '0 40px',
          marginTop: 20,
        }}
      >
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Your social network for Nigeria&apos;s corps members.{'\n'}
          Connect. Grow. Thrive together.
        </p>
      </div>

      {/* Animated dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          display: 'flex',
          gap: 8,
          transition: 'opacity 0.5s ease',
          opacity: phase === 'tagline' ? 1 : 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
          40% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
