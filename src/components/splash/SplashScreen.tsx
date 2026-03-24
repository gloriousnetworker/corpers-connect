'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const SPLASH_DURATION = 1600; // ms

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary"
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center"
          >
            {/* Logo — responsive: fills most of the screen width */}
            <div
              className="relative"
              style={{
                width: 'min(72vw, 360px)',
                height: 'min(33vw, 165px)',
              }}
            >
              <Image
                src="/corpers-connect-logo-without-background.png"
                alt="Corpers Connect"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Pulse ring */}
          <motion.div
            className="absolute rounded-full border-2 border-white/20"
            initial={{ width: 100, height: 100, opacity: 0.6 }}
            animate={{ width: 240, height: 240, opacity: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
