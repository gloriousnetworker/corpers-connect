import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand — NYSC Green
        primary: {
          DEFAULT: '#008751',
          dark: '#006640',
          light: '#E8F5EE',
          foreground: '#FFFFFF',
        },
        // Premium / CORPER level
        gold: {
          DEFAULT: '#C8992A',
          light: '#FFF8E7',
          foreground: '#FFFFFF',
        },
        // Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#F8F9FA',
          alt: '#F1F3F4',
        },
        // Text
        foreground: {
          DEFAULT: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        // Semantic
        success: { DEFAULT: '#10B981', light: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', light: '#FEE2E2' },
        info: { DEFAULT: '#3B82F6', light: '#DBEAFE' },
        // Borders
        border: '#E5E7EB',
        input: '#F1F3F4',
        ring: '#008751',
        // shadcn/ui compat aliases — map to our design tokens
        muted: {
          DEFAULT: '#F1F3F4',
          foreground: '#9CA3AF',
        },
        background: '#F8F9FA',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // All at or above 16px ensures no iOS/Android zoom on inputs
        '2xs': ['11px', { lineHeight: '16px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      height: {
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        dvh: '100dvh',
      },
      minHeight: {
        dvh: '100dvh',
      },
      maxHeight: {
        dvh: '100dvh',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        'bottom-nav': '0 -1px 0 rgba(0,0,0,0.08)',
        sheet: '0 -4px 20px rgba(0,0,0,0.12)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-6px)' },
          '30%': { transform: 'translateX(6px)' },
          '45%': { transform: 'translateX(-4px)' },
          '60%': { transform: 'translateX(4px)' },
          '75%': { transform: 'translateX(-2px)' },
          '90%': { transform: 'translateX(2px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 1.5s infinite linear',
        'bounce-dot': 'bounce-dot 1.4s infinite ease-in-out both',
        shake: 'shake 0.5s ease-in-out',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
