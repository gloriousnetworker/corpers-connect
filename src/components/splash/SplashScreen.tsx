'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/shared/Logo';

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
            initial={{ scale: 0.72, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Logo size="xl" variant="mark" white />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mt-6 text-white/90 text-xl font-bold tracking-tight"
          >
            Corpers Connect
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="mt-1 text-white text-sm"
          >
            Your NYSC Community
          </motion.p>

          {/* Pulse ring */}
          <motion.div
            className="absolute rounded-full border-2 border-white/20"
            initial={{ width: 80, height: 80, opacity: 0.6 }}
            animate={{ width: 180, height: 180, opacity: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
