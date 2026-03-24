'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { REACTION_EMOJI, REACTION_LABEL } from '@/lib/constants';
import type { ReactionType } from '@/types/enums';

interface ReactionPickerProps {
  open: boolean;
  onPick: (type: ReactionType) => void;
  onClose: () => void;
}

const reactions = Object.entries(REACTION_EMOJI) as [ReactionType, string][];

export default function ReactionPicker({ open, onPick, onClose }: ReactionPickerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[150]" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-[151] bg-surface border border-border rounded-2xl shadow-xl px-3 py-2 flex items-center gap-1"
          >
            {reactions.map(([type, emoji]) => (
              <button
                key={type}
                onClick={() => { onPick(type); onClose(); }}
                className="flex flex-col items-center p-2 rounded-xl hover:bg-surface-alt transition-colors group"
                aria-label={REACTION_LABEL[type]}
              >
                <span className="text-2xl transition-transform group-hover:scale-125">{emoji}</span>
                <span className="text-[10px] text-foreground-muted mt-0.5 group-hover:text-foreground transition-colors">
                  {REACTION_LABEL[type]}
                </span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
