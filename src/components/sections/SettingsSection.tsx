'use client';

import { useUIStore } from '@/store/ui.store';
import AccountSettingsContent from '@/components/settings/AccountSettingsContent';

export default function SettingsSection() {
  const previousSection = useUIStore((s) => s.previousSection);
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  return (
    <AccountSettingsContent onBack={() => setActiveSection(previousSection)} />
  );
}
