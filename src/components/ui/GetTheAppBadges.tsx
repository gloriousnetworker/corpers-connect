'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Smartphone, Apple, Share, Plus, ArrowRight } from 'lucide-react';
import { ANDROID_INSTALL_URL, IOS_INSTALL_URL, WEB_APP_URL } from '@/config/app-links';

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
          onClick={() => setOpen('ios')}
          aria-label={IOS_INSTALL_URL ? 'Get the iOS app' : 'iOS app coming soon — install web app instead'}
          className={`${baseBadge} ${activeBadge}`}
        >
          <Apple className="w-7 h-7" strokeWidth={1.5} />
          <div className="text-left leading-tight">
            <div className="text-[10px] uppercase tracking-wide opacity-70">
              {IOS_INSTALL_URL ? 'Get it for' : 'Web app for'}
            </div>
            <div className="text-base font-semibold -mt-0.5">iPhone</div>
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
            ctaLabel="Open install page"
          />
        )}
        {open === 'ios' && !IOS_INSTALL_URL && (
          <IosPwaModal onClose={() => setOpen(null)} url={WEB_APP_URL} />
        )}
        {open === 'ios' && IOS_INSTALL_URL && (
          <QrModal
            onClose={() => setOpen(null)}
            title="Install Corpers Connect for iOS"
            subtitle="Scan the QR code with your iPhone, or open the link below."
            url={IOS_INSTALL_URL}
            ctaLabel="Open install page"
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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
        {children}
      </motion.div>
    </motion.div>
  );
}

function QrModal({
  onClose,
  title,
  subtitle,
  url,
  ctaLabel,
}: {
  onClose: () => void;
  title: string;
  subtitle: string;
  url: string;
  ctaLabel: string;
}) {
  return (
    <ModalShell onClose={onClose}>
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
        {ctaLabel}
      </a>
      <p className="mt-3 text-[11px] text-gray-400 text-center break-all">{url}</p>
    </ModalShell>
  );
}

function IosPwaModal({ onClose, url }: { onClose: () => void; url: string }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <Apple className="w-5 h-5 text-gray-900" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          Coming soon
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 pr-6">The iPhone app is on the way</h3>
      <p className="text-sm text-gray-500 mt-1">
        While we finish the App Store version, you can install our web app on your iPhone in seconds — it works just like a real app, with its own icon on your home screen.
      </p>

      <div className="flex justify-center my-5">
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <QRCodeCanvas value={url} size={176} level="M" includeMargin={false} />
        </div>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
        Install in 3 steps
      </p>
      <ol className="space-y-2 text-sm text-gray-700">
        <li className="flex gap-2">
          <span className="font-bold text-primary w-4">1.</span>
          <span>Open <span className="font-semibold">Safari</span> on your iPhone and scan the QR code (or visit the link).</span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-primary w-4">2.</span>
          <span>Tap the <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> Share icon at the bottom of the screen.</span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-primary w-4">3.</span>
          <span>Choose <span className="font-semibold">Add to Home Screen</span> <Plus className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> and tap <span className="font-semibold">Add</span>.</span>
        </li>
      </ol>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex items-center justify-center gap-2 w-full text-center bg-primary hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        Open the web app
        <ArrowRight className="w-4 h-4" />
      </a>
      <p className="mt-3 text-[11px] text-gray-400 text-center break-all">{url}</p>
    </ModalShell>
  );
}
