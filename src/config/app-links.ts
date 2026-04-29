/**
 * Mobile app distribution links.
 *
 * The Android URL points to an EAS Build artifact. Each new EAS Build
 * produces a new URL — update ANDROID_INSTALL_URL whenever you publish
 * a new APK.
 *
 * The iOS native app is not yet shipped. While we wait for TestFlight,
 * iPhone users can install this web app as a PWA (Add to Home Screen).
 */

export const ANDROID_INSTALL_URL =
  'https://expo.dev/accounts/udofot.tsx/projects/corpers-connect/builds/8d03eda2-1a7d-4cd7-a765-6a36c2f9af82';

export const IOS_INSTALL_URL: string | null = null; // native app not yet available

/** PWA URL — the user web app itself, installable on iPhone via Safari "Add to Home Screen". */
export const WEB_APP_URL = 'https://www.corpersconnect.com.ng/login';
