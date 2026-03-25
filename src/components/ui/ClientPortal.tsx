'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ClientPortalProps {
  children: React.ReactNode;
  /** CSS selector for the portal target. Defaults to #modal-root, falls back to document.body */
  selector?: string;
}

/**
 * Renders children into a DOM node outside the current React tree.
 * SSR-safe: renders nothing until mounted on the client.
 */
export default function ClientPortal({ children, selector = '#modal-root' }: ClientPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = document.querySelector(selector) ?? document.body;
  return createPortal(children, target);
}
