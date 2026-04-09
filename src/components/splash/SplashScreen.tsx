'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Timing (ms) — synced to 6s audio ────────────────────────────────────────
const TOTAL_DURATION = 6400;
const PHASE_TIMING = {
  fragments: 0,       // 0s — polygon fragments fly in
  logoGlow: 1500,     // 1.5s — logo appears with glow
  tagline: 3000,      // 3.0s — "Connecting Nigerian Corps Members..."
  welcome: 4500,      // 4.5s — "WELCOME"
  flash: 5600,        // 5.6s — white flash
  exit: 6000,         // 6.0s — fade out (audio finishes)
};

type Phase = 'fragments' | 'logoGlow' | 'tagline' | 'welcome' | 'flash' | 'exit';

// ── Deterministic pseudo-random (same result on server + client) ────────────
function seeded(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Fragment data ───────────────────────────────────────────────────────────
// Each fragment starts off-screen and flies toward center
const FRAGMENTS = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * 360;
  const rad = (angle * Math.PI) / 180;
  const distance = 600 + seeded(i * 4) * 400;
  return {
    id: i,
    startX: Math.cos(rad) * distance,
    startY: Math.sin(rad) * distance,
    startRotate: seeded(i * 4 + 1) * 360 - 180,
    size: 12 + seeded(i * 4 + 2) * 24,
    delay: seeded(i * 4 + 3) * 0.4,
    isGreen: i % 3 !== 0,
  };
});

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>('fragments');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tryPlayAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/corperconnectsound.mp3');
      audioRef.current.volume = 0.7;
    }
    audioRef.current.play().catch(() => {
      // Browser blocked autoplay — try on first user interaction
      const handler = () => {
        audioRef.current?.play().catch(() => {});
        document.removeEventListener('touchstart', handler);
        document.removeEventListener('click', handler);
      };
      document.addEventListener('touchstart', handler, { once: true });
      document.addEventListener('click', handler, { once: true });
    });
  }, []);

  useEffect(() => {
    // Only show once per session
    if (typeof window !== 'undefined' && sessionStorage.getItem('cc_splash_shown')) {
      setVisible(false);
      return;
    }

    tryPlayAudio();

    const timers = Object.entries(PHASE_TIMING).map(([p, delay]) =>
      setTimeout(() => setPhase(p as Phase), delay)
    );
    const exitTimer = setTimeout(() => {
      setVisible(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cc_splash_shown', '1');
      }
    }, TOTAL_DURATION);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(exitTimer);
    };
  }, [tryPlayAudio]);

  const showFragments = true;
  const showLogo = phase !== 'fragments';
  const showTagline = phase === 'tagline' || phase === 'welcome' || phase === 'flash';
  const showWelcome = phase === 'welcome' || phase === 'flash';
  const showFlash = phase === 'flash';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          {/* ── Background: splash image with slow zoom ── */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1.0 }}
            transition={{ duration: 6, ease: 'easeOut' }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/corpersconnectsplashscreenimage.png')" }}
            />
            {/* Dark overlay for text contrast */}
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>

          {/* ── Polygon fragments flying inward ── */}
          {showFragments && (
            <div className="absolute inset-0 pointer-events-none">
              {FRAGMENTS.map((f) => (
                <motion.div
                  key={f.id}
                  className="absolute left-1/2 top-1/2"
                  initial={{
                    x: f.startX,
                    y: f.startY,
                    rotate: f.startRotate,
                    opacity: 0,
                  }}
                  animate={{
                    x: 0,
                    y: 0,
                    rotate: 0,
                    opacity: showLogo ? 0 : [0, 0.9, 0.7],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: f.delay,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <div
                    style={{
                      width: f.size,
                      height: f.size,
                      background: f.isGreen
                        ? 'linear-gradient(135deg, #008751, #00b368)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
                      clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                      boxShadow: f.isGreen
                        ? '0 0 12px rgba(0,135,81,0.5)'
                        : '0 0 12px rgba(255,255,255,0.3)',
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Logo assembly with glow ── */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={showLogo ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Glow ring behind logo */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 180,
                height: 180,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(0,135,81,0.4) 0%, transparent 70%)',
              }}
              animate={showLogo ? {
                scale: [1, 1.3, 1.1],
                opacity: [0, 0.8, 0.4],
              } : {}}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />

            {/* Pulse rings */}
            {showLogo && [0, 0.3, 0.6].map((delay) => (
              <motion.div
                key={delay}
                className="absolute rounded-full border border-white/20"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ width: 80, height: 80, opacity: 0.6 }}
                animate={{ width: 280, height: 280, opacity: 0 }}
                transition={{
                  delay: delay + 0.2,
                  duration: 1.5,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Logo image */}
            <div className="relative" style={{ width: 130, height: 130 }}>
              <img
                src="/corpers-connect-logo-without-background.png"
                alt="Corpers Connect"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* ── Tagline: "Connecting Nigerian Corps Members..." ── */}
          <AnimatePresence>
            {showTagline && !showWelcome && (
              <motion.p
                key="tagline"
                initial={{ opacity: 0, y: 20, letterSpacing: '-0.02em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.05em' }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute z-10 text-white/90 text-base font-medium tracking-wide"
                style={{ top: '62%' }}
              >
                Connecting Nigerian Corps Members...
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── WELCOME text ── */}
          <AnimatePresence>
            {showWelcome && !showFlash && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute z-10 flex flex-col items-center"
                style={{ top: '58%' }}
              >
                <h1
                  className="text-white font-extrabold tracking-widest"
                  style={{ fontSize: 'clamp(28px, 8vw, 42px)' }}
                >
                  WELCOME
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/70 text-sm font-medium mt-2"
                >
                  to CorpersConnect
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── White flash transition ── */}
          <AnimatePresence>
            {showFlash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute inset-0 z-20 bg-white"
              />
            )}
          </AnimatePresence>

          {/* ── Bottom accent line ── */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg, #008751, #00b368, #ffffff, #00b368, #008751)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 4, delay: 0.5, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
