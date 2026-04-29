'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Smartphone, Apple } from 'lucide-react';
import { ANDROID_INSTALL_URL, IOS_INSTALL_URL } from '@/config/app-links';

type Platform = 'android' | 'ios';

interface Props {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function GetTheAppBadges({ className = '', variant = 'dark' }: Props) {
  const [open, setOpen] = useState<Platform | null>(null);

  const baseBadge =
    'flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all border';
  const activeBadge =
    variant === 'light'
      ? 'bg-black text-white border-white/10 hover:bg-black/80'
      : 'bg-black text-white border-black hover:bg-black/85';
  const disabledBadge =
    variant === 'light'
      ? 'bg-white/5 text-gray-400 border-white/10 cursor-not-allowed'
      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';

  return (
    <>
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <button
          onClick={() => setOpen('android')}
          aria-label="Get the Android app"
          className={`${baseBadge} ${activeBadge}`}
        >
          <Smartphone className="w-7 h-7" strokeWidth={1.5} />
          <div className="text-left leading-tight">
            <div className="text-[10px] uppercase tracking-wide opacity-70">Get it for</div>
            <div className="text-base font-semibold -mt-0.5">Android</div>
          </div>
        </button>

        <button
          disabled={!IOS_INSTALL_URL}
          onClick={() => IOS_INSTALL_URL && setOpen('ios')}
          aria-label="Coming soon for iOS"
          className={`${baseBadge} ${IOS_INSTALL_URL ? activeBadge : disabledBadge}`}
        >
          <Apple className="w-7 h-7" strokeWidth={1.5} />
          <div className="text-left leading-tight">
            <div className="text-[10px] uppercase tracking-wide opacity-70">
              {IOS_INSTALL_URL ? 'Get it for' : 'Coming soon'}
            </div>
            <div className="text-base font-semibold -mt-0.5">iOS</div>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {open === 'android' && (
          <QrModal
            onClose={() => setOpen(null)}
            title="Install Corpers Connect for Android"
            subtitle="Scan the QR code with your phone, or open the link below."
            url={ANDROID_INSTALL_URL}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function QrModal({
  onClose,
  title,
  subtitle,
  url,
}: {
  onClose: () => void;
  title: string;
  subtitle: string;
  url: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-gray-900 pr-6">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>

        <div className="flex justify-center my-6">
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <QRCodeCanvas value={url} size={208} level="M" includeMargin={false} />
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-primary hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Open install page
        </a>
        <p className="mt-3 text-[11px] text-gray-400 text-center break-all">{url}</p>
      </motion.div>
    </motion.div>
  );
}
