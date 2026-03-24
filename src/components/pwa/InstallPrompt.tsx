'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';

export default function InstallPrompt() {
  const { showPrompt, canInstall, isIosDevice, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/40"
            onClick={dismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            className="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) dismiss();
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1 text-foreground-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-5 pb-8 space-y-5">
              <div className="flex items-center gap-3 pt-2">
                <Logo size="md" variant="mark" />
                <div>
                  <p className="font-semibold text-foreground">Corpers Connect</p>
                  <p className="text-sm text-foreground-muted">Your NYSC Community</p>
                </div>
              </div>

              {isIosDevice ? (
                <IosInstructions />
              ) : (
                <AndroidInstructions onInstall={install} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function IosInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-secondary">
        Install Corpers Connect for the best experience — fast, offline-ready, and feels like a native app.
      </p>

      <div className="space-y-3">
        <Step number={1} icon={<Share className="h-5 w-5 text-primary" />}>
          Tap the <strong>Share</strong> button in Safari's toolbar
        </Step>
        <Step number={2} icon={<Plus className="h-5 w-5 text-primary" />}>
          Scroll down and tap <strong>"Add to Home Screen"</strong>
        </Step>
        <Step number={3} icon={<span className="text-lg">🏠</span>}>
          Tap <strong>Add</strong> to install
        </Step>
      </div>
    </div>
  );
}

function AndroidInstructions({ onInstall }: { onInstall: () => Promise<boolean> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-secondary">
        Add Corpers Connect to your home screen for a faster, app-like experience.
      </p>
      <Button
        fullWidth
        onClick={onInstall}
        className="mt-2"
      >
        Install App
      </Button>
    </div>
  );
}

function Step({
  number,
  icon,
  children,
}: {
  number: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-primary">{number}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-foreground-secondary">
        {icon}
        <span>{children}</span>
      </div>
    </div>
  );
}
